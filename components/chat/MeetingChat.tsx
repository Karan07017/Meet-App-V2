"use client";

import React, { useEffect, useState, useRef } from "react";
import { StreamChat, Channel as StreamChannel } from "stream-chat";
import {
  Chat,
  Channel,
  Window,
  MessageList,
  MessageComposer,
} from "stream-chat-react";
import "stream-chat-react/dist/css/index.css";
import { getChatTokenAndVerifyMeeting } from "@/actions/chat.actions";
import Loader from "@/components/Loader";
import { X, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MeetingChatProps {
  meetingId: string;
  isOpen: boolean;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
}

export default function MeetingChat({
  meetingId,
  isOpen,
  onClose,
  onUnreadChange,
}: MeetingChatProps) {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen && channel) {
      channel.markRead();
      onUnreadChange?.(0);
    }
  }, [isOpen, channel, onUnreadChange]);

  useEffect(() => {
    let isMounted = true;
    let clientInstance: StreamChat | null = null;

    async function initChat() {
      try {
        setLoading(true);
        setError(null);

        // 1. Verify meeting access and retrieve user token from server action
        const authData = await getChatTokenAndVerifyMeeting(meetingId);
        if (!isMounted) return;

        // 2. Instantiate or reuse StreamChat client singleton
        clientInstance = StreamChat.getInstance(authData.apiKey);

        // 3. Connect user if not already connected
        if (!clientInstance.userID || clientInstance.userID !== authData.userId) {
          if (clientInstance.userID) {
            await clientInstance.disconnectUser();
          }
          await clientInstance.connectUser(
            {
              id: authData.userId,
              name: authData.userName,
            },
            authData.token
          );
        }

        // 4. Get/Watch channel for this specific meeting
        const chatChannel = clientInstance.channel("messaging", meetingId);

        await chatChannel.watch();

        if (!isMounted) return;

        setChatClient(clientInstance);
        setChannel(chatChannel);

        // 5. Unread counter listener
        const handleNewMessage = (event: { user?: { id?: string } }) => {
          if (event.user?.id !== authData.userId && !isOpenRef.current) {
            const count = chatChannel.state.unreadCount || 1;
            onUnreadChange?.(count);
          }
        };

        chatChannel.on("message.new", handleNewMessage);
      } catch (err: unknown) {
        console.error("Failed to initialize Stream Chat:", err);
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to load chat";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (meetingId) {
      initChat();
    }

    return () => {
      isMounted = false;
      if (channel) {
        channel.off("message.new", () => {});
      }
      if (clientInstance) {
        clientInstance.disconnectUser().catch((err) => {
          console.error("Error disconnecting Stream Chat client:", err);
        });
      }
    };
  }, [meetingId, onUnreadChange]);

  if (loading) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-6 text-white">
        <Loader />
        <p className="mt-3 text-sm text-zinc-400">Loading meeting chat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-white">
        <AlertCircle size={36} className="text-red-400 mb-2" />
        <p className="font-semibold text-red-200">Unable to load chat</p>
        <p className="text-xs text-zinc-400 mt-1">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="mt-4 border-white/20 text-white hover:bg-white/10"
        >
          Close
        </Button>
      </div>
    );
  }

  if (!chatClient || !channel) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950/90 text-white rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden meet-chat-container">
      {/* Custom Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-white/5">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-indigo-400" />
          <h3 className="font-semibold text-sm tracking-tight">Meeting Chat</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          title="Close Chat"
        >
          <X size={18} />
        </button>
      </div>

      {/* Stream Chat UI Component */}
      <div className="flex-1 overflow-hidden str-chat-theme-dark">
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
}

