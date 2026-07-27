"use client"
import React from 'react'
import { Button } from './ui/button'
import { Video } from 'lucide-react'
import { useSession } from 'next-auth/react';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';

import { useRouter } from 'next/navigation';

import { useToast } from "@/hooks/use-toast"


const StartMeetingBtn = () => {
  const { data: session } = useSession();

  const client = useStreamVideoClient();

  const router = useRouter();

  const { toast } = useToast()

  async function createMeeting() {
    if (!client || !session) return;

    try {
      const callId = crypto.randomUUID();
      const call = client.call('default', callId);

      if (!call) throw new Error("failed to create call");

      await call.getOrCreate();
      router.push(`/meeting/${call.id}`);

      toast({
        title: "Meeting created"
      })

    } catch (e) {
      console.log(e);
      toast({
        title: "Failed to create Meeting"
      })
    }
  }
  return (
    <Button onClick={createMeeting} className='text-2xl sm:text-3xl py-8 px-10 rounded-2xl w-[270px] flex items-center justify-center gap-2 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white shadow-lg shadow-indigo-950/50 hover:shadow-xl hover:shadow-indigo-900/50 hover:scale-[1.03] hover:brightness-110 active:scale-[0.98] transition-all duration-300'>
      <Video className='shrink-0' size={26} strokeWidth={2.2} />
      Start <span className='font-extrabold'>MEET</span>
    </Button>
  )
}

export default StartMeetingBtn