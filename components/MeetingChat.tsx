"use client"

import { useCallback, useEffect, useRef, useState } from "react";
import type { Channel } from "stream-chat";
import { Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatMessage = Channel["state"]["messages"][number];

interface MeetingChatProps {
    channel: Channel;
    currentUserId: string;
    onClose: () => void;
}

const formatTime = (value: ChatMessage["created_at"]) => {
    const date = value instanceof Date ? value : new Date(value as string);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const MeetingChat = ({ channel, currentUserId, onClose }: MeetingChatProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>(
        () => channel.state.messages,
    );
    const [draft, setDraft] = useState("");
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Mirror the channel's live message state into local state. This is
    // what makes messages from other participants show up in real time —
    // `useMeetingChatChannel`'s `watch()` call already hydrates
    // `channel.state.messages` with prior history before this component
    // mounts, and these listeners keep it in sync afterwards.
    useEffect(() => {
        const syncFromChannel = () => setMessages([...channel.state.messages]);

        syncFromChannel();

        channel.on("message.new", syncFromChannel);
        channel.on("message.updated", syncFromChannel);
        channel.on("message.deleted", syncFromChannel);

        return () => {
            channel.off("message.new", syncFromChannel);
            channel.off("message.updated", syncFromChannel);
            channel.off("message.deleted", syncFromChannel);
        };
    }, [channel]);

    // Auto scroll to the latest message.
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, [messages]);

    const handleSend = useCallback(async () => {
        const text = draft.trim();
        if (!text || isSending) return;

        setIsSending(true);
        setDraft("");
        try {
            await channel.sendMessage({ text });
        } catch (err) {
            console.error("Failed to send chat message:", err);
            // Give the message back so the user doesn't lose what they typed.
            setDraft(text);
        } finally {
            setIsSending(false);
        }
    }, [draft, isSending, channel]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

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

            <div
                ref={scrollRef}
                className="flex-1 space-y-4 overflow-y-auto px-4 py-3"
            >
                {messages.length === 0 && (
                    <p className="mt-6 text-center text-sm text-white/40">
                        No messages yet. Say hello 👋
                    </p>
                )}
                {messages.map((message) => {
                    const isOwn = message.user?.id === currentUserId;
                    return (
                        <div key={message.id} className="flex flex-col">
                            <div className="flex items-baseline gap-2">
                                <span
                                    className={cn(
                                        "text-xs font-medium",
                                        isOwn ? "text-indigo-300" : "text-white/80",
                                    )}
                                >
                                    {isOwn ? "You" : message.user?.name ?? "Guest"}
                                </span>
                                <span className="text-[10px] text-white/40">
                                    {formatTime(message.created_at)}
                                </span>
                            </div>
                            <p className="mt-0.5 break-words text-sm text-white/90">
                                {message.text}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center gap-2 border-t border-white/10 p-3">
                <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Send a message"
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/25"
                />
                <button
                    onClick={handleSend}
                    disabled={!draft.trim() || isSending}
                    className="flex cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 px-3 py-2 text-white transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Send message"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
};

export default MeetingChat;