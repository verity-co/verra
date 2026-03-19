"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Briefcase, GraduationCap, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

type Role = "student" | "professional"

export default function SignupPage() {
  const router = useRouter()
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])

  const [role, setRole] = React.useState<Role>("student")
  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const origin =
        typeof window === "undefined" ? "" : window.location.origin

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: origin
            ? `${origin}/auth/callback?next=/onboarding`
            : undefined,
          data: { full_name: fullName, role },
        },
      })

      if (signUpError) throw signUpError
      if (!data.user) throw new Error("Signup succeeded but no user returned.")

      const userId = data.user.id

      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        role,
        full_name: fullName,
      })
      if (profileError) throw profileError

      if (role === "student") {
        const { error: studentError } = await supabase
          .from("student_profiles")
          .insert({ id: userId })
        if (studentError) throw studentError
      } else {
        const { error: proError } = await supabase
          .from("professional_profiles")
          .insert({ id: userId })
        if (proError) throw proError
      }

      router.replace("/onboarding")
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
            Create your CoffeeChat account
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Start booking 1-on-1 career chats in minutes.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setRole("student")}
              className="text-left"
            >
              <Card
                className={cn(
                  "relative h-full border-zinc-200 p-5 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950/40",
                  role === "student" &&
                    "border-zinc-950 ring-2 ring-zinc-950/10 dark:border-zinc-50 dark:ring-zinc-50/20",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50",
                      role === "student" &&
                        "border-zinc-950 dark:border-zinc-50",
                    )}
                  >
                    <GraduationCap className="size-5" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-950 dark:text-zinc-50">
                      I&apos;m a Student
                    </div>
                    <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Explore paths, get guidance, book chats.
                    </div>
                  </div>
                </div>
              </Card>
            </button>

            <button
              type="button"
              onClick={() => setRole("professional")}
              className="text-left"
            >
              <Card
                className={cn(
                  "relative h-full border-zinc-200 p-5 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950/40",
                  role === "professional" &&
                    "border-zinc-950 ring-2 ring-zinc-950/10 dark:border-zinc-50 dark:ring-zinc-50/20",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50",
                      role === "professional" &&
                        "border-zinc-950 dark:border-zinc-50",
                    )}
                  >
                    <Briefcase className="size-5" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-950 dark:text-zinc-50">
                      I&apos;m a Professional
                    </div>
                    <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Share experience and help students.
                    </div>
                  </div>
                </div>
              </Card>
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
              Full name
            </label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              placeholder="Ada Lovelace"
              required
            />
          </div>

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
              autoComplete="new-password"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            aria-disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </Button>

          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-zinc-950 underline underline-offset-4 hover:text-zinc-800 dark:text-zinc-50 dark:hover:text-zinc-200"
            >
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

