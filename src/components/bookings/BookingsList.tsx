"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, CircleX, Coffee, Clock3, Video } from "lucide-react"

import { updateBookingStatus } from "@/app/bookings/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Role = "student" | "professional"

type Booking = {
  id: string
  status: "pending" | "confirmed" | "completed" | "cancelled" | string
  scheduled_at: string | null
  other: {
    id: string
    full_name: string
    avatar_url: string | null
    job_title?: string | null
    company?: string | null
    industry?: string | null
    year_level?: string | null
    university?: string | null
  }
}

type Props = {
  bookings: Booking[]
  role: Role
}

type TabKey = "all" | "pending" | "confirmed" | "completed" | "cancelled"
type BookingActionStatus = Exclude<TabKey, "all">

function initialsFromName(name: string) {
  const parts = name.split(" ").filter(Boolean)
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase())
  return letters.join("") || "CC"
}

function formatDateTime(input: string | null) {
  if (!input) return "Not scheduled yet"
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return "Not scheduled yet"
  return d.toLocaleString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  })
}

function statusVariant(
  status: string,
): "warning" | "default" | "success" | "destructive" {
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

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export default function BookingsList({ bookings, role }: Props) {
  const router = useRouter()
  const [tab, setTab] = React.useState<TabKey>("all")
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const counts = React.useMemo(() => {
    const c: Record<TabKey, number> = {
      all: bookings.length,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    }
    for (const b of bookings) {
      if (b.status === "pending") c.pending += 1
      else if (b.status === "confirmed") c.confirmed += 1
      else if (b.status === "completed") c.completed += 1
      else if (b.status === "cancelled") c.cancelled += 1
    }
    return c
  }, [bookings])

  const filtered = React.useMemo(() => {
    if (tab === "all") return bookings
    return bookings.filter((b) => b.status === tab)
  }, [bookings, tab])

  async function runAction(bookingId: string, status: BookingActionStatus) {
    if (busyId) return
    setBusyId(bookingId)
    try {
      await updateBookingStatus({
        bookingId,
        status,
      })
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ]

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            My Bookings
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Keep track of upcoming chats and past conversations.
          </p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
                  : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900",
              )}
            >
              {t.label}
              <Badge variant="outline" className={cn(active && "border-white/30")}>
                {counts[t.key]}
              </Badge>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
          {role === "student" ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                No bookings yet.
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Browse professionals to book your first coffee chat ☕
              </p>
              <Link href="/professionals" className="inline-flex">
                <Button>Browse professionals</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                No bookings yet.
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Make sure your profile is set to available so students can find you.
              </p>
            </div>
          )}
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((b) => {
            const other = b.other
            const titleLine =
              role === "student"
                ? other.full_name
                : other.full_name
            const subtitleLine =
              role === "student"
                ? [other.job_title, other.company].filter(Boolean).join(" • ")
                : null

            return (
              <Card
                key={b.id}
                className="border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-xs font-semibold uppercase text-white ring-1 ring-zinc-900/10 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-100/20">
                      {other.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={other.avatar_url}
                          alt={other.full_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initialsFromName(other.full_name)
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                        {titleLine}
                      </p>

                      {role === "student" ? (
                        <p className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
                          {subtitleLine || "Professional"}
                        </p>
                      ) : (
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {other.year_level ? (
                            <Badge variant="outline">{other.year_level}</Badge>
                          ) : null}
                          {other.university ? (
                            <span className="text-xs text-zinc-600 dark:text-zinc-400">
                              {other.university}
                            </span>
                          ) : null}
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {role === "student" && other.industry ? (
                          <Badge variant="outline">{other.industry}</Badge>
                        ) : null}
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                          <Clock3 className="size-3.5" />
                          {formatDateTime(b.scheduled_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 sm:items-end">
                    <Badge variant={statusVariant(b.status)}>{statusLabel(b.status)}</Badge>

                    {role === "student" ? (
                      b.status === "confirmed" ? (
                        <a href="#" className="inline-flex">
                          <Button size="sm" className="gap-2">
                            <Video className="size-4" />
                            Join Call
                          </Button>
                        </a>
                      ) : null
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {b.status === "pending" ? (
                          <>
                            <Button
                              size="sm"
                              disabled={busyId === b.id}
                              onClick={() => runAction(b.id, "confirmed")}
                              className="gap-2"
                            >
                              <CheckCircle2 className="size-4" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busyId === b.id}
                              onClick={() => runAction(b.id, "cancelled")}
                              className="gap-2"
                            >
                              <CircleX className="size-4" />
                              Cancel
                            </Button>
                          </>
                        ) : null}

                        {b.status === "confirmed" ? (
                          <>
                            <Button
                              size="sm"
                              disabled={busyId === b.id}
                              onClick={() => runAction(b.id, "completed")}
                              className="gap-2"
                            >
                              <Coffee className="size-4" />
                              Mark Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busyId === b.id}
                              onClick={() => runAction(b.id, "cancelled")}
                              className="gap-2"
                            >
                              <CircleX className="size-4" />
                              Cancel
                            </Button>
                          </>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </main>
  )
}
