import Link from "next/link"
import {
  CalendarDays,
  Compass,
  Coffee,
  GraduationCap,
  Sparkles,
  Timer,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-0px)] bg-gradient-to-b from-slate-50 to-amber-50 dark:from-black dark:to-black">

      <section className="mx-auto w-full max-w-6xl px-4 py-14 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm dark:border-zinc-800 dark:bg-black/40 dark:text-zinc-300">
              <Sparkles className="size-3.5 text-amber-500" />
              Free 1-on-1 chats with professionals
            </div>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-zinc-50 md:text-5xl">
              Find your direction.
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-slate-700 dark:text-zinc-300">
              Book free 1-on-1 conversations with professionals across every
              industry. Real advice from people doing the job you&apos;re
              curious about.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/signup" className="inline-flex">
                <Button className="w-full sm:w-auto">
                  I&apos;m a Student →
                </Button>
              </Link>
              <Link href="/auth/signup" className="inline-flex">
                <Button variant="outline" className="w-full sm:w-auto">
                  I&apos;m a Professional →
                </Button>
              </Link>
            </div>
          </div>

          <Card className="border-slate-200 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
            <p className="text-sm font-semibold text-slate-950 dark:text-zinc-50">
              What students say they want
            </p>
            <div className="mt-4 grid gap-3">
              {[
                "“I just want to know what the day-to-day is actually like.”",
                "“I’m scared of picking the wrong degree.”",
                "“Everyone else seems ahead. Am I behind?”",
              ].map((q) => (
                <div
                  key={q}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                >
                  {q}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-zinc-400">
              Verra is a safe place to ask the questions you don&apos;t want
              to ask in class.
            </p>
          </Card>
        </div>
      </section>

      {/* SECTION 2 — How it works */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-zinc-50">
          Go from confused to confident
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-50">
              <Coffee className="size-5 text-amber-600" />
              <p className="text-sm font-semibold">Find a professional</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-zinc-300">
              Browse real professionals across medicine, law, tech, finance and
              more.
            </p>
          </Card>
          <Card className="border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-50">
              <CalendarDays className="size-5 text-amber-600" />
              <p className="text-sm font-semibold">Book a free chat</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-zinc-300">
              Pick a time that works. 30 minutes, completely free, no strings
              attached.
            </p>
          </Card>
          <Card className="border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-50">
              <Compass className="size-5 text-amber-600" />
              <p className="text-sm font-semibold">Get real clarity</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-zinc-300">
              Have an honest conversation with someone actually doing the job
              you&apos;re curious about.
            </p>
          </Card>
        </div>
      </section>

      {/* SECTION 3 — AI Advisor callout */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-start">
          <div>
            <Badge variant="outline" className="bg-white/70">
              Powered by AI
            </Badge>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-zinc-50">
              A career advisor in your pocket
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-zinc-300">
              Not sure where to start? Talk it through with our AI career
              advisor. It remembers your thoughts across sessions, helps you
              explore options, and points you toward the right professionals
              when you&apos;re ready.
            </p>
            <div className="mt-6">
              <Link href="/auth/signup" className="inline-flex">
                <Button variant="outline">Try the AI Advisor →</Button>
              </Link>
            </div>
          </div>

          {/* mock chat */}
          <Card className="border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-3 border-b border-slate-200 pb-3 text-sm dark:border-zinc-800">
              <p className="font-semibold text-slate-950 dark:text-zinc-50">
                AI Career Advisor
              </p>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Your thoughts are saved between sessions
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl bg-slate-900 px-3 py-2 text-sm text-white">
                  I like science and tech but I don&apos;t know what jobs are
                  actually like.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-0.5 flex size-7 items-center justify-center rounded-full bg-amber-100 text-sm">
                  ☕
                </div>
                <div className="max-w-[85%] rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                  That&apos;s a really normal place to be. When you imagine a good
                  day at work, do you prefer building things (coding/designing),
                  solving puzzles (analysis), or working with people (health /
                  teaching / advising)?
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl bg-slate-900 px-3 py-2 text-sm text-white">
                  Probably building things… but I&apos;m worried I&apos;m not smart
                  enough.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-0.5 flex size-7 items-center justify-center rounded-full bg-amber-100 text-sm">
                  ☕
                </div>
                <div className="max-w-[85%] rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                  You don&apos;t need to feel “ready” to start. A great next step is
                  a quick coffee chat with someone in tech to hear what their
                  first year really looked like — then we can map out a path
                  that fits you.
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* SECTION 4 — Degree Roadmap callout */}
      <section className="bg-slate-900 py-14 text-white">
        <div className="mx-auto w-full max-w-6xl px-4">
          <h2 className="text-3xl font-semibold tracking-tight">
            Know exactly what to study in Year 11 and 12
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
            Our Go8 university roadmap shows you which subjects to take right
            now to keep your options open for the degree you want.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                uni: "ANU",
                degree: "Bachelor of Software Engineering",
                industry: "Technology",
              },
              {
                uni: "Sydney",
                degree: "Bachelor of Medicine/Surgery",
                industry: "Medicine",
              },
              {
                uni: "Melbourne",
                degree: "Juris Doctor",
                industry: "Law",
              },
              {
                uni: "UNSW",
                degree: "Bachelor of Commerce",
                industry: "Business",
              },
            ].map((d) => (
              <div
                key={d.degree}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    {d.uni}
                  </span>
                  <span className="text-[10px] text-slate-200">
                    4 essential subjects
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold">{d.degree}</p>
                <p className="mt-1 text-xs text-slate-200">{d.industry}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link href="/auth/signup" className="inline-flex">
              <Button className="bg-amber-400 text-slate-900 hover:bg-amber-300">
                Explore the Roadmap →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 5 — For professionals */}
      <section id="professionals" className="mx-auto w-full max-w-6xl px-4 py-14">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-zinc-50">
          Give back. One hour at a time.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700 dark:text-zinc-300">
          Remember being 17 and having no idea what you wanted to do? Be the person
          you wish you had. Volunteer 1–2 hours a month for a conversation that
          could change someone&apos;s direction.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Timer,
              title: "Just 30 minutes",
              body: "One chat per month is enough to make a difference.",
            },
            {
              icon: CalendarDays,
              title: "You set the schedule",
              body: "Connect your Calendly, students book around your availability.",
            },
            {
              icon: GraduationCap,
              title: "Real impact",
              body: "Early career conversations have outsized effects on people’s lives.",
            },
          ].map((v) => (
            <Card
              key={v.title}
              className="border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-50">
                <v.icon className="size-5 text-amber-600" />
                <p className="text-sm font-semibold">{v.title}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-zinc-300">
                {v.body}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Link href="/auth/signup" className="inline-flex">
            <Button>Join as a Professional →</Button>
          </Link>
        </div>
      </section>

      {/* SECTION 6 — Footer */}
      <footer className="border-t border-slate-200 bg-white/70 py-10 dark:border-zinc-800 dark:bg-black/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-zinc-50">
              Verra <span aria-hidden>☕</span>
            </div>
            <p className="mt-2 max-w-sm text-sm text-slate-600 dark:text-zinc-400">
              Connecting students with the clarity they deserve.
            </p>
            <p className="mt-4 text-xs text-slate-500 dark:text-zinc-500">
              Built in Canberra 🇦🇺
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            {[
              { href: "/professionals", label: "Browse Professionals" },
              { href: "/roadmap", label: "Degree Roadmap" },
              { href: "/auth/login", label: "Sign In" },
              { href: "/auth/signup", label: "Sign Up" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "font-medium text-slate-700 hover:text-slate-900",
                  "dark:text-zinc-300 dark:hover:text-zinc-50",
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}
