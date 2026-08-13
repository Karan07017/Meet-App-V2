'use client';
import { useState } from 'react';
import {
  CallParticipantsList,
  CallStatsButton,
  CallingState,
  CancelCallButton,
  PaginatedGridLayout,
  ScreenShareButton,
  SpeakerLayout,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, LayoutList, MessageSquare } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import Loader from './Loader';
import { cn } from '@/lib/utils';
import EndCallButton from './EndCallButton';
import MeetingChat from './chat/MeetingChat';

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right';

const MeetingRoom = () => {
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get('personal');
  const router = useRouter();
  const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const call = useCall();
  const meetingId = call?.id;
  const { useCallCallingState } = useCallStateHooks();

  const callingState = useCallCallingState();

  if (callingState !== CallingState.JOINED) return <Loader />;

  const CallLayout = () => {
    switch (layout) {
      case 'grid':
        return <PaginatedGridLayout />;
      case 'speaker-right':
        return <SpeakerLayout participantsBarPosition="right" />;
      default:
        return <SpeakerLayout participantsBarPosition="left" />;
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden pt-4 text-white">
      {/* Main Content Area: Video + Sidebars (Participants / Chat) */}
      <div className="relative flex h-[calc(100vh-96px)] w-full items-center justify-center px-4">
        <div
          className={cn('flex h-full items-center justify-center transition-all duration-300', {
            'flex-1 min-w-0': showChat || showParticipants,
            'w-full max-w-[1000px]': !showChat && !showParticipants,
          })}
        >
          <CallLayout />
        </div>

        {showParticipants && (
          <div className="h-full ml-3 w-[320px] hidden sm:block z-20 shrink-0">
            <CallParticipantsList onClose={() => setShowParticipants(false)} />
          </div>
        )}

        {showChat && meetingId && (
          <div className="h-full w-[360px] ml-3 hidden sm:block z-20 shrink-0">
            <MeetingChat
              meetingId={meetingId}
              isOpen={showChat}
              onClose={() => setShowChat(false)}
              onUnreadChange={(count) => setUnreadCount(count)}
            />
          </div>
        )}

        {/* Mobile Chat Overlay Drawer */}
        {showChat && meetingId && (
          <div className="fixed inset-x-4 top-16 bottom-24 z-40 sm:hidden">
            <MeetingChat
              meetingId={meetingId}
              isOpen={showChat}
              onClose={() => setShowChat(false)}
              onUnreadChange={(count) => setUnreadCount(count)}
            />
          </div>
        )}
      </div>

      {/* Floating Bottom Control Bar */}
      <div className="fixed bottom-0 left-0 right-0 flex w-full items-center justify-center gap-5 flex-wrap pb-4 z-30 pointer-events-none">
        <div className="glass-pill rounded-2xl px-3 py-2 shadow-lg shadow-black/30 flex items-center gap-3 flex-wrap justify-center pointer-events-auto">
          <ToggleAudioPublishingButton />
          <ToggleVideoPublishingButton />
          <ScreenShareButton />
          <CancelCallButton onLeave={() => router.push(`/`)} />

          <DropdownMenu>
            <div className="flex items-center">
              <DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-white/5 border border-white/10 px-4 py-2 hover:bg-white/15 transition-colors duration-200">
                <LayoutList size={20} className="text-white" />
              </DropdownMenuTrigger>
            </div>
            <DropdownMenuContent className="border-white/10 bg-zinc-900/95 backdrop-blur-xl text-white">
              {['Grid', 'Speaker-Left', 'Speaker-Right'].map((item, index) => (
                <div key={index}>
                  <DropdownMenuItem
                    className="cursor-pointer focus:bg-white/10 focus:text-white"
                    onClick={() =>
                      setLayout(item.toLowerCase() as CallLayoutType)
                    }
                  >
                    {item}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <CallStatsButton />

          <button
            onClick={() => {
              setShowParticipants((prev) => !prev);
              if (!showParticipants) setShowChat(false);
            }}
            title="Participants"
          >
            <div className="cursor-pointer rounded-2xl bg-white/5 border border-white/10 px-4 py-2 hover:bg-white/15 transition-colors duration-200">
              <Users size={20} className="text-white" />
            </div>
          </button>

          <button
            onClick={() => {
              setShowChat((prev) => !prev);
              if (!showChat) setShowParticipants(false);
            }}
            className="relative"
            title="Chat"
          >
            <div className="cursor-pointer rounded-2xl bg-white/5 border border-white/10 px-4 py-2 hover:bg-white/15 transition-colors duration-200 flex items-center gap-1.5">
              <MessageSquare size={20} className="text-white" />
            </div>
            {unreadCount > 0 && !showChat && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {!isPersonalRoom && <EndCallButton />}
        </div>
      </div>
    </section>
  );
};

export default MeetingRoom;