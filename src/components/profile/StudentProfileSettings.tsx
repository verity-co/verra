"use client"

import * as React from "react"
import Link from "next/link"
import { CheckCircle2, Loader2, Sparkles } from "lucide-react"
import { useRouter } from "nextjs-toploader/app"
import { useTopLoader } from "nextjs-toploader"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  INTERESTS,
  type Interest,
  UNI_LEVELS,
  YEAR_LEVELS,
  type YearLevel,
} from "@/components/profile/constants"

type Props = {
  userId: string
  initialFullName: string
  initialYearLevel: string | null
  initialUniversity: string | null
  initialInterests: string[] | null
  initialUncertainty: string | null
}

function isYearLevel(value: string | null): value is YearLevel {
  return Boolean(value && YEAR_LEVELS.includes(value as YearLevel))
}

function isInterest(value: string): value is Interest {
  return INTERESTS.includes(value as Interest)
}

export default function StudentProfileSettings({
  userId,
  initialFullName,
  initialYearLevel,
  initialUniversity,
  initialInterests,
  initialUncertainty,
}: Props) {
  const router = useRouter()
  const loader = useTopLoader()
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])

  const [fullName, setFullName] = React.useState(initialFullName)
  const [yearLevel, setYearLevel] = React.useState<YearLevel>(
    isYearLevel(initialYearLevel) ? initialYearLevel : "Year 12",
  )
  const [university, setUniversity] = React.useState(initialUniversity ?? "")
  const [selectedInterests, setSelectedInterests] = React.useState<Interest[]>(
    () => (initialInterests ?? []).filter(isInterest),
  )
  const [uncertainty, setUncertainty] = React.useState(initialUncertainty ?? "")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [saved, setSaved] = React.useState(false)

  const showUniversity = UNI_LEVELS.has(yearLevel)

  function toggleInterest(interest: Interest) {
    setSaved(false)
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((item) => item !== interest)
        : [...prev, interest],
    )
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    setLoading(true)
    loader.start()

    try {
      const trimmedName = fullName.trim()
      if (!trimmedName) throw new Error("Please enter your full name.")

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: trimmedName })
        .eq("id", userId)

      if (profileError) throw profileError

      const { error: studentProfileError } = await supabase
        .from("student_profiles")
        .upsert(
          {
            id: userId,
            year_level: yearLevel,
            university: showUniversity ? university.trim() || null : null,
            interests: selectedInterests,
            career_uncertainty_notes: uncertainty.trim() || null,
          },
          { onConflict: "id" },
        )

      if (studentProfileError) throw studentProfileError

      setSaved(true)
      router.refresh()
    } catch (err) {
      loader.done()
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      loader.done()
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Sparkles className="size-4 text-amber-500" />
            <span className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
              Student settings
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Keep your profile up to date
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Update your interests and what you are unsure about so Verra can
            recommend better conversations.
          </p>
        </div>
        <Link href="/dashboard" className="hidden sm:inline-flex">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
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
                onChange={(e) => {
                  setSaved(false)
                  setFullName(e.target.value)
                }}
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
                onChange={(e) => {
                  setSaved(false)
                  setYearLevel(e.target.value as YearLevel)
                }}
              >
                {YEAR_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
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
                onChange={(e) => {
                  setSaved(false)
                  setUniversity(e.target.value)
                }}
                placeholder={showUniversity ? "e.g. University of Sydney" : "—"}
                disabled={!showUniversity}
                aria-disabled={!showUniversity}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                Interests
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Choose the areas you want to explore through chats and the AI
                advisor.
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
              onChange={(e) => {
                setSaved(false)
                setUncertainty(e.target.value)
              }}
              placeholder="e.g. Choosing a degree, what jobs actually look like day-to-day, whether I’m behind, or how to break into a field…"
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          ) : null}

          {saved ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
              <CheckCircle2 className="size-4" />
              Profile updated successfully.
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              These details help personalize your dashboard and suggestions.
            </p>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
