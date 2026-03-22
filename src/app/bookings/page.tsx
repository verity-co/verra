import { redirect } from "next/navigation"

import BookingsList from "@/components/bookings/BookingsList"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type Role = "student" | "professional"

type BookingRow = {
  id: string
  student_id: string
  professional_id: string
  status: string
  scheduled_at: string | null
  created_at: string | null
}

type RelatedProfile =
  | {
      full_name: string | null
      avatar_url: string | null
    }
  | {
      full_name: string | null
      avatar_url: string | null
    }[]
  | null

type ProfessionalProfileRow = {
  id: string
  industry: string | null
  job_title: string | null
  company: string | null
  profiles: RelatedProfile
}

export type BookingForList =
  | {
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

export default async function BookingsPage() {
  const supabase = await createSupabaseServerClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) redirect("/auth/login")

  const userId = userData.user.id

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle()

  const role = profile?.role as Role | undefined
  if (role !== "student" && role !== "professional") redirect("/onboarding")

  if (role === "student") {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, student_id, professional_id, status, scheduled_at, created_at")
      .eq("student_id", userId)
      .order("scheduled_at", { ascending: false })

    const rows = (bookings ?? []) as BookingRow[]
    const professionalIds = Array.from(new Set(rows.map((b) => b.professional_id)))

    const { data: professionalProfiles } = professionalIds.length
      ? await supabase
          .from("professional_profiles")
          .select("id, industry, job_title, company, profiles(full_name, avatar_url)")
          .in("id", professionalIds)
      : { data: [] as ProfessionalProfileRow[] }

    const proMap = new Map<
      string,
      {
        id: string
        full_name: string
        avatar_url: string | null
        job_title: string | null
        company: string | null
        industry: string | null
      }
    >(
      (professionalProfiles ?? []).map((p) => {
        const relatedProfile = Array.isArray(p.profiles)
          ? (p.profiles[0] ?? null)
          : p.profiles

        return [
          p.id,
        {
          id: p.id,
          full_name: relatedProfile?.full_name ?? "Professional",
          avatar_url: relatedProfile?.avatar_url ?? null,
          job_title: p.job_title ?? null,
          company: p.company ?? null,
          industry: p.industry ?? null,
        },
        ] as const
      }),
    )

    const list: BookingForList[] = rows.map((b) => {
      const pro = proMap.get(b.professional_id)
      return {
        id: b.id,
        status: b.status,
        scheduled_at: b.scheduled_at,
        other: {
          id: b.professional_id,
          full_name: pro?.full_name ?? "Professional",
          avatar_url: pro?.avatar_url ?? null,
          job_title: pro?.job_title ?? null,
          company: pro?.company ?? null,
          industry: pro?.industry ?? null,
        },
      }
    })

    return <BookingsList bookings={list} role="student" />
  }

  // professional view
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, student_id, professional_id, status, scheduled_at, created_at")
    .eq("professional_id", userId)
    .order("scheduled_at", { ascending: false })

  const rows = (bookings ?? []) as BookingRow[]
  const studentIds = Array.from(new Set(rows.map((b) => b.student_id)))

  const { data: studentsProfiles } = studentIds.length
    ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", studentIds)
    : { data: [] as { id: string; full_name: string | null; avatar_url: string | null }[] }

  const { data: studentProfiles } = studentIds.length
    ? await supabase
        .from("student_profiles")
        .select("id, year_level, university")
        .in("id", studentIds)
    : { data: [] as { id: string; year_level: string | null; university: string | null }[] }

  const profileMap = new Map(
    (studentsProfiles ?? []).map((p) => [
      p.id,
      { full_name: p.full_name ?? "Student", avatar_url: p.avatar_url ?? null },
    ]),
  )
  const studentProfileMap = new Map(
    (studentProfiles ?? []).map((s) => [
      s.id,
      { year_level: s.year_level ?? null, university: s.university ?? null },
    ]),
  )

  const list: BookingForList[] = rows.map((b) => {
    const p = profileMap.get(b.student_id)
    const s = studentProfileMap.get(b.student_id)
    return {
      id: b.id,
      status: b.status,
      scheduled_at: b.scheduled_at,
      other: {
        id: b.student_id,
        full_name: p?.full_name ?? "Student",
        avatar_url: p?.avatar_url ?? null,
        year_level: s?.year_level ?? null,
        university: s?.university ?? null,
      },
    }
  })

  return <BookingsList bookings={list} role="professional" />
}
