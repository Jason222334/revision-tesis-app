import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextAuthSessionProvider } from "@/components/providers/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Sidebar } from "@/components/ui/sidebar"
import { auth } from "@/auth"
import { Chatbot } from "@/components/chatbot";

export const metadata: Metadata = {
  title: "Sistema de Revisión de Tesis con IA",
  description: "Gestión y revisión inteligente de avances de tesis universitarias",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth()

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 flex h-screen overflow-hidden`}
        suppressHydrationWarning
      >
        <NextAuthSessionProvider session={session}>
          {session?.user && <Sidebar user={session.user as any} />}
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
            {children}
          </main>
          <Chatbot />
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
