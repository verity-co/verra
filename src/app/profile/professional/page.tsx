import { redirect } from "next/navigation"

import ProfessionalProfileSettings from "@/components/profile/ProfessionalProfileSettings"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function ProfessionalProfilePage() {
  const supabase = await createSupabaseServerClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) redirect("/auth/login")

  const userId = userData.user.id

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", userId)
    .maybeSingle()

  if (profileError || !profile?.role) redirect("/onboarding")
  if (profile.role === "student") redirect("/profile/student")
  if (profile.role !== "professional") redirect("/onboarding")

  const { data: professionalProfile } = await supabase
    .from("professional_profiles")
    .select(
      "industry, job_title, company, years_experience, linkedin_url, calendly_url, bio, is_available",
    )
    .eq("id", userId)
    .maybeSingle()

  return (
    <div className="min-h-[calc(100vh-0px)] bg-zinc-50 dark:bg-black">
      <ProfessionalProfileSettings
        userId={userId}
        initialFullName={profile.full_name ?? ""}
        initialIndustry={
          (professionalProfile?.industry as string | null) ?? null
        }
        initialJobTitle={
          (professionalProfile?.job_title as string | null) ?? null
        }
        initialCompany={(professionalProfile?.company as string | null) ?? null}
        initialYearsExperience={
          (professionalProfile?.years_experience as string | null) ?? null
        }
        initialLinkedinUrl={
          (professionalProfile?.linkedin_url as string | null) ?? null
        }
        initialCalendlyUrl={
          (professionalProfile?.calendly_url as string | null) ?? null
        }
        initialBio={(professionalProfile?.bio as string | null) ?? null}
        initialIsAvailable={
          (professionalProfile?.is_available as boolean | null) ?? null
        }
      />
    </div>
  )
}
