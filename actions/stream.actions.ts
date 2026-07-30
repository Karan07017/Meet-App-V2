"use server"

import { authOptions } from "@/lib/auth";
import { StreamClient } from "@stream-io/node-sdk";
import { getServerSession } from "next-auth";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY as string;
const apiSecret = process.env.STREAM_SECRET_KEY as string;

export const tokenProvider = async ()=>{
    const session = await getServerSession(authOptions);

    if(!session) throw new Error('user not logged in');

    const user = session.user;
    const client = new StreamClient(apiKey, apiSecret);
    const vailidity = 60 * 60;
    const token = client.generateUserToken({user_id: user.id, validity_in_seconds: vailidity});

    return token;
}