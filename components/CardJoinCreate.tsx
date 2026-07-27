import React from 'react'
import StartMeetingBtn from './StartMeetingBtn'
import JoinMeetingBtn from './JoinMeetingBtn'

const CardJoinCreate = () => {
  return (
    <div className='w-[90%] sm:w-[450px] rounded-3xl glass-panel shadow-2xl shadow-black/40 flex flex-col justify-center items-center gap-6 px-8 py-12 animate-fade-in-up'>
      <div className='flex flex-col items-center gap-1.5 mb-2 text-center'>
        <h1 className='text-2xl sm:text-3xl font-bold text-white tracking-tight'>Welcome to MEET</h1>
        <p className='text-sm sm:text-base text-zinc-400'>Start a new meeting or join with an ID</p>
      </div>
      <StartMeetingBtn />
      <JoinMeetingBtn />
    </div>
  )
}

export default CardJoinCreate