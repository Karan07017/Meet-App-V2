"use client"

import { useEffect, useState } from "react";
import type { Channel, StreamChat } from "stream-chat";

/**
 * Every meeting gets exactly one Stream Chat channel: `meeting_<meetingId>`.
 * All participants of the same meeting call `channel.watch()` on the same
 * channel id, so they land in the same real-time conversation.
 *
 * Uses Stream's built-in "messaging" channel type — no custom channel type
 * needs to be configured on the Stream dashboard.
 *
 * This hook only creates and watches the channel. Rendering messages,
 * sending them, keeping the list in sync, and auto-scrolling is entirely
 * handled by the official `stream-chat-react` components (`Channel`,
 * `MessageList`, `MessageComposer`) once they're handed this channel.
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

        const meetingChannel = chatClient.channel(
            "messaging",
            `meeting_${meetingId}`,
        );

        meetingChannel
            .watch()
            .then(() => {
                if (cancelled) return;
                setChannel(meetingChannel);
                setIsLoading(false);
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
