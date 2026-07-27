"use client"

import React, { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Lock, Mail, User, ArrowRight } from "lucide-react"
import Loader from "@/components/Loader"

const errorMessages: Record<string, string> = {
    CredentialsSignin: "Invalid email/username or password. Please try again.",
    OAuthAccountNotLinked: "That email is already registered with a different sign-in method.",
    Default: "Something went wrong while signing in. Please try again.",
}

type AuthMode = "login" | "signup"

function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
        </svg>
    )
}

function LoginContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()

    const callbackUrl = searchParams.get("callbackUrl") || "/"
    const oauthError = searchParams.get("error")

    // "login" shows Email + Password. "signup" shows Username + Email + Password.
    // This is purely a presentational toggle — both modes submit through the
    // exact same CredentialsProvider/authorize() flow already in lib/auth.ts,
    // which decides whether to log in an existing user or create a new one.
    const [mode, setMode] = useState<AuthMode>("login")
    const [slideDirection, setSlideDirection] = useState<"forward" | "back">("forward")

    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [isCredentialsLoading, setIsCredentialsLoading] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const displayError =
        formError ?? (oauthError ? errorMessages[oauthError] ?? errorMessages.Default : null)

    function switchMode(nextMode: AuthMode) {
        if (nextMode === mode) return
        setSlideDirection(nextMode === "signup" ? "forward" : "back")
        setMode(nextMode)
        setFormError(null)
    }

    async function handleGoogleSignIn() {
        setIsGoogleLoading(true)
        try {
            await signIn("google", { callbackUrl })
        } catch {
            toast({ title: "Failed to sign in with Google" })
            setIsGoogleLoading(false)
        }
    }

    async function handleCredentialsSubmit(e: React.FormEvent) {
        e.preventDefault()
        setFormError(null)
        setIsCredentialsLoading(true)
        try {
            const res = await signIn("credentials", {
                // In "login" mode we don't collect a username — the existing
                // authorize() logic only uses it when creating a brand new
                // account, so omitting it here doesn't change any behavior.
                username: mode === "signup" ? username : "",
                email,
                password,
                redirect: false,
                callbackUrl,
            })

            if (res?.error) {
                setFormError(errorMessages.CredentialsSignin)
                return
            }

            router.push(res?.url || callbackUrl)
        } catch {
            setFormError(errorMessages.Default)
        } finally {
            setIsCredentialsLoading(false)
        }
    }

    const slideAnimationClass =
        slideDirection === "forward" ? "animate-auth-slide-forward" : "animate-auth-slide-back"

    return (
        <div className="app-gradient-bg min-h-screen w-full flex overflow-hidden">
            {/* Left brand panel — desktop only */}
            <div className="hidden lg:flex flex-1 flex-col justify-between p-14 relative overflow-hidden">
                <div className="pointer-events-none absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-indigo-500/20 blur-[110px]" />
                <div className="pointer-events-none absolute bottom-1/4 -right-16 w-96 h-96 rounded-full bg-violet-500/15 blur-[110px]" />

                <div className="relative z-10 text-3xl font-extrabold gradient-text tracking-tight">MEET</div>

                <div className="relative z-10 max-w-md animate-fade-in-up">
                    <h1 className="text-4xl xl:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
                        Meetings that{" "}
                        <span className="bg-gradient-to-br from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                            just work
                        </span>
                        .
                    </h1>
                    <p className="text-zinc-400 text-base leading-relaxed">
                        Sign in to start a call or join one instantly.
                    </p>
                </div>

                <p className="relative z-10 text-xs text-zinc-500">Secure sign-in, powered by MEET</p>
            </div>

            {/* Right auth panel */}
            <div className="flex-1 flex items-center justify-center px-4 py-10 relative z-10">
                <div className="w-full sm:w-[420px] animate-fade-in-up">
                    <div className="lg:hidden flex flex-col items-center gap-1 mb-8 text-center">
                        <div className="text-4xl font-extrabold gradient-text tracking-tight">MEET</div>
                    </div>

                    <div className="rounded-3xl glass-panel shadow-2xl shadow-black/40 px-6 sm:px-8 py-9 overflow-hidden">
                        {/* Header text swaps with the mode, same card */}
                        <div key={`header-${mode}`} className={`mb-7 text-center ${slideAnimationClass}`}>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                {mode === "login" ? "Welcome back" : "Create your account"}
                            </h2>
                            <p className="text-sm text-zinc-400 mt-1.5">
                                {mode === "login"
                                    ? "Sign in to start or join a meeting"
                                    : "Sign up to start or join a meeting"}
                            </p>
                        </div>

                        {displayError && (
                            <div className="mb-5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-300 animate-fade-in">
                                {displayError}
                            </div>
                        )}

                        {/* Google Sign In stays at the top, unchanged */}
                        <Button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={isGoogleLoading}
                            className="w-full h-12 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 font-medium flex items-center justify-center gap-2.5 shadow-lg shadow-black/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                        >
                            <GoogleIcon className="w-5 h-5" />
                            {isGoogleLoading ? "Redirecting..." : "Continue with Google"}
                        </Button>

                        <div className="flex items-center gap-3 my-6">
                            <div className="h-px flex-1 bg-white/10" />
                            <span className="text-[11px] uppercase tracking-wider text-zinc-500">or continue with email</span>
                            <div className="h-px flex-1 bg-white/10" />
                        </div>

                        {/* Credential form — same card, content swaps between Login / Signup */}
                        <form
                            key={`form-${mode}`}
                            onSubmit={handleCredentialsSubmit}
                            className={`space-y-4 ${slideAnimationClass}`}
                        >
                            {mode === "signup" && (
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <Input
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Username"
                                        className="pl-10 h-12 bg-white/5 border-white/15 text-white placeholder:text-zinc-500 rounded-xl focus-visible:ring-indigo-500"
                                    />
                                </div>
                            )}

                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <Input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email address"
                                    className="pl-10 h-12 bg-white/5 border-white/15 text-white placeholder:text-zinc-500 rounded-xl focus-visible:ring-indigo-500"
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <Input
                                    required
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className="pl-10 pr-10 h-12 bg-white/5 border-white/15 text-white placeholder:text-zinc-500 rounded-xl focus-visible:ring-indigo-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    tabIndex={-1}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <Button
                                type="submit"
                                disabled={isCredentialsLoading}
                                className="w-full h-12 rounded-xl flex items-center justify-center gap-2 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white font-medium shadow-lg shadow-indigo-950/50 hover:shadow-xl hover:shadow-indigo-900/50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
                            >
                                {isCredentialsLoading
                                    ? "Please wait..."
                                    : mode === "login"
                                        ? "Log in"
                                        : "Create account"}
                                {!isCredentialsLoading && <ArrowRight size={18} />}
                            </Button>
                        </form>

                        <p className="text-sm text-zinc-400 text-center mt-6">
                            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                            <button
                                type="button"
                                onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                                className="text-white font-medium hover:text-indigo-400 transition-colors"
                            >
                                {mode === "login" ? "Sign Up" : "Log In"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<Loader />}>
            <LoginContent />
        </Suspense>
    )
}