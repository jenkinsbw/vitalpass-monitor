import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

import { auth } from "@/auth";
import { Toaster } from "@/components/ui/sonner";
import { UserMenu } from "@/components/user-menu";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VitalPass",
  description: "Monitor Core Web Vitals with the Chrome UX Report.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  const user = session?.user;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              VitalPass
            </Link>
            {user?.email ? <UserMenu email={user.email} /> : null}
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
