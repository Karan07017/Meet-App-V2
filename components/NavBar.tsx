import React from 'react'
import Link from 'next/link'
import ProfilePhoto from './ProfilePhoto'

const NavBar = () => {
    return (
        <div className='w-full h-16 sticky top-0 z-20 glass-panel border-x-0 border-t-0 flex items-center justify-center shadow-lg shadow-black/20'>
            <div className='px-5 sm:px-8 flex items-center w-full justify-between max-w-[1400px]'>
                <Link href='/' className='text-3xl sm:text-4xl font-extrabold gradient-text tracking-tight cursor-pointer hover:opacity-80 transition-opacity duration-200'>MEET</Link>
                <ProfilePhoto />
            </div>
        </div>
    )
}

export default NavBar