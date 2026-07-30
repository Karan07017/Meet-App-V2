"use server"

import { authOptions } from "@/lib/auth";
import { StreamClient } from "@stream-io/node-sdk";
import { getServerSession } from "next-auth";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY as string;
const apiSecret = process.env.STREAM_SECRET_KEY as string;

export const tokenProvider = async ()=>{
    const session = await getServerSession(authOptions);

    if(!session) throw new Error('user not logged in');

    const user = session.user;
    const client = new StreamClient(apiKey, apiSecret);
    const vailidity = 60 * 60;
    const token = client.generateUserToken({user_id: user.id, validity_in_seconds: vailidity});

    return token;
}

/**
 * Grants the current (server-authenticated) user membership on the given
 * meeting's Stream Chat channel (`messaging:meeting_<meetingId>`).
 *
 * Why this exists: Stream's "messaging" channel type only allows members
 * to read/watch a channel. The client SDK auto-adds the *creator* as a
 * member the first time `channel.watch()` implicitly creates the channel
 * (typically the host, who opens the chat first). Every participant who
 * joins afterwards calls `channel.watch()` on a channel that already
 * exists, so the SDK does NOT add them as a member — Stream then rejects
 * their `ReadChannel` request with a 403 (error code 17), which is
 * exactly the "Chat is unavailable right now." failure.
 *
 * A regular "user"-role token can't add itself as a member of someone
 * else's channel (that's the permission Stream is correctly denying).
 * So this runs server-side with the API secret (admin-level access) and
 * upserts the user + calls `getOrCreate` with `data.members` — which is
 * idempotent: it creates the channel if it doesn't exist yet, or simply
 * adds this user as a member if it already does. Every participant must
 * call this (via `useMeetingChatChannel`) before watching the channel
 * client-side.
 */
export const ensureMeetingChatAccess = async (meetingId: string) => {
    const session = await getServerSession(authOptions);

    if (!session) throw new Error('user not logged in');

    const user = session.user;
    const client = new StreamClient(apiKey, apiSecret);

    // Make sure the user exists in Stream's system before referencing
    // them as a channel member (cheap no-op if they already do).
    await client.upsertUsers([
        {
            id: user.id,
            name: user.name ?? undefined,
            image: user.image ?? undefined,
        },
    ]);

    const channel = client.chat.channel("messaging", `meeting_${meetingId}`);

    await channel.getOrCreate({
        data: {
            created_by_id: user.id,
            members: [{ user_id: user.id }],
        },
    });
};