"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  PauseCircle,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  INDUSTRIES,
  type Industry,
  YEARS_EXPERIENCE,
  type YearsExperience,
} from "@/components/profile/constants"

type Props = {
  userId: string
  initialFullName: string
  initialIndustry: string | null
  initialJobTitle: string | null
  initialCompany: string | null
  initialYearsExperience: string | null
  initialLinkedinUrl: string | null
  initialCalendlyUrl: string | null
  initialBio: string | null
  initialIsAvailable: boolean | null
}

function isIndustry(value: string | null): value is Industry {
  return Boolean(value && INDUSTRIES.includes(value as Industry))
}

function isYearsExperience(value: string | null): value is YearsExperience {
  return Boolean(
    value && YEARS_EXPERIENCE.includes(value as YearsExperience),
  )
}

export default function ProfessionalProfileSettings({
  userId,
  initialFullName,
  initialIndustry,
  initialJobTitle,
  initialCompany,
  initialYearsExperience,
  initialLinkedinUrl,
  initialCalendlyUrl,
  initialBio,
  initialIsAvailable,
}: Props) {
  const router = useRouter()
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])

  const [fullName, setFullName] = React.useState(initialFullName)
  const [industry, setIndustry] = React.useState<Industry>(
    isIndustry(initialIndustry) ? initialIndustry : "Technology",
  )
  const [jobTitle, setJobTitle] = React.useState(initialJobTitle ?? "")
  const [company, setCompany] = React.useState(initialCompany ?? "")
  const [yearsExperience, setYearsExperience] = React.useState<YearsExperience>(
    isYearsExperience(initialYearsExperience) ? initialYearsExperience : "3-5",
  )
  const [linkedinUrl, setLinkedinUrl] = React.useState(initialLinkedinUrl ?? "")
  const [calendlyUrl, setCalendlyUrl] = React.useState(initialCalendlyUrl ?? "")
  const [bio, setBio] = React.useState(initialBio ?? "")
  const [isAvailable, setIsAvailable] = React.useState(
    initialIsAvailable ?? true,
  )
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [saved, setSaved] = React.useState(false)

  const bioLimit = 300
  const bioCount = bio.length

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    setLoading(true)

    try {
      const trimmedName = fullName.trim()
      const trimmedBio = bio.trim()

      if (!trimmedName) throw new Error("Please enter your full name.")
      if (trimmedBio.length > bioLimit) {
        throw new Error(`Bio must be ${bioLimit} characters or less.`)
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: trimmedName })
        .eq("id", userId)

      if (profileError) throw profileError

      const { error: professionalProfileError } = await supabase
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
            is_available: isAvailable,
          },
          { onConflict: "id" },
        )

      if (professionalProfileError) throw professionalProfileError

      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Sparkles className="size-4 text-amber-500" />
            <span className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
              Professional settings
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Manage your public profile
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Keep your details current so students know who you are, what you do,
            and whether they can book time with you.
          </p>
        </div>
        <Link href="/dashboard" className="hidden sm:inline-flex">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
      </div>

      <Card className="mb-6 border-zinc-200 p-5 dark:border-zinc-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Availability
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Control whether students can find and book you right now.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSaved(false)
              setIsAvailable((prev) => !prev)
            }}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              isAvailable
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200"
                : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300",
            )}
          >
            <PauseCircle className="size-4" />
            {isAvailable ? "Available for chats" : "Paused"}
          </button>
        </div>
      </Card>

      <Card className="border-zinc-200 p-6 dark:border-zinc-800">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                Full name
              </label>
              <Input
                value={fullName}
                onChange={(e) => {
                  setSaved(false)
                  setFullName(e.target.value)
                }}
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
                onChange={(e) => {
                  setSaved(false)
                  setIndustry(e.target.value as Industry)
                }}
              >
                {INDUSTRIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
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
                onChange={(e) => {
                  setSaved(false)
                  setYearsExperience(e.target.value as YearsExperience)
                }}
              >
                {YEARS_EXPERIENCE.map((item) => (
                  <option key={item} value={item}>
                    {item}
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
                onChange={(e) => {
                  setSaved(false)
                  setJobTitle(e.target.value)
                }}
                placeholder="e.g. Product Manager"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                Company
              </label>
              <Input
                value={company}
                onChange={(e) => {
                  setSaved(false)
                  setCompany(e.target.value)
                }}
                placeholder="e.g. Atlassian"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                LinkedIn URL
              </label>
              <Input
                value={linkedinUrl}
                onChange={(e) => {
                  setSaved(false)
                  setLinkedinUrl(e.target.value)
                }}
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
                onChange={(e) => {
                  setSaved(false)
                  setCalendlyUrl(e.target.value)
                }}
                placeholder="https://calendly.com/yourname/coffeechat"
                inputMode="url"
              />
              <div className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                <CalendarDays className="mt-0.5 size-4 shrink-0" />
                <p>
                  Add a booking link so students can schedule without needing to
                  message you first.
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
                onChange={(e) => {
                  setSaved(false)
                  setBio(e.target.value)
                }}
                placeholder="A couple of sentences about your background and what students can ask you about."
                maxLength={bioLimit + 50}
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          ) : null}

          {saved ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
              <CheckCircle2 className="size-4" />
              Profile updated successfully.
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Your changes affect how students discover and book you.
            </p>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
