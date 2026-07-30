'use client';
import { useState } from 'react';
import {
  CallControls,
  CallParticipantsList,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
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
import MeetingChatPanel from './MeetingChatPanel';

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right';

const MeetingRoom = () => {
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get('personal');
  const router = useRouter();
  const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const { useCallCallingState } = useCallStateHooks();
  const call = useCall();

  const callingState = useCallCallingState();

  if (callingState !== CallingState.JOINED) return <Loader />;

  // Reuse the call id (the SDK's meeting id) as the chat channel key so
  // every participant of this meeting lands in the same
  // `meeting_<meetingId>` Stream Chat channel — no extra id needed.
  const meetingId = call?.id;

  const toggleChat = () => {
    setShowChat((prev) => !prev);
    setShowParticipants(false);
  };

  const toggleParticipants = () => {
    setShowParticipants((prev) => !prev);
    setShowChat(false);
  };

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
      <div className="relative flex size-full items-start justify-center">
        <div className=" flex size-full max-w-[1000px] items-center">
          <CallLayout />
        </div>
        {showParticipants && <div
          className={cn('h-[calc(100vh-86px)] ml-2', {
            'show-block': showParticipants,
          })}
        >
          <CallParticipantsList onClose={() => setShowParticipants(false)} />
        </div>
        }
        {showChat && meetingId && (
          <MeetingChatPanel
            meetingId={meetingId}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>

      <div className="fixed bottom-0 flex w-full items-center justify-center gap-5 flex-wrap pb-4 pointer-events-none">
        <div className="glass-pill rounded-2xl px-3 py-2 shadow-lg shadow-black/30 flex items-center gap-3 flex-wrap justify-center pointer-events-auto">
        <CallControls onLeave={() => router.push(`/`)} />

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
        <button onClick={toggleChat}>
          <div
            className={cn(
              'cursor-pointer rounded-2xl bg-white/5 border border-white/10 px-4 py-2 hover:bg-white/15 transition-colors duration-200',
              { 'bg-white/15': showChat },
            )}
          >
            <MessageSquare size={20} className="text-white" />
          </div>
        </button>
        <button onClick={toggleParticipants}>
          <div className="cursor-pointer rounded-2xl bg-white/5 border border-white/10 px-4 py-2 hover:bg-white/15 transition-colors duration-200">
            <Users size={20} className="text-white" />
          </div>
        </button>
        {!isPersonalRoom && <EndCallButton />}
        </div>
      </div>
    </section>
  );
};

export default MeetingRoom;