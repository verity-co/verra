import { redirect } from "next/navigation"

import StudentDashboard from "@/components/dashboard/StudentDashboard"
import ProfessionalDashboard from "@/components/dashboard/ProfessionalDashboard"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type Role = "student" | "professional"

type RelatedName =
  | {
      full_name: string | null
    }
  | {
      full_name: string | null
    }[]
  | null

type FeaturedProfessionalRow = {
  id: string
  industry: string | null
  job_title: string | null
  company: string | null
  bio: string | null
  profiles: RelatedName
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) redirect("/auth/login")

  const userId = userData.user.id

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, full_name, avatar_url, bio")
    .eq("id", userId)
    .single()

  if (profileError || !profile?.role) redirect("/onboarding")

  const role = profile.role as Role

  if (role === "student") {
    const { data: studentProfile } = await supabase
      .from("student_profiles")
      .select("id, year_level, university, interests, career_uncertainty_notes")
      .eq("id", userId)
      .maybeSingle()

    const { data: professionals } = await supabase
      .from("professional_profiles")
      .select("id, industry, job_title, company, bio, profiles(full_name)")
      .eq("is_available", true)

    const featuredSource = ((professionals ?? []) as FeaturedProfessionalRow[])
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(0, 3)

    const featured = featuredSource.map((p) => ({
      id: p.id,
      name:
        (Array.isArray(p.profiles) ? p.profiles[0]?.full_name : p.profiles?.full_name) ??
        "Professional",
      job_title: p.job_title ?? null,
      company: p.company ?? null,
      industry: p.industry ?? null,
      bio: p.bio ?? null,
    }))

    return (
      <StudentDashboard
        profile={profile}
        studentProfile={studentProfile ?? null}
        featuredProfessionals={featured}
      />
    )
  }

  const { data: professionalProfile } = await supabase
    .from("professional_profiles")
    .select(
      "id, industry, job_title, company, years_experience, linkedin_url, calendly_url, bio, is_available",
    )
    .eq("id", userId)
    .maybeSingle()

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, student_id, status, scheduled_at")
    .eq("professional_id", userId)
    .order("scheduled_at", { ascending: false })

  const allBookings = bookings ?? []
  const totalBookings = allBookings.length
  const pendingBookings = allBookings.filter(
    (b) => b.status === "pending",
  ).length
  const completedChats = allBookings.filter(
    (b) => b.status === "completed",
  ).length

  const recent = allBookings.slice(0, 5)
  const studentIds = Array.from(new Set(recent.map((b) => b.student_id)))

  const { data: studentsProfiles } = studentIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentIds)
    : { data: [] as { id: string; full_name: string | null }[] }

  const studentNameMap = new Map(
    (studentsProfiles ?? []).map((s) => [s.id, s.full_name ?? "Student"]),
  )

  const recentWithNames = recent.map((b) => ({
    id: b.id as string,
    status: b.status as string,
    scheduled_at: b.scheduled_at as string | null,
    student_name: studentNameMap.get(b.student_id) ?? "Student",
  }))

  return (
    <ProfessionalDashboard
      profile={profile}
      professionalProfile={professionalProfile ?? null}
      stats={{
        totalBookings,
        pendingBookings,
        completedChats,
      }}
      recentBookings={recentWithNames}
    />
  )
}
