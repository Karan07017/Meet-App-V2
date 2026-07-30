"use client"

import { useEffect, useState } from "react";
import type { Channel, StreamChat } from "stream-chat";
import { ensureMeetingChatAccess } from "@/actions/stream.actions";

/**
 * Every meeting gets exactly one Stream Chat channel: `meeting_<meetingId>`.
 * All participants of the same meeting call `channel.watch()` on the same
 * channel id, so they land in the same real-time conversation.
 *
 * Uses Stream's built-in "messaging" channel type — no custom channel type
 * needs to be configured on the Stream dashboard.
 *
 * Stream's "messaging" channel type only lets *members* read/watch a
 * channel. `channel.watch()` only auto-adds the calling user as a member
 * when it's the one implicitly creating the channel — i.e. the first
 * person to open chat in a given meeting (usually the host). Every
 * participant who joins afterwards is watching a channel that already
 * exists, so the client SDK does NOT add them as a member, and Stream
 * rejects their read with a 403 (error code 17, "ReadChannel"). A
 * regular user-role token can't add itself as a member of an existing
 * channel, so `ensureMeetingChatAccess` (actions/stream.actions.ts) runs
 * server-side with admin credentials to guarantee membership before this
 * hook watches the channel client-side.
 *
 * This hook only ensures access, creates, and watches the channel.
 * Rendering messages, sending them, keeping the list in sync, and
 * auto-scrolling is entirely handled by the official `stream-chat-react`
 * components (`Channel`, `MessageList`, `MessageComposer`) once they're
 * handed this channel.
 */
export function useMeetingChatChannel(
    chatClient: StreamChat | undefined,
    meetingId: string | undefined,
) {
    const [channel, setChannel] = useState<Channel>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!chatClient || !meetingId) return;

        let cancelled = false;
        setIsLoading(true);
        setError(null);

        ensureMeetingChatAccess(meetingId)
            .then(() => {
                if (cancelled) return;

                const meetingChannel = chatClient.channel(
                    "messaging",
                    `meeting_${meetingId}`,
                );

                return meetingChannel.watch().then(() => {
                    if (cancelled) return;
                    setChannel(meetingChannel);
                    setIsLoading(false);
                });
            })
            .catch((err) => {
                console.error("Failed to watch meeting chat channel:", err);
                if (cancelled) return;
                setError("Chat is unavailable right now.");
                setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [chatClient, meetingId]);

    return { channel, isLoading, error };
}