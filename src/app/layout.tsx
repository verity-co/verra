import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Verra",
  description:
    "Book free 1-on-1 career chats with professionals. Find your direction with Verra.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  let role: "student" | "professional" | null = null;
  let fullName: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "student" || profile?.role === "professional") {
      role = profile.role;
      fullName = profile.full_name ?? null;
    }
  }

  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextTopLoader
          color="#f59e0b"
          showSpinner={false}
          height={3}
        />
        <Navbar role={role} fullName={fullName} /> {/* Always show, let the component decide what to display */}
        {children}
      </body>
    </html>
  );
}
