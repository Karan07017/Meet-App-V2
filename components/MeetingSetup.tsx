"use client"
import { DeviceSettings, useCall, VideoPreview } from '@stream-io/video-react-sdk';
import React, { useEffect, useState } from 'react'
import { Button } from './ui/button';

const MeetingSetup = ({ setIsSetUpComplete }: { setIsSetUpComplete: (val: boolean) => void }) => {
    const [isMicCamToggledOn, setIsMicCamToggledOn] = useState(false);

    const call = useCall();
    if (!call) throw new Error("call is not there");
    useEffect(() => {
        if (isMicCamToggledOn) {
            call?.camera.disable();
            call?.microphone.disable();
        } else {
            call?.camera.enable();
            call?.microphone.enable();
        }
    }, [isMicCamToggledOn, call?.camera, call?.microphone])
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

            <Button className='bg-gradient-to-br from-emerald-500 to-green-600 hover:brightness-110 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 rounded-2xl px-8 py-6 text-lg font-semibold shadow-lg shadow-green-950/40' onClick={() => {
                call?.join();
                setIsSetUpComplete(true);
            }}>Join MEETing</Button>
        </div>
    )
}

export default MeetingSetup