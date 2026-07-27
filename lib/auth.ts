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
} from "./password";

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
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
            },

            async authorize(credentials) {
                if (!credentials) return null;

                const email = normalizeEmail(credentials.email ?? "");
                const username = credentials.username?.trim() ?? "";
                const givenPassword = credentials.password ?? "";

                if (!isValidEmail(email) || !givenPassword) {
                    return null;
                }

                const existingUser = await prisma.user.findFirst({
                    where: { email },
                });

                if (existingUser) {
                    // Accounts created via Google never have a usable password.
                    if (existingUser.provider === "GOOGLE" || !existingUser.password) {
                        return null;
                    }

                    const { valid, needsRehash } = await verifyPassword(
                        givenPassword,
                        existingUser.password
                    );

                    if (!valid) return null;

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
                }

                // New account via the credentials form.
                if (!username || !isValidPassword(givenPassword)) {
                    return null;
                }

                try {
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
                } catch (error) {
                    console.error("Failed to create user via credentials:", error);
                    return null;
                }
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET as string,
    callbacks: {
        async signIn({ user, account }) {
            if (account?.type !== "credentials") {
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
            }

            return true;
        },

        async session({ session, token }) {
            session.user.id = token.sub;
            return session;
        },
    },
};