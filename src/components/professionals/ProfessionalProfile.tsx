"use client"

import * as React from "react"
import Link from "next/link"
import { ExternalLink, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

type Role = "student" | "professional"

export type ProfessionalProfileModel = {
  id: string
  full_name: string
  avatar_url: string | null
  profile_bio: string | null
  industry: string | null
  job_title: string | null
  company: string | null
  years_experience: string | null
  bio: string | null
  linkedin_url: string | null
  calendly_url: string | null
  is_available: boolean | null
}

type Props = {
  professional: ProfessionalProfileModel
  currentUserId: string | null
  currentUserRole: Role | null
}

function initialsFromName(name: string) {
  const parts = name.split(" ").filter(Boolean)
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase())
  return letters.join("") || "CC"
}

function experienceLabel(years: string | null) {
  if (!years) return null
  if (years.includes("+")) return `${years} years`
  if (years.includes("-")) return `${years} years`
  return years
}

export default function ProfessionalProfile({
  professional,
  currentUserId,
  currentUserRole,
}: Props) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])

  const bio = professional.bio ?? professional.profile_bio
  const roleLine = [professional.job_title, professional.company]
    .filter(Boolean)
    .join(" at ")

  const [recording, setRecording] = React.useState(false)
  const [recorded, setRecorded] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function recordBooking() {
    setError(null)
    if (!currentUserId) {
      setError("Please log in as a student to record a booking.")
      return
    }
    if (currentUserRole !== "student") {
      setError("Only students can record bookings.")
      return
    }

    setRecording(true)
    try {
      const { error: insertError } = await supabase.from("bookings").insert({
        status: "confirmed",
        student_id: currentUserId,
        professional_id: professional.id,
        scheduled_at: null,
      })

      if (insertError) throw insertError
      setRecorded(true)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong."
      setError(message)
    } finally {
      setRecording(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-6">
        <Link
          href="/professionals"
          className="text-sm font-medium text-zinc-700 underline underline-offset-4 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
        >
          ← Back to professionals
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-zinc-200 p-6 dark:border-zinc-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-lg font-semibold uppercase text-white ring-1 ring-zinc-900/10 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-100/20">
                {professional.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={professional.avatar_url}
                    alt={professional.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initialsFromName(professional.full_name)
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {professional.full_name}
                </h1>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {roleLine || "Professional"}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {professional.industry ? (
                    <Badge variant="outline">{professional.industry}</Badge>
                  ) : null}
                  {experienceLabel(professional.years_experience) ? (
                    <Badge variant="outline">
                      {experienceLabel(professional.years_experience)}
                    </Badge>
                  ) : null}
                </div>

                {professional.linkedin_url ? (
                  <div className="mt-4">
                    <a
                      href={professional.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex"
                    >
                      <Button variant="outline" size="sm">
                        LinkedIn
                        <ExternalLink className="ml-2 size-3.5" />
                      </Button>
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </Card>

          <Card className="border-zinc-200 p-6 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              About
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              {bio ||
                "This professional hasn’t added a bio yet — but they’re here to help students make clearer choices with real-world insight."}
            </p>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            {currentUserRole === "professional" ? (
              <Card className="border-zinc-200 p-6 dark:border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  You are viewing as a professional
                </h2>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Booking is only available for students.
                </p>
              </Card>
            ) : (
              <Card className="border-zinc-200 p-6 dark:border-zinc-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                      Book a Coffee Chat ☕
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      30 minutes • Free • Video call
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      professional.is_available
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
                    )}
                  >
                    {professional.is_available ? "Available" : "Unavailable"}
                  </span>
                </div>

                {professional.calendly_url ? (
                  <div className="mt-4 space-y-4">
                    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                      <iframe
                        src={`${professional.calendly_url}?hide_gdpr_banner=1`}
                        width="100%"
                        height="700px"
                        frameBorder="0"
                        title={`Calendly booking for ${professional.full_name}`}
                      />
                    </div>

                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
                      After you book a time in Calendly, come back here and
                      record it so it shows up in your bookings.
                    </div>

                    {error ? (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                        {error}
                      </div>
                    ) : null}

                    {!currentUserId ? (
                      <Link href="/auth/login" className="inline-flex w-full">
                        <Button className="w-full">Log in to record booking</Button>
                      </Link>
                    ) : (
                      <Button
                        onClick={recordBooking}
                        className="w-full"
                        disabled={recording || recorded}
                      >
                        {recording ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Recording…
                          </>
                        ) : recorded ? (
                          "Recorded ✓"
                        ) : (
                          "Record this booking"
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                    This professional hasn&apos;t set up booking yet.
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

