"use client"
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function Providers({children}: {children: ReactNode}){
    // `refetchOnWindowFocus` defaults to `true` in next-auth v4. That means
    // every time this tab regains focus — switching back from another tab,
    // or the browser's native screen-share picker closing after the user
    // makes a selection — next-auth calls `/api/auth/session` again and
    // pushes a brand-new `session` object through `useSession()`, even
    // though the logged-in user hasn't changed at all.
    //
    // StreamClientProvider (and anything else keyed off the `session`
    // object identity) would treat that as "the session changed" and
    // react accordingly, which is what let a stale/duplicate
    // StreamVideoClient get created underneath an in-progress call. This
    // app doesn't need session data kept fresh on every focus event, so
    // it's turned off at the source rather than patched around downstream.
    return <SessionProvider refetchOnWindowFocus={false}>
        {children}
    </SessionProvider>
}