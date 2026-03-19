"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

// 1. Update the type to allow null
type Role = "student" | "professional" | null 

interface NavbarProps {
  role: Role
  fullName: string | null
}

export default function Navbar({ role, fullName }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])

  // --- LOGIC FOR LOGGED IN USERS ---
  const firstName = fullName?.split(" ").filter(Boolean).at(0) ?? "User"
  const initials =
    fullName
      ?.split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "CC"

  const [email, setEmail] = React.useState<string | null>(null)
  const [signingOut, setSigningOut] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      setEmail(data.user?.email ?? null)
    })
    return () => {
      mounted = false
    }
  }, [supabase])

  // --- RENDER LOGGED OUT NAV ---
  if (!role) {
    return (
      <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/60 backdrop-blur-md dark:border-zinc-800 dark:bg-black/50">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            <img src="/logo.svg" height={32} alt="Verra" />
          </Link>

          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/#professionals" className="hidden text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 sm:block">
              For Professionals
            </Link>
            <Link href="/auth/login" className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300">
              Sign In
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>
    )
  }

  // --- RENDER LOGGED IN NAV (Existing Code) ---
  const navLinks = role === "student"
    ? [
        { href: "/professionals", label: "Browse" },
        { href: "/roadmap", label: "Degree Roadmap" },
        { href: "/bookings", label: "My Bookings" },
        { href: "/journal", label: "AI Advisor" },
      ]
    : [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/bookings", label: "My Bookings" },
      ]

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await supabase.auth.signOut()
      router.push("/")
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href={role === 'student' ? '/professionals' : '/dashboard'} className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          <img src="/logo.svg" height={32} alt="Verra" />
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-1 text-sm sm:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  pathname === link.href ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs text-white"
                aria-label="Open profile menu"
                type="button"
              >
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 pb-2 pt-2">
                <div className="text-left text-xs font-medium text-zinc-500">
                  {fullName ?? firstName}
                </div>
                <div className="truncate text-left text-xs text-zinc-500">
                  {email ?? ""}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  router.push(
                    role === "student"
                      ? "/profile/student"
                      : "/profile/professional",
                  )
                }}
              >
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={signingOut}
                onSelect={async (e) => {
                  e.preventDefault()
                  await handleSignOut()
                }}
              >
                {signingOut ? "Signing out..." : "Sign Out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}