"use client"

import { tokenProvider } from "@/actions/stream.actions";
import Loader from "@/components/Loader";
import {
    StreamVideo,
    StreamVideoClient
} from "@stream-io/video-react-sdk";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY as string;

export const StreamClientProvider = ({ children }: { children: ReactNode }) => {
    const [videoClient, setVideoClient] = useState<StreamVideoClient>();
    const router = useRouter();

    const { data: session, status } = useSession()

    // Only pull out the primitives that actually identify "this user" for
    // the video client. `useSession()` hands back a brand-new `session`
    // object reference on every refetch (NextAuth's default
    // `refetchOnWindowFocus` — now disabled in providers.tsx, but this is
    // cheap insurance against the same class of bug from any other
    // refetch trigger, e.g. `refetchInterval`, an explicit `update()`
    // call, etc.). If this effect depended on the `session` object itself,
    // any such refetch would refire it — even though `userId`/`userName`
    // are unchanged — spin up a brand-new StreamVideoClient, and swap the
    // `client` prop passed to <StreamVideo>. That remounts every
    // descendant bound to the old client, including the Call that was
    // already `join()`ed, leaving `useCallCallingState()` stuck below
    // `CallingState.JOINED` forever (the "stuck on loader" bug). Depending
    // on stable primitives means the effect only reruns when the user
    // genuinely changes.
    const userId = session?.user?.id;
    const userName = session?.user?.name;

    useEffect(() => {
        // proxy.ts already redirects unauthenticated requests before this
        // component ever mounts. This is a defense-in-depth fallback for a
        // session expiring mid-visit (e.g. a long-lived tab). `router.push`
        // is used instead of the `redirect()` helper — that helper is meant
        // for Server Components/Server Actions and throws when called from
        // a client event handler or effect.
        if (status === "unauthenticated") {
            return;
        }
        if (status !== "authenticated" || !userId) return;

        // `getOrCreateInstance` (instead of `new StreamVideoClient(...)`)
        // returns the SDK's existing singleton for this user/API key
        // rather than instantiating a second live client. This is what
        // actually silences "StreamVideoClient already exists... Prefer
        // using getOrCreateInstance" at its source — the warning was a
        // symptom of a second client being constructed, not the root
        // cause itself, but fixing this belt-and-braces means any future
        // rerun of this effect (StrictMode double-invoke in dev, a future
        // dependency change, etc.) can never result in two live clients
        // fighting over the same connection.
        const client = StreamVideoClient.getOrCreateInstance({
            apiKey,
            user: {
                id: userId,
                name: userName,
            },
            tokenProvider: tokenProvider
        });
        setVideoClient(client);
    }, [status, userId, userName, router])

    // Still resolving the session — show the loader.
    if (status === "loading") {
        return <Loader />;
    }

    // No session (e.g. on /login): don't block rendering, and don't try
    // to spin up a video client — there's nothing to authenticate yet.
    if (status === "unauthenticated" || !session) {
        return <>{children}</>;
    }

    // Authenticated but the video client hasn't been created yet.
    if (!videoClient) {
        return <Loader />;
    }

    return (
        <StreamVideo client={videoClient}>
            {children}
        </StreamVideo>
    );
};