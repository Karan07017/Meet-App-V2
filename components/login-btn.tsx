"use client"
import { useSession, signOut } from "next-auth/react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Loader from "./Loader"

export default function LoginButton() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // proxy.ts already redirects unauthenticated requests before this
    // component ever mounts. This is a defense-in-depth fallback for a
    // session expiring mid-visit. `router.push` is used instead of the
    // `redirect()` helper — that helper is meant for Server
    // Components/Server Actions and throws when called from a client
    // event handler or effect.
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") return <Loader/>;

  if (session) {
    return <span onClick={() => signOut()}>Sign out</span>;
  }

  return null;
}