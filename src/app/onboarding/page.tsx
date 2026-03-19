import { redirect } from "next/navigation"

import StudentOnboarding from "@/components/onboarding/StudentOnboarding"
import ProfessionalOnboarding from "@/components/onboarding/ProfessionalOnboarding"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type Role = "student" | "professional"

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) redirect("/auth/login")

  const userId = userData.user.id

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", userId)
    .single()

  if (profileError || !profile?.role) redirect("/auth/signup")

  const role = profile.role as Role
  const fullName = profile.full_name ?? ""

  return (
    <div className="min-h-[calc(100vh-0px)] bg-zinc-50 dark:bg-black">
      {role === "student" ? (
        <StudentOnboarding userId={userId} profileFullName={fullName} />
      ) : (
        <ProfessionalOnboarding userId={userId} profileFullName={fullName} />
      )}
    </div>
  )
}

