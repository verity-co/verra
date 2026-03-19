"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

type Props = {
  userId: string
  profileFullName: string
}

const YEAR_LEVELS = [
  "Year 10",
  "Year 11",
  "Year 12",
  "First Year Uni",
  "Second Year Uni",
  "Third Year Uni",
  "Fourth Year+",
] as const

type YearLevel = (typeof YEAR_LEVELS)[number]

const UNI_LEVELS: Set<YearLevel> = new Set([
  "First Year Uni",
  "Second Year Uni",
  "Third Year Uni",
  "Fourth Year+",
])

const INTERESTS = [
  "Technology",
  "Medicine",
  "Law",
  "Finance",
  "Engineering",
  "Marketing",
  "Design",
  "Education",
  "Science",
  "Government",
  "Arts",
  "Business",
] as const

type Interest = (typeof INTERESTS)[number]

export default function StudentOnboarding({ userId, profileFullName }: Props) {
  const router = useRouter()
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])

  const [fullName, setFullName] = React.useState(profileFullName)
  const [yearLevel, setYearLevel] = React.useState<YearLevel>("Year 12")
  const [university, setUniversity] = React.useState("")
  const [selectedInterests, setSelectedInterests] = React.useState<Interest[]>(
    [],
  )
  const [uncertainty, setUncertainty] = React.useState("")

  const showUniversity = UNI_LEVELS.has(yearLevel)

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  function toggleInterest(interest: Interest) {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    )
  }

  async function onSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const trimmedName = fullName.trim()
      if (!trimmedName) throw new Error("Please enter your full name.")

      if (!profileFullName?.trim()) {
        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({ full_name: trimmedName })
          .eq("id", userId)
        if (profileUpdateError) throw profileUpdateError
      }

      const { error: upsertError } = await supabase
        .from("student_profiles")
        .upsert(
          {
            id: userId,
            year_level: yearLevel,
            university: showUniversity ? university.trim() : null,
            interests: selectedInterests,
            career_uncertainty_notes: uncertainty.trim() || null,
          },
          { onConflict: "id" },
        )

      if (upsertError) throw upsertError

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
    <div className="mx-auto w-full max-w-3xl px-4 py-14">
      <div className="mb-10">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
          <Sparkles className="size-5" />
          <span className="text-sm font-medium">You’re in the right place</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Let’s shape your path — one conversation at a time.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Tell us a bit about where you’re at. We’ll use this to recommend
          professionals and make your first CoffeeChat feel easy.
        </p>
      </div>

      <Card className="border-zinc-200 p-6 dark:border-zinc-800">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
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
                Year level
              </label>
              <Select
                value={yearLevel}
                onChange={(e) => setYearLevel(e.target.value as YearLevel)}
              >
                {YEAR_LEVELS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                University
              </label>
              <Input
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder={showUniversity ? "e.g. University of Sydney" : "—"}
                disabled={!showUniversity}
                aria-disabled={!showUniversity}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {showUniversity
                  ? "Optional — helps us match you with relevant professionals."
                  : "Shown when you select a university year level."}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                Interests
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Pick a few — you can change these later.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => {
                const active = selectedInterests.includes(interest)
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition-colors",
                      active
                        ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
                        : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-950/60",
                    )}
                  >
                    {interest}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
              What are you most unsure about?
            </label>
            <Textarea
              value={uncertainty}
              onChange={(e) => setUncertainty(e.target.value)}
              placeholder="e.g. Choosing a degree, what jobs actually look like day-to-day, whether I’m ‘behind’, how to break into a field…"
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              You can update everything later in settings.
            </p>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Continue to dashboard"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

