"use client"

import type { Channel as StreamChannel, StreamChat } from "stream-chat";
import {
    Chat,
    Channel,
    Window,
    MessageList,
    MessageComposer,
} from "stream-chat-react";
import { X } from "lucide-react";
import "stream-chat-react/dist/css/index.css";

interface MeetingChatWindowProps {
    chatClient: StreamChat;
    channel: StreamChannel;
    onClose: () => void;
}

/**
 * Renders the actual in-meeting chat UI using ONLY official Stream Chat
 * React components. `Channel` owns rendering the messages and the
 * composer; `MessageList` and `MessageComposer` handle message syncing,
 * event subscriptions, and auto-scroll internally — none of that is
 * implemented by hand here.
 *
 * The header (title + close button) is app chrome, not chat logic, so it
 * stays custom to match the rest of the meeting UI's glass-pill styling.
 */
const MeetingChatWindow = ({
    chatClient,
    channel,
    onClose,
}: MeetingChatWindowProps) => {
    return (
        <div className="flex h-[calc(100vh-86px)] w-[320px] shrink-0 flex-col overflow-hidden rounded-2xl glass-pill shadow-lg shadow-black/30">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <h2 className="text-sm font-semibold text-white">In-call messages</h2>
                <button
                    onClick={onClose}
                    className="rounded-lg p-1 text-white/70 transition-colors duration-200 hover:bg-white/10 hover:text-white"
                    aria-label="Close chat"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="min-h-0 flex-1">
                <Chat client={chatClient} theme="str-chat__theme-dark">
                    <Channel channel={channel}>
                        <Window>
                            <MessageList />
                            <MessageComposer />
                        </Window>
                    </Channel>
                </Chat>
            </div>
        </div>
    );
};

export default MeetingChatWindow;