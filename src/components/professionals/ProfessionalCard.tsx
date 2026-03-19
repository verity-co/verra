"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type ProfessionalCardModel = {
  id: string
  full_name: string
  avatar_url: string | null
  industry: string | null
  job_title: string | null
  company: string | null
  years_experience: string | null
  bio: string | null
  profile_bio: string | null
}

function initialsFromName(name: string) {
  const parts = name.split(" ").filter(Boolean)
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase())
  return letters.join("") || "CC"
}

function experienceLabel(years: string | null) {
  if (!years) return null
  if (years.includes("+")) return `${years} years`
  if (years.includes("-")) return `${years} years`
  return years
}

export default function ProfessionalCard({
  professional,
}: {
  professional: ProfessionalCardModel
}) {
  const name = professional.full_name || "Professional"
  const roleLine = [professional.job_title, professional.company]
    .filter(Boolean)
    .join(" at ")

  const bio = professional.bio ?? professional.profile_bio

  return (
    <Card className="group border-zinc-200 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800">
      <div className="flex items-start gap-3">
        <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-xs font-semibold uppercase text-white ring-1 ring-zinc-900/10 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-100/20">
          {professional.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={professional.avatar_url}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            initialsFromName(name)
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                {name}
              </p>
              {roleLine ? (
                <p className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
                  {roleLine}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                  Professional
                </p>
              )}
            </div>

            {professional.industry ? (
              <Badge variant="outline" className="shrink-0">
                {professional.industry}
              </Badge>
            ) : null}
          </div>

          {experienceLabel(professional.years_experience) ? (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {experienceLabel(professional.years_experience)}
            </p>
          ) : null}

          {bio ? (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
              {bio}
            </p>
          ) : (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              Here to share honest insights and help you make your next step feel
              clearer.
            </p>
          )}

          <div className="mt-4">
            <Link href={`/professionals/${professional.id}`} className="inline-flex w-full">
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  "w-full justify-between",
                  "group-hover:border-zinc-900 dark:group-hover:border-zinc-50",
                )}
              >
                View profile
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}

