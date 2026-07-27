"use client"
import React from 'react'
import { Button } from './ui/button'
import { LogIn } from 'lucide-react'
import { redirect } from 'next/navigation'

const JoinMeetingBtn = () => {


  return (
    <Button onClick={() => redirect('/join')} className='text-2xl sm:text-3xl py-8 px-10 rounded-2xl w-[270px] flex items-center justify-center gap-2 text-white glass-pill hover:bg-white/15 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300'>
      <LogIn className='shrink-0' size={26} strokeWidth={2.2} />
      Join <span className='font-extrabold'>MEET</span>
    </Button>
  )
}

export default JoinMeetingBtn