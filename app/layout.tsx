import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/providers";
import { StreamClientProvider } from "@/providers/StreamClientProvider";


import '@stream-io/video-react-sdk/dist/css/styles.css';

import { Toaster } from "@/components/ui/toaster"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MEET",
  description: "Its a MEET App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0c]`}
      >
        <Providers>
          <StreamClientProvider>
            {children}
          </StreamClientProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}