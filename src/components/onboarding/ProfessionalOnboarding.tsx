"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, Loader2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

type Props = {
  userId: string
  profileFullName: string
}

const INDUSTRIES = [
  "Technology",
  "Medicine",
  "Law",
  "Finance",
  "Engineering",
  "Marketing",
  "Design",
  "Education",
  "Science",
  "Government",
  "Arts",
  "Business",
] as const

type Industry = (typeof INDUSTRIES)[number]

const YEARS_EXPERIENCE = ["1-2", "3-5", "6-10", "10+"] as const
type YearsExperience = (typeof YEARS_EXPERIENCE)[number]

export default function ProfessionalOnboarding({
  userId,
  profileFullName,
}: Props) {
  const router = useRouter()
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])

  const [fullName, setFullName] = React.useState(profileFullName)
  const [industry, setIndustry] = React.useState<Industry>("Technology")
  const [jobTitle, setJobTitle] = React.useState("")
  const [company, setCompany] = React.useState("")
  const [yearsExperience, setYearsExperience] =
    React.useState<YearsExperience>("3-5")
  const [linkedinUrl, setLinkedinUrl] = React.useState("")
  const [calendlyUrl, setCalendlyUrl] = React.useState("")
  const [bio, setBio] = React.useState("")

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const bioLimit = 300
  const bioCount = bio.length

  async function onSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const trimmedName = fullName.trim()
      if (!trimmedName) throw new Error("Please enter your full name.")

      if (!profileFullName?.trim()) {
        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({ full_name: trimmedName })
          .eq("id", userId)
        if (profileUpdateError) throw profileUpdateError
      }

      const trimmedBio = bio.trim()
      if (trimmedBio.length > bioLimit) {
        throw new Error(`Bio must be ${bioLimit} characters or less.`)
      }

      const { error: upsertError } = await supabase
        .from("professional_profiles")
        .upsert(
          {
            id: userId,
            industry,
            job_title: jobTitle.trim() || null,
            company: company.trim() || null,
            years_experience: yearsExperience,
            linkedin_url: linkedinUrl.trim() || null,
            calendly_url: calendlyUrl.trim() || null,
            bio: trimmedBio || null,
          },
          { onConflict: "id" },
        )

      if (upsertError) throw upsertError

      router.replace("/dashboard")
      router.refresh()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14">
      <div className="mb-10">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
          <Sparkles className="size-5" />
          <span className="text-sm font-medium">Thanks for being here</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Set up your profile to help students confidently choose what’s next.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          A few details helps students find the right person — and makes your
          CoffeeChats more meaningful.
        </p>
      </div>

      <Card className="border-zinc-200 p-6 dark:border-zinc-800">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                Full name
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                placeholder="Ada Lovelace"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                Industry
              </label>
              <Select
                value={industry}
                onChange={(e) => setIndustry(e.target.value as Industry)}
              >
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                Years of experience
              </label>
              <Select
                value={yearsExperience}
                onChange={(e) =>
                  setYearsExperience(e.target.value as YearsExperience)
                }
              >
                {YEARS_EXPERIENCE.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                Job title
              </label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Product Manager"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                Company
              </label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Atlassian"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                LinkedIn URL
              </label>
              <Input
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourname"
                inputMode="url"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                Calendly URL
              </label>
              <Input
                value={calendlyUrl}
                onChange={(e) => setCalendlyUrl(e.target.value)}
                placeholder="https://calendly.com/yourname/coffeechat"
                inputMode="url"
              />
              <div className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                <CalendarDays className="mt-0.5 size-4 shrink-0" />
                <p>
                  Calendly is a scheduling link that lets students pick an
                  available time without back-and-forth messages.
                </p>
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  Short bio
                </label>
                <span
                  className={
                    bioCount > bioLimit
                      ? "text-xs text-red-600 dark:text-red-300"
                      : "text-xs text-zinc-500 dark:text-zinc-400"
                  }
                >
                  {bioCount}/{bioLimit}
                </span>
              </div>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A couple of sentences about your background and what you can help students with."
                maxLength={bioLimit + 50}
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              You can update these anytime — this just helps you get started.
            </p>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Continue to dashboard"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

