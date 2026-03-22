import { notFound } from "next/navigation"

import ProfessionalProfile from "@/components/professionals/ProfessionalProfile"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type Role = "student" | "professional"

export default async function ProfessionalProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: userData } = await supabase.auth.getUser()
  const currentUserId = userData.user?.id ?? null
  const currentUserEmail = userData.user?.email ?? null

  let currentUserRole: Role | null = null
  let currentUserFullName: string | null = null
  if (currentUserId) {
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", currentUserId)
      .maybeSingle()
    if (
      currentProfile?.role === "student" ||
      currentProfile?.role === "professional"
    ) {
      currentUserRole = currentProfile.role
      currentUserFullName = currentProfile.full_name ?? null
    }
  }

  const { data, error } = await supabase
    .from("professional_profiles")
    .select(
      "id, industry, job_title, company, years_experience, linkedin_url, calendly_url, bio, is_available, profiles(full_name, avatar_url, bio)",
    )
    .eq("id", id)
    .maybeSingle()

  if (error || !data) notFound()

  const professional = {
    id: data.id as string,
    industry: data.industry as string | null,
    job_title: data.job_title as string | null,
    company: data.company as string | null,
    years_experience: data.years_experience as string | null,
    linkedin_url: (data.linkedin_url as string | null) ?? null,
    calendly_url: (data.calendly_url as string | null) ?? null,
    bio: (data.bio as string | null) ?? null,
    is_available: (data.is_available as boolean | null) ?? null,
    full_name:
      // @ts-expect-error relation
      (data.profiles?.full_name as string | undefined) ?? "Professional",
    avatar_url:
      // @ts-expect-error relation
      (data.profiles?.avatar_url as string | null | undefined) ?? null,
    profile_bio:
      // @ts-expect-error relation
      (data.profiles?.bio as string | null | undefined) ?? null,
  }

  return (
    <div className="min-h-[calc(100vh-0px)] bg-zinc-50 dark:bg-black">
      <ProfessionalProfile
        professional={professional}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        currentUserFullName={currentUserFullName}
        currentUserEmail={currentUserEmail}
      />
    </div>
  )
}
