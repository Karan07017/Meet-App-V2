"use server";

import { authOptions } from "@/lib/auth";
import { StreamClient } from "@stream-io/node-sdk";
import { StreamChat } from "stream-chat";
import { getServerSession } from "next-auth";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY as string;
const apiSecret = process.env.STREAM_SECRET_KEY as string;

export interface VerifiedChatAuth {
  token: string;
  userId: string;
  userName: string;
  apiKey: string;
}

/**
 * Verifies that the current user is authenticated via NextAuth
 * and authorized to join the meeting. Server-side registers the user
 * as a member of the Stream Chat channel for the given meeting ID,
 * and generates a Stream user token with a clock-skew buffer.
 */
export async function getChatTokenAndVerifyMeeting(meetingId: string): Promise<VerifiedChatAuth> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    throw new Error("Unauthorized: User not logged in");
  }

  if (!meetingId) {
    throw new Error("Invalid meeting ID");
  }

  if (!apiKey || !apiSecret) {
    throw new Error("Stream credentials are missing on the server");
  }

  const videoClient = new StreamClient(apiKey, apiSecret);

  // 1. Verify meeting exists and user has access via Stream Video server client
  try {
    const { calls } = await videoClient.video.queryCalls({
      filter_conditions: { id: meetingId },
    });

    if (!calls || calls.length === 0) {
      throw new Error("Meeting call not found or access denied");
    }
  } catch (error) {
    console.error("Server verification failed for meeting:", meetingId, error);
    throw new Error("Unauthorized access to meeting chat");
  }

  // 2. Server-side Stream Chat initialization & member authorization
  try {
    const serverChatClient = StreamChat.getInstance(apiKey, apiSecret);

    // Upsert user profile in Stream Chat
    await serverChatClient.upsertUser({
      id: session.user.id,
      name: session.user.name || "Participant",
    });

    // Create channel and add authenticated user as an explicit member
    const chatChannel = serverChatClient.channel("messaging", meetingId, {
      created_by_id: session.user.id,
    });

    await chatChannel.create();
    await chatChannel.addMembers([session.user.id]);
  } catch (chatErr) {
    console.error("Failed to authorize user on Stream Chat channel:", chatErr);
    throw new Error("Failed to initialize meeting chat membership");
  }

  // 3. Generate user token with 60-second clock skew buffer
  const validityInSeconds = 60 * 60; // 1 hour token
  const now = Math.floor(Date.now() / 1000);
  const token = videoClient.generateUserToken({
    user_id: session.user.id,
    validity_in_seconds: validityInSeconds,
    issued_at: now - 60,
  });

  return {
    token,
    userId: session.user.id,
    userName: session.user.name || "Participant",
    apiKey,
  };
}
