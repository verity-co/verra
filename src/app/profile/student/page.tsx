import { redirect } from "next/navigation"

import StudentProfileSettings from "@/components/profile/StudentProfileSettings"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function StudentProfilePage() {
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
  if (profile.role === "professional") redirect("/profile/professional")
  if (profile.role !== "student") redirect("/onboarding")

  const { data: studentProfile } = await supabase
    .from("student_profiles")
    .select("year_level, university, interests, career_uncertainty_notes")
    .eq("id", userId)
    .maybeSingle()

  return (
    <div className="min-h-[calc(100vh-0px)] bg-zinc-50 dark:bg-black">
      <StudentProfileSettings
        userId={userId}
        initialFullName={profile.full_name ?? ""}
        initialYearLevel={(studentProfile?.year_level as string | null) ?? null}
        initialUniversity={(studentProfile?.university as string | null) ?? null}
        initialInterests={(studentProfile?.interests as string[] | null) ?? null}
        initialUncertainty={
          (studentProfile?.career_uncertainty_notes as string | null) ?? null
        }
      />
    </div>
  )
}
