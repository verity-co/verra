"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import ProfessionalCard, {
  type ProfessionalCardModel,
} from "@/components/professionals/ProfessionalCard"
import { cn } from "@/lib/utils"

type Props = {
  professionals: ProfessionalCardModel[]
}

export default function ProfessionalGrid({ professionals }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = React.useState("")
  const initialIndustryParam = React.useMemo(
    () => searchParams.get("industry"),
    [searchParams],
  )
  const [activeIndustries, setActiveIndustries] = React.useState<Set<string>>(
    () => new Set(),
  )

  React.useEffect(() => {
    const param = initialIndustryParam
    if (param) {
      const fromUrl = param.split(",").map((v) => v.trim()).filter(Boolean)
      if (fromUrl.length > 0) {
        setActiveIndustries(new Set(fromUrl))
      }
    }
  }, [initialIndustryParam])

  // 2. SYNC STATE TO URL (Only runs when activeIndustries changes)
  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Convert Set to string for URL
    const currentParam = Array.from(activeIndustries).join(",")
    
    // Only update if the URL actually needs to change to avoid redundant renders
    if (searchParams.get("industry") === (currentParam || null)) return

    if (activeIndustries.size === 0) {
      params.delete("industry")
    } else {
      params.set("industry", currentParam)
    }
    
    const qs = params.toString()
    const url = qs ? `?${qs}` : window.location.pathname
    router.replace(url, { scroll: false })
  }, [activeIndustries, router, searchParams])

  const industries = React.useMemo(() => {
    const set = new Set<string>()
    for (const p of professionals) {
      if (p.industry) set.add(p.industry)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [professionals])

  // 3. HANDLERS (State only, no router calls)
  function toggleIndustry(industry: string) {
    setActiveIndustries((prev) => {
      const next = new Set(prev)
      if (next.has(industry)) next.delete(industry)
      else next.add(industry)
      return next
    })
  }

  function clearIndustries() {
    setActiveIndustries(new Set())
  }

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return professionals.filter((p) => {
      const matchesQuery =
        !q ||
        p.full_name.toLowerCase().includes(q) ||
        (p.industry ?? "").toLowerCase().includes(q) ||
        (p.job_title ?? "").toLowerCase().includes(q)

      const matchesIndustry =
        activeIndustries.size === 0 ||
        (p.industry ? activeIndustries.has(p.industry) : false)

      return matchesQuery && matchesIndustry
    })
  }, [professionals, query, activeIndustries])

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, industry, or job title…"
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={clearIndustries}
          className={cn(
            "rounded-full border px-3 py-1 text-sm transition-colors",
            activeIndustries.size === 0
              ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
              : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-950/60",
          )}
        >
          All
        </button>

        {industries.map((industry) => {
          const active = activeIndustries.has(industry)
          return (
            <button
              key={industry}
              type="button"
              onClick={() => toggleIndustry(industry)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                active
                  ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
                  : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-950/60",
              )}
            >
              {industry}
            </button>
          )
        })}

        <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Badge variant="outline">{filtered.length}</Badge>
          <span>matches</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-8 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          No professionals match your search yet. Try a different keyword or
          clear filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProfessionalCard key={p.id} professional={p} />
          ))}
        </div>
      )}
    </div>
  )
}
