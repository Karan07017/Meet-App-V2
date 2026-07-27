import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "../lib/prisma";
import { NextAuthOptions } from "next-auth";
import {
    hashPassword,
    verifyPassword,
    isValidEmail,
    isValidPassword,
    normalizeEmail,
    MIN_PASSWORD_LENGTH,
} from "./password";

/**
 * Shape returned by `authorize()` when a request is rejected for a
 * business-logic reason (wrong password, email already registered, etc).
 *
 * NextAuth v4's CredentialsProvider does not forward thrown/rejected errors
 * from `authorize()` to the client with their original message intact — it
 * collapses everything to the generic "CredentialsSignin" code. The
 * documented workaround (and the one used here) is to have `authorize()`
 * return a plain object carrying the message instead of `null`/throwing,
 * and then have the `signIn` callback below throw that message. When the
 * client calls `signIn("credentials", { redirect: false, ... })`, the
 * resulting `error` field will contain this exact string, which is what
 * the login page displays to the user.
 */
type AuthorizeError = { error: string };

function isAuthorizeError(value: unknown): value is AuthorizeError {
    return !!value && typeof value === "object" && "error" in value;
}

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    // Presentation-only: route NextAuth's sign-in flow to our own styled
    // page instead of the built-in default page. Providers and the
    // credentials `authorize` logic below are otherwise unchanged in shape.
    pages: {
        signIn: "/login",
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "jsmith" },
                email: { label: "Email", type: "email", placeholder: "jsmith@gmail.com" },
                password: { label: "Password", type: "password" },
                // Hidden field set by the login page: "login" or "signup".
                // Determines which strict flow below runs — the two are no
                // longer merged into a single implicit flow.
                mode: { label: "Mode", type: "text" },
            },

            async authorize(credentials) {
                if (!credentials) return null;

                const mode = credentials.mode === "signup" ? "signup" : "login";
                const email = normalizeEmail(credentials.email ?? "");
                const username = credentials.username?.trim() ?? "";
                const givenPassword = credentials.password ?? "";

                if (!isValidEmail(email)) {
                    return { error: "Please enter a valid email address." } as AuthorizeError as never;
                }

                if (!givenPassword) {
                    return { error: "Password is required." } as AuthorizeError as never;
                }

                try {
                    const existingUser = await prisma.user.findFirst({
                        where: { email },
                    });

                    if (mode === "signup") {
                        // Signup must ONLY create a new account — never log
                        // an existing one in.
                        if (existingUser) {
                            return {
                                error:
                                    "An account with this email already exists. Please log in.",
                            } as AuthorizeError as never;
                        }

                        if (!username) {
                            return { error: "Username is required." } as AuthorizeError as never;
                        }

                        if (!isValidPassword(givenPassword)) {
                            return {
                                error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
                            } as AuthorizeError as never;
                        }

                        const hashedPassword = await hashPassword(givenPassword);
                        const user = await prisma.user.create({
                            data: {
                                email,
                                name: username,
                                password: hashedPassword,
                                provider: "CREDENTIALS",
                                lastLoginAt: new Date(),
                            },
                        });

                        return {
                            id: user.id.toString(),
                            name: user.name,
                            email: user.email,
                        };
                    }

                    // mode === "login" — must ONLY authenticate an existing
                    // account — never create one.
                    if (!existingUser) {
                        return {
                            error: "This email is not registered. Please sign up first.",
                        } as AuthorizeError as never;
                    }

                    // Accounts created via Google never have a usable password.
                    if (existingUser.provider === "GOOGLE" || !existingUser.password) {
                        return {
                            error:
                                "This email is registered with Google. Please continue with Google Sign-In.",
                        } as AuthorizeError as never;
                    }

                    const { valid, needsRehash } = await verifyPassword(
                        givenPassword,
                        existingUser.password
                    );

                    if (!valid) {
                        return { error: "Incorrect password." } as AuthorizeError as never;
                    }

                    const updateData: {
                        lastLoginAt: Date;
                        password?: string;
                    } = { lastLoginAt: new Date() };

                    // Transparently upgrade legacy plaintext rows to bcrypt hashes
                    // on successful login, without requiring a password reset.
                    if (needsRehash) {
                        updateData.password = await hashPassword(givenPassword);
                    }

                    await prisma.user.update({
                        where: { id: existingUser.id },
                        data: updateData,
                    });

                    return {
                        id: existingUser.id.toString(),
                        name: existingUser.name,
                        email: existingUser.email,
                    };
                } catch (error) {
                    console.error(
                        `Credentials ${mode === "signup" ? "signup" : "login"} failed:`,
                        error
                    );
                    return {
                        error: "Something went wrong. Please try again.",
                    } as AuthorizeError as never;
                }
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET as string,
    callbacks: {
        async signIn({ user, account }) {
            if (account?.type === "credentials") {
                // authorize() returned an { error } marker instead of a real
                // user — surface that exact message to the client via the
                // signIn() promise's `error` field instead of the generic
                // "CredentialsSignin" NextAuth would otherwise produce.
                if (isAuthorizeError(user)) {
                    throw new Error(user.error);
                }
                return true;
            }

            const email = normalizeEmail(user.email as string);

            const existingUser = await prisma.user.findFirst({
                where: { email },
            });

            if (existingUser) {
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { lastLoginAt: new Date() },
                });
                return true;
            }

            try {
                await prisma.user.create({
                    data: {
                        email,
                        name: user.name as string,
                        provider: "GOOGLE",
                        password: null,
                        lastLoginAt: new Date(),
                    },
                });

                return true;
            } catch (error) {
                console.error("Failed to create user via Google sign-in:", error);
                return false;
            }
        },

        async session({ session, token }) {
            session.user.id = token.sub;
            return session;
        },
    },
};