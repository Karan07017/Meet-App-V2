"use client"

import { tokenProvider } from "@/actions/stream.actions";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { StreamChat } from "stream-chat";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY as string;

/**
 * Connects the already-authenticated NextAuth user to Stream Chat.
 *
 * Reuses `tokenProvider` (actions/stream.actions.ts) — the exact same
 * server action already used by `StreamClientProvider` to mint the Stream
 * Video token. Stream user tokens aren't scoped to a single product; as
 * long as Chat is enabled on the same Stream app (same
 * NEXT_PUBLIC_STREAM_API_KEY / STREAM_SECRET_KEY pair), the video token is
 * equally valid for Chat. No second token-minting code path is added.
 *
 * `StreamChat.getInstance(apiKey)` (mirroring the
 * `StreamVideoClient.getOrCreateInstance` pattern already used for video)
 * returns the SDK's existing singleton for this API key instead of
 * constructing a second live client/WS connection.
 */
export function useStreamChatClient() {
    const { data: session, status } = useSession();
    const [chatClient, setChatClient] = useState<StreamChat>();

    // Same rationale as StreamClientProvider: depend on the stable
    // primitives that identify "this user", not on the `session` object
    // reference, so an unrelated session refetch can't retrigger this
    // effect and reconnect the chat client mid-meeting.
    const userId = session?.user?.id;
    const userName = session?.user?.name;
    const userImage = session?.user?.image;

    // Guards against React StrictMode's dev double-invoke (or any other
    // rerun) firing `connectUser` a second time while the first call is
    // still in flight — stream-chat only supports one in-flight
    // `connectUser` call per client instance.
    const connectingRef = useRef<Promise<unknown> | null>(null);

    useEffect(() => {
        if (status !== "authenticated" || !userId) return;

        const client = StreamChat.getInstance(apiKey);
        let cancelled = false;

        const connect = async () => {
            // Already connected as this user — nothing to do.
            if (client.userID === userId) {
                setChatClient(client);
                return;
            }

            if (!connectingRef.current) {
                connectingRef.current = client
                    .connectUser(
                        {
                            id: userId,
                            name: userName ?? undefined,
                            image: userImage ?? undefined,
                        },
                        tokenProvider,
                    )
                    .finally(() => {
                        connectingRef.current = null;
                    });
            }

            await connectingRef.current;
            if (!cancelled) setChatClient(client);
        };

        connect();

        return () => {
            cancelled = true;
        };
    }, [status, userId, userName, userImage]);

    return chatClient;
}