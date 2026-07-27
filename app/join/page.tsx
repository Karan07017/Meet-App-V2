"use client"
import NavBar from '@/components/NavBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogIn } from 'lucide-react';
import { redirect } from 'next/navigation';
import React, { useState } from 'react'

const Join = () => {
    const [meetingId, setMeetingId] = useState("");
    return (
        <div className="app-gradient-bg h-screen overflow-hidden">
            <NavBar />
            <div className="w-full h-[calc(100vh-64px)] flex justify-center items-center px-4">

                <div className='w-[90%] sm:w-[450px] rounded-3xl glass-panel shadow-2xl shadow-black/40 flex flex-col justify-center items-center gap-6 px-8 py-12 animate-fade-in-up'>
                    <div className='flex flex-col items-center gap-1.5 mb-2 text-center'>
                        <h1 className='text-2xl sm:text-3xl font-bold text-white tracking-tight'>Join a Meeting</h1>
                        <p className='text-sm sm:text-base text-zinc-400'>Enter a meeting ID to jump right in</p>
                    </div>
                    <Input className='bg-white/5 border-white/15 w-[90%] h-12 text-white placeholder:text-zinc-500 rounded-xl focus-visible:ring-indigo-500' placeholder='Meeting Id' onChange={(e) => setMeetingId(e.target.value)} />
                    <Button onClick={() => {
                        if (meetingId != "") redirect(`/meeting/${meetingId}`)
                    }} className='text-xl sm:text-2xl py-7 px-10 rounded-2xl w-[240px] flex items-center justify-center gap-2 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white shadow-lg shadow-indigo-950/50 hover:shadow-xl hover:shadow-indigo-900/50 hover:scale-[1.03] hover:brightness-110 active:scale-[0.98] transition-all duration-300'>
                        <LogIn size={22} strokeWidth={2.2} />
                        Join <span className='font-extrabold'>MEET</span>
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default Join