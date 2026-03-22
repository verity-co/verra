"use client"

import * as React from "react"
import Link from "next/link"
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react"
import { InlineWidget, useCalendlyEventListener } from "react-calendly"

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
  currentUserFullName: string | null
  currentUserEmail: string | null
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
  currentUserFullName,
  currentUserEmail,
}: Props) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])

  const bio = professional.bio ?? professional.profile_bio
  const roleLine = [professional.job_title, professional.company]
    .filter(Boolean)
    .join(" at ")

  const [recording, setRecording] = React.useState(false)
  const [recorded, setRecorded] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [bookingMessage, setBookingMessage] = React.useState<string | null>(null)
  const hasRecordedScheduleRef = React.useRef(false)

  function formatScheduledAt(input: string) {
    const date = new Date(input)
    if (Number.isNaN(date.getTime())) return "Your booking has been saved."
    return `Booked for ${date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })}.`
  }

  async function fallbackCreateBooking() {
    const { error: insertError } = await supabase.from("bookings").insert({
      status: "confirmed",
      student_id: currentUserId,
      professional_id: professional.id,
      scheduled_at: null,
    })

    if (insertError) throw insertError
    setBookingMessage(
      "Booking saved, but the exact time could not be synced yet.",
    )
  }

  async function createBookingFromCalendly(eventUri: string, inviteeUri: string) {
    if (hasRecordedScheduleRef.current) return

    setError(null)
    setBookingMessage(null)
    if (!currentUserId) {
      setError("Please log in as a student to book this chat.")
      return
    }
    if (currentUserRole !== "student") {
      setError("Only students can book chats.")
      return
    }

    hasRecordedScheduleRef.current = true
    setRecording(true)
    try {
      const response = await fetch("/api/bookings/sync-calendly", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          professionalId: professional.id,
          eventUri,
          inviteeUri,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null

        if (payload?.error?.includes("CALENDLY_PERSONAL_ACCESS_TOKEN")) {
          await fallbackCreateBooking()
        } else {
          throw new Error(payload?.error ?? "Failed to sync booking.")
        }
      } else {
        const payload = (await response.json()) as {
          scheduledAt?: string
        }

        if (payload.scheduledAt) {
          setBookingMessage(formatScheduledAt(payload.scheduledAt))
        } else {
          setBookingMessage("Booking saved successfully.")
        }
      }

      setRecorded(true)
    } catch (err) {
      hasRecordedScheduleRef.current = false
      const message =
        err instanceof Error ? err.message : "Something went wrong."
      setError(message)
    } finally {
      setRecording(false)
    }
  }

  useCalendlyEventListener({
    onEventScheduled: async (event) => {
      await createBookingFromCalendly(
        event.data.payload.event.uri,
        event.data.payload.invitee.uri,
      )
    },
  })

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
                    {!currentUserId ? (
                      <Link href="/auth/login" className="inline-flex w-full">
                        <Button className="w-full">Log in to book this chat</Button>
                      </Link>
                    ) : currentUserRole !== "student" ? (
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
                        Only student accounts can schedule chats.
                      </div>
                    ) : (
                      <>
                        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                          <InlineWidget
                            url={professional.calendly_url}
                            prefill={{
                              email: currentUserEmail ?? undefined,
                              name: currentUserFullName ?? undefined,
                            }}
                            pageSettings={{
                              hideGdprBanner: true,
                            }}
                            styles={{ height: "700px" }}
                            iframeTitle={`Calendly booking for ${professional.full_name}`}
                          />
                        </div>

                        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
                          Once Calendly confirms your time, we&apos;ll add the
                          booking to your account automatically.
                        </div>

                        {recording ? (
                          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                            <Loader2 className="size-4 animate-spin" />
                            Saving your booking…
                          </div>
                        ) : null}

                        {recorded ? (
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                              <div>
                                <p className="font-medium">Booking saved.</p>
                                <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                                  {bookingMessage ??
                                    "You can find it in My Bookings now."}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {error ? (
                          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                            {error}
                          </div>
                        ) : null}

                        <Link href="/bookings" className="inline-flex w-full">
                          <Button variant="outline" className="w-full">
                            View my bookings
                          </Button>
                        </Link>
                      </>
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
