"use client"
import { useSession } from 'next-auth/react';
import React from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut } from 'lucide-react';
import LoginButton from './login-btn';


const Photo = () => {
  const { data: session } = useSession();


  if (!session) return;
  return (
    <div className='rounded-full w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex justify-center items-center text-lg font-semibold shadow-md shadow-black/30 ring-1 ring-white/20 hover:ring-white/40 transition-all'>
      {session.user.name[0].toUpperCase()}
    </div>
  )
}

const ProfilePhoto = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='rounded-full transition-transform hover:scale-105'>
        <Photo />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='bg-zinc-900/95 backdrop-blur-xl border-white/10 text-white'>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator className='bg-white/10' />
        <DropdownMenuItem className='cursor-pointer focus:bg-white/10 focus:text-white'>

          <LogOut />
          <LoginButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

  );
}

export default ProfilePhoto