"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Clock3, Flame, PauseCircle, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

type Profile = {
  id: string
  full_name: string | null
}

type ProfessionalProfile = {
  id: string
  industry: string | null
  job_title: string | null
  company: string | null
  years_experience: string | null
  linkedin_url: string | null
  calendly_url: string | null
  bio: string | null
  is_available: boolean | null
} | null

type Stats = {
  totalBookings: number
  pendingBookings: number
  completedChats: number
}

type RecentBooking = {
  id: string
  status: string
  scheduled_at: string | null
  student_name: string
}

interface ProfessionalDashboardProps {
  profile: Profile
  professionalProfile: ProfessionalProfile
  stats: Stats
  recentBookings: RecentBooking[]
}

export default function ProfessionalDashboard({
  profile,
  professionalProfile,
  stats,
  recentBookings,
}: ProfessionalDashboardProps) {
  const router = useRouter()
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])

  const firstName =
    profile.full_name?.split(" ").filter(Boolean).at(0) ?? "there"

  const [available, setAvailable] = React.useState(
    professionalProfile?.is_available ?? true,
  )
  const [toggling, setToggling] = React.useState(false)

  async function toggleAvailability() {
    if (!professionalProfile) return
    setToggling(true)
    const next = !available
    try {
      const { error } = await supabase
        .from("professional_profiles")
        .update({ is_available: next })
        .eq("id", professionalProfile.id)
      if (!error) {
        setAvailable(next)
      }
    } finally {
      setToggling(false)
    }
  }

  function formatDate(input: string | null) {
    if (!input) return "Not scheduled"
    const d = new Date(input)
    if (Number.isNaN(d.getTime())) return "Not scheduled"
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  function statusVariant(status: string): "success" | "warning" | "default" | "destructive" {
    switch (status) {
      case "pending":
        return "warning"
      case "confirmed":
        return "default"
      case "completed":
        return "success"
      case "cancelled":
        return "destructive"
      default:
        return "default"
    }
  }

  function statusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      {/* Section 1 – Welcome header & availability */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Flame className="size-4 text-emerald-500" />
            <span className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Students are searching
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Your experience helps students make braver, better-informed decisions. Keep
            your availability up to date so the right students can find you.
          </p>
        </div>

        <Card className="flex items-center gap-3 border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800">
          <div className="flex flex-1 flex-col">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Availability
            </span>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={
                  available
                    ? "inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-300"
                    : "inline-flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400"
                }
              >
                <span
                  className={
                    available
                      ? "size-2 rounded-full bg-emerald-500"
                      : "size-2 rounded-full bg-zinc-400"
                  }
                />
                {available ? "Available for chats" : "Paused"}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant={available ? "outline" : "default"}
            disabled={toggling}
            onClick={toggleAvailability}
          >
            {available ? (
              <>
                <PauseCircle className="mr-1.5 size-3.5" />
                Pause
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-1.5 size-3.5" />
                Go live
              </>
            )}
          </Button>
        </Card>
      </section>

      {/* Section 2 – Stats row */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="flex items-center justify-between border-zinc-200 p-4 dark:border-zinc-800">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Total bookings
            </p>
            <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              {stats.totalBookings}
            </p>
          </div>
          <Users className="size-6 text-zinc-300 dark:text-zinc-600" />
        </Card>

        <Card className="flex items-center justify-between border-zinc-200 p-4 dark:border-zinc-800">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Pending bookings
            </p>
            <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              {stats.pendingBookings}
            </p>
          </div>
          <Clock3 className="size-6 text-amber-400" />
        </Card>

        <Card className="flex items-center justify-between border-zinc-200 p-4 dark:border-zinc-800">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Completed chats
            </p>
            <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              {stats.completedChats}
            </p>
          </div>
          <CheckCircle2 className="size-6 text-emerald-500" />
        </Card>
      </section>

      {/* Section 3 – Recent bookings */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Recent bookings
            </h2>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              The 5 most recent CoffeeChats students have scheduled with you.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/bookings")}
          >
            View all
          </Button>
        </div>

        {recentBookings.length === 0 ? (
          <Card className="border-dashed border-zinc-200 bg-zinc-50/60 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
            No bookings yet — once students start reaching out, you&apos;ll see
            them here.
          </Card>
        ) : (
          <Card className="border-zinc-200 p-0 dark:border-zinc-800">
            <ul className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
              {recentBookings.map((booking) => (
                <li
                  key={booking.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {booking.student_name}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                      {formatDate(booking.scheduled_at)}
                    </p>
                  </div>
                  <Badge variant={statusVariant(booking.status)}>
                    {statusLabel(booking.status)}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </main>
  )
}

