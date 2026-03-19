"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError

      router.replace("/dashboard")
      router.refresh()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-0px)] bg-zinc-50 dark:bg-black">
      <div className="mx-auto flex w-full max-w-xl flex-col px-4 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Log in to continue to CoffeeChat.
          </p>
        </div>

        <Card className="border-zinc-200 p-6 dark:border-zinc-800">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                Email
              </label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                placeholder="you@university.edu"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                Password
              </label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                {error}
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Logging in…
                </>
              ) : (
                <>
                  <LogIn className="mr-2 size-4" />
                  Log in
                </>
              )}
            </Button>

            <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
              New here?{" "}
              <Link
                href="/auth/signup"
                className="font-medium text-zinc-950 underline underline-offset-4 hover:text-zinc-800 dark:text-zinc-50 dark:hover:text-zinc-200"
              >
                Create an account
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  )
}

