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
        if (status != "authenticated" || !session) return;
        const client = new StreamVideoClient({
            apiKey,
            user: {
                id: session.user?.id,
                name: session.user.name,

            },
            tokenProvider: tokenProvider
        });
        setVideoClient(client);
    }, [session, status, router])

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