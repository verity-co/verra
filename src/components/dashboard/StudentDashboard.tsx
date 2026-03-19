"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, CalendarSearch, MessageCircleMore, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Profile = {
  id: string
  full_name: string | null
}

type StudentProfile = {
  id: string
  year_level: string | null
  university: string | null
  interests: string[] | null
  career_uncertainty_notes: string | null
} | null

type FeaturedProfessional = {
  id: string
  name: string
  job_title: string | null
  company: string | null
  industry: string | null
  bio: string | null
}

interface StudentDashboardProps {
  profile: Profile
  studentProfile: StudentProfile
  featuredProfessionals: FeaturedProfessional[]
}

export default function StudentDashboard({
  profile,
  studentProfile,
  featuredProfessionals,
}: StudentDashboardProps) {
  const firstName =
    profile.full_name?.split(" ").filter(Boolean).at(0) ?? "there"

  const interests = studentProfile?.interests ?? []

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      {/* Section 1 – Welcome */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Sparkles className="size-4 text-amber-500" />
            <span className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
              You’ve got this
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Hey {firstName}, let&apos;s find your direction.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            CoffeeChat connects you with people doing the jobs you&apos;re
            curious about — so you can ask real questions and make clearer
            decisions.
          </p>

          {interests.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {interests.map((interest) => (
                <Badge key={interest} variant="outline">
                  {interest}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
              Add your interests during onboarding to get more tailored matches.
            </p>
          )}
        </div>
      </section>

      {/* Section 2 – Quick actions */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col justify-between border-zinc-200 p-4 dark:border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Chat with AI Advisor
            </h2>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Reflect on your week, your questions, and ideas before or after a
              CoffeeChat.
            </p>
          </div>
          <Link href="/journal" className="mt-4 inline-flex">
            <Button variant="outline" size="sm" className="w-full justify-between">
              Open journal
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </Card>

        <Card className="flex flex-col justify-between border-zinc-200 p-4 dark:border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Browse Professionals
            </h2>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Explore people across industries and save profiles that resonate
              with you.
            </p>
          </div>
          <Link href="/professionals" className="mt-4 inline-flex">
            <Button variant="outline" size="sm" className="w-full justify-between">
              Discover professionals
              <CalendarSearch className="size-3.5" />
            </Button>
          </Link>
        </Card>

        <Card className="flex flex-col justify-between border-zinc-200 p-4 dark:border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              My Bookings
            </h2>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              See what&apos;s coming up and revisit past conversations.
            </p>
          </div>
          <Link href="/bookings" className="mt-4 inline-flex">
            <Button variant="outline" size="sm" className="w-full justify-between">
              View bookings
              <MessageCircleMore className="size-3.5" />
            </Button>
          </Link>
        </Card>
      </section>

      {/* Section 3 – Featured professionals */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Featured professionals
            </h2>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              A few people who are currently available for CoffeeChats.
            </p>
          </div>
          <Link
            href="/professionals"
            className="text-xs font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-200"
          >
            View all
          </Link>
        </div>

        {featuredProfessionals.length === 0 ? (
          <Card className="border-dashed border-zinc-200 bg-zinc-50/60 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
            We&apos;re still onboarding professionals. Check back soon for
            recommended matches.
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {featuredProfessionals.map((pro) => (
              <Card
                key={pro.id}
                className="flex h-full flex-col justify-between border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                      {pro.name}
                    </p>
                    {pro.industry ? (
                      <Badge variant="outline">{pro.industry}</Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {[pro.job_title, pro.company].filter(Boolean).join(" · ")}
                  </p>
                  {pro.bio ? (
                    <p className="mt-1 line-clamp-3 text-xs text-zinc-600 dark:text-zinc-400">
                      {pro.bio}
                    </p>
                  ) : null}
                </div>

                <Link
                  href={`/professionals/${pro.id}`}
                  className="mt-4 inline-flex"
                >
                  <Button size="sm" className="w-full justify-between">
                    Book a chat
                    <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

