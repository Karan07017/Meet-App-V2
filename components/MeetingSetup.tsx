"use client"
import { CallingState, DeviceSettings, useCall, useCallStateHooks, VideoPreview } from '@stream-io/video-react-sdk';
import React, { useEffect, useState } from 'react'
import { Button } from './ui/button';

const MeetingSetup = ({ setIsSetUpComplete }: { setIsSetUpComplete: (val: boolean) => void }) => {
    const [isMicCamToggledOn, setIsMicCamToggledOn] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);

    const call = useCall();
    if (!call) throw new Error("call is not there");

    const { useCallCallingState } = useCallStateHooks();
    const callingState = useCallCallingState();

    useEffect(() => {
        if (isMicCamToggledOn) {
            call?.camera.disable();
            call?.microphone.disable();
        } else {
            call?.camera.enable();
            call?.microphone.enable();
        }
    }, [isMicCamToggledOn, call?.camera, call?.microphone])

    const handleJoin = async () => {
        // Guards against a double-click (or a slow first click still in
        // flight) firing `call.join()` a second time on the same call,
        // which the SDK rejects.
        if (isJoining) return;

        setJoinError(null);
        setIsJoining(true);
        try {
            if (callingState !== CallingState.JOINED) {
                // Awaiting this (instead of the previous fire-and-forget
                // `call?.join()`) means we only advance to <MeetingRoom />
                // once the SDK has actually confirmed the call reached
                // `CallingState.JOINED`. Previously, `setIsSetUpComplete(true)`
                // ran unconditionally and immediately, regardless of
                // whether the join had succeeded, finished, or even been
                // given a chance to start — so any failure or slow join
                // surfaced downstream as MeetingRoom's loader spinning
                // forever with no visible error.
                await call.join();
            }
            setIsSetUpComplete(true);
        } catch (err) {
            console.error("Failed to join call:", err);
            setJoinError("Couldn't join the meeting. Please try again.");
            setIsJoining(false);
        }
    };

    return (
        <div className='h-screen w-full flex-col flex justify-center items-center gap-5 text-white app-gradient-bg px-4'>
            <h1 className='text-2xl sm:text-3xl font-bold tracking-tight animate-fade-in'>Ready to join?</h1>

            <div className='rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 animate-fade-in-up'>
                <VideoPreview />
            </div>
            <div className='flex flex-wrap h-16 items-center justify-center gap-4 glass-pill rounded-2xl px-5'>
                <label className='flex items-center justify-center gap-2 font-medium cursor-pointer select-none'>
                    <input type="checkbox" className='accent-indigo-500 w-4 h-4 cursor-pointer' checked={isMicCamToggledOn} onChange={(e) => setIsMicCamToggledOn(e.target.checked)} />
                    Join with Mic and Camera Off
                </label>
                <DeviceSettings />
            </div>

            {joinError && (
                <p className='text-sm text-red-400' role="alert">{joinError}</p>
            )}

            <Button
                disabled={isJoining}
                className='bg-gradient-to-br from-emerald-500 to-green-600 hover:brightness-110 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 rounded-2xl px-8 py-6 text-lg font-semibold shadow-lg shadow-green-950/40 disabled:opacity-60 disabled:pointer-events-none'
                onClick={handleJoin}
            >
                {isJoining ? 'Joining…' : 'Join MEETing'}
            </Button>
        </div>
    )
}

export default MeetingSetup