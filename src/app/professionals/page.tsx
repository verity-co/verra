import ProfessionalGrid from "@/components/professionals/ProfessionalGrid"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type Professional = {
  id: string
  full_name: string
  avatar_url: string | null
  profile_bio: string | null
  industry: string | null
  job_title: string | null
  company: string | null
  years_experience: string | null
  bio: string | null
  calendly_url: string | null
  linkedin_url: string | null
  is_available: boolean | null
}

export default async function ProfessionalsPage() {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("professional_profiles")
    .select(
      "id, industry, job_title, company, years_experience, bio, calendly_url, linkedin_url, is_available, profiles(full_name, avatar_url, bio)",
    )
    .eq("is_available", true)
    .order("years_experience", { ascending: false })

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Browse professionals
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          We couldn’t load professionals right now. Please try again.
        </p>
      </div>
    )
  }

  const professionals: Professional[] =
    data?.map((p) => ({
      id: p.id as string,
      industry: p.industry as string | null,
      job_title: p.job_title as string | null,
      company: p.company as string | null,
      years_experience: p.years_experience as string | null,
      bio: (p.bio as string | null) ?? null,
      calendly_url: (p.calendly_url as string | null) ?? null,
      linkedin_url: (p.linkedin_url as string | null) ?? null,
      is_available: (p.is_available as boolean | null) ?? null,
      full_name:
        // @ts-expect-error relation
        (p.profiles?.full_name as string | undefined) ?? "Professional",
      avatar_url:
        // @ts-expect-error relation
        (p.profiles?.avatar_url as string | null | undefined) ?? null,
      profile_bio:
        // @ts-expect-error relation
        (p.profiles?.bio as string | null | undefined) ?? null,
    })) ?? []

  return (
    <div className="min-h-[calc(100vh-0px)] bg-zinc-50 dark:bg-black">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Browse professionals
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Warm, honest conversations with people who&apos;ve been where you are.
            Search by role, industry, or name — and book a CoffeeChat when it
            feels right.
          </p>
        </div>

        <ProfessionalGrid professionals={professionals} />
      </div>
    </div>
  )
}

