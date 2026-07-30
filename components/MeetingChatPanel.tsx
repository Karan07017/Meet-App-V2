"use client"

import { useSession } from "next-auth/react";
import { useStreamChatClient } from "@/hooks/useStreamChatClient";
import { useMeetingChatChannel } from "@/hooks/useMeetingChatChannel";
import MeetingChat from "./MeetingChat";

interface MeetingChatPanelProps {
    meetingId: string;
    onClose: () => void;
}

/**
 * Owns the Stream Chat connection + channel lifecycle for this meeting.
 * Rendered only while `MeetingRoom` has the chat panel toggled on, which is
 * what satisfies "chat is only available while inside a meeting" — there's
 * no chat client wired into the root layout the way `StreamClientProvider`
 * wires up the video client.
 */
const MeetingChatPanel = ({ meetingId, onClose }: MeetingChatPanelProps) => {
    const { data: session } = useSession();
    const chatClient = useStreamChatClient();
    const { channel, isLoading, error } = useMeetingChatChannel(
        chatClient,
        meetingId,
    );

    const currentUserId = session?.user?.id;

    if (error) {
        return (
            <div className="ml-2 flex h-[calc(100vh-86px)] w-[320px] shrink-0 items-center justify-center rounded-2xl glass-pill p-4 text-center text-sm text-white/60 shadow-lg shadow-black/30">
                {error}
            </div>
        );
    }

    if (isLoading || !channel || !currentUserId) {
        return (
            <div className="ml-2 flex h-[calc(100vh-86px)] w-[320px] shrink-0 items-center justify-center rounded-2xl glass-pill shadow-lg shadow-black/30">
                <div
                    className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/70"
                    role="status"
                >
                    <span className="sr-only">Loading chat...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="ml-2">
            <MeetingChat
                channel={channel}
                currentUserId={currentUserId}
                onClose={onClose}
            />
        </div>
    );
};

export default MeetingChatPanel;