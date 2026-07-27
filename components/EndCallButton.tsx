'use client';

import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';

import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

const EndCallButton = () => {
    const call = useCall();
    const router = useRouter();

    if (!call)
        throw new Error(
            'useStreamCall must be used within a StreamCall component.',
        );

    const { useLocalParticipant } = useCallStateHooks();
    const localParticipant = useLocalParticipant();

    const isMeetingOwner =
        localParticipant &&
        call.state.createdBy &&
        localParticipant.userId === call.state.createdBy.id;

    if (!isMeetingOwner) return null;

    const endCall = async () => {
        await call.endCall();
        router.push('/');
    };

    return (
        <Button onClick={endCall} className="bg-gradient-to-br from-red-500 to-rose-600 hover:brightness-110 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 rounded-2xl shadow-lg shadow-red-950/40">
            End call for everyone
        </Button>
    );
};

export default EndCallButton;