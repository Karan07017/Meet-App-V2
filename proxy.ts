import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Route protection for the authenticated app surface.
 *
 * This runs before the matched routes render (Next.js 16's `proxy.ts`
 * convention, which replaced `middleware.ts`), so unauthenticated visitors
 * are redirected before any protected UI is sent to the client — closing
 * the gap left by the previous approach, which only redirected from a
 * `useEffect` after the page had already mounted client-side.
 *
 * This is an "optimistic" check (valid signed JWT present) suitable for a
 * routing-layer redirect. The authoritative check remains server-side in
 * `actions/stream.actions.ts`, which independently verifies the session via
 * `getServerSession` before ever minting a Stream video token — so a
 * request that somehow bypassed this proxy still could not obtain a
 * usable video session.
 */
export async function proxy(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
        const signInUrl = new URL("/api/auth/signin", request.url);
        signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
        return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/join/:path*", "/meeting/:path*"],
};