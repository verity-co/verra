"use client"

import * as React from "react";
import { ExternalLink, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  DegreeWithRequirements,
  SubjectRequirement,
} from "@/app/roadmap/page";

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
] as const;

const GO8_UNIS = [
  "ANU",
  "Melbourne",
  "Sydney",
  "UNSW",
  "Queensland",
  "Monash",
  "Adelaide",
  "Western Australia",
] as const;

const uniColourClasses: Record<string, string> = {
  ANU: "bg-blue-600 text-white",
  Melbourne: "bg-sky-900 text-white",
  Sydney: "bg-red-600 text-white",
  UNSW: "bg-yellow-400 text-zinc-900",
  Queensland: "bg-purple-700 text-white",
  Monash: "bg-zinc-700 text-white",
  Adelaide: "bg-teal-600 text-white",
  "Western Australia": "bg-green-600 text-white",
};

type DurationFilter = "any" | 3 | 4 | 5;

type Props = {
  degrees: DegreeWithRequirements[];
};

export default function RoadmapExplorer({ degrees }: Props) {
  const router = useRouter();

  const [selectedIndustries, setSelectedIndustries] = React.useState<
    Set<string>
  >(() => new Set());
  const [selectedUnis, setSelectedUnis] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [minAtar, setMinAtar] = React.useState(60);
  const [duration, setDuration] = React.useState<DurationFilter>("any");
  const [search, setSearch] = React.useState("");
  const [selectedDegreeId, setSelectedDegreeId] = React.useState<
    string | null
  >(null);

  const filteredDegrees = React.useMemo(() => {
    const s = search.trim().toLowerCase();

    return degrees.filter((d) => {
      if (
        selectedIndustries.size > 0 &&
        d.industry &&
        !selectedIndustries.has(d.industry)
      ) {
        return false;
      }

      if (
        selectedUnis.size > 0 &&
        !selectedUnis.has(d.university_short) &&
        !selectedUnis.has(d.university)
      ) {
        return false;
      }

      if (d.atar_requirement !== null && d.atar_requirement < minAtar) {
        return false;
      }

      if (
        duration !== "any" &&
        d.duration_years !== null &&
        d.duration_years !== duration
      ) {
        return false;
      }

      if (!s) return true;

      const haystack = [
        d.degree_name,
        d.university,
        d.university_short,
        d.faculty,
        d.industry ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(s);
    });
  }, [degrees, selectedIndustries, selectedUnis, minAtar, duration, search]);

  const selectedDegree =
    filteredDegrees.find((d) => d.id === selectedDegreeId) ??
    filteredDegrees[0] ??
    null;

  React.useEffect(() => {
    if (!selectedDegreeId && filteredDegrees.length > 0) {
      setSelectedDegreeId(filteredDegrees[0].id);
    }
  }, [filteredDegrees, selectedDegreeId]);

  function toggleIndustry(industry: string) {
    setSelectedIndustries((prev) => {
      const next = new Set(prev);
      if (next.has(industry)) next.delete(industry);
      else next.add(industry);
      return next;
    });
  }

  function toggleUni(uni: string) {
    setSelectedUnis((prev) => {
      const next = new Set(prev);
      if (next.has(uni)) next.delete(uni);
      else next.add(uni);
      return next;
    });
  }

  function clearFilters() {
    setSelectedIndustries(new Set());
    setSelectedUnis(new Set());
    setMinAtar(60);
    setDuration("any");
    setSearch("");
  }

  function uniBadgeClass(shortName: string) {
    return (
      uniColourClasses[shortName] ??
      "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
    );
  }

  function requirementVariant(
    type: SubjectRequirement["requirement_type"],
  ): "destructive" | "warning" | "success" | "default" {
    if (type === "essential") return "destructive";
    if (type === "recommended") return "warning";
    if (type === "useful") return "success";
    return "default";
  }

  function requirementLabel(type: SubjectRequirement["requirement_type"]) {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  return (
    <main className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,260px)_minmax(0,1.4fr)_minmax(0,1.6fr)] lg:gap-6">
      {/* Panel 1 – Filters */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Find Your Degree
            </h2>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Filter by what excites you and where you&apos;d like to study.
            </p>
          </div>
          <SlidersHorizontal className="hidden size-4 text-zinc-500 lg:block" />
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
              Industry
            </p>
            <div className="flex flex-wrap gap-1.5">
              {INDUSTRIES.map((industry) => {
                const active = selectedIndustries.has(industry);
                return (
                  <button
                    key={industry}
                    type="button"
                    onClick={() => toggleIndustry(industry)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition-colors",
                      active
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                        : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900",
                    )}
                  >
                    {industry}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
              University
            </p>
            <div className="flex flex-wrap gap-1.5">
              {GO8_UNIS.map((uni) => {
                const active = selectedUnis.has(uni);
                return (
                  <button
                    key={uni}
                    type="button"
                    onClick={() => toggleUni(uni)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition-colors",
                      active
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                        : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900",
                    )}
                  >
                    {uni}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                Minimum ATAR
              </p>
              <Badge variant="outline">{minAtar}+ </Badge>
            </div>
            <input
              type="range"
              min={60}
              max={99}
              value={minAtar}
              onChange={(e) => setMinAtar(Number(e.target.value))}
              className="w-full accent-zinc-900"
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
              Duration
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Any", value: "any" as DurationFilter },
                { label: "3 years", value: 3 as DurationFilter },
                { label: "4 years", value: 4 as DurationFilter },
                { label: "5 years", value: 5 as DurationFilter },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setDuration(opt.value)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    duration === opt.value
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                      : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
              Search
            </p>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by degree or uni…"
              className="h-8 text-xs"
            />
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-zinc-600 underline underline-offset-4 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Clear filters
          </button>
        </div>
      </section>

      {/* Panel 2 – Degree list */}
      <section className="space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
          <p>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {filteredDegrees.length}
            </span>{" "}
            degrees found
          </p>
        </div>

        <div className="space-y-2">
          {filteredDegrees.map((d) => {
            const outcomes = d.career_outcomes ?? [];
            const firstThree = outcomes.slice(0, 3);
            const remainingCount = Math.max(outcomes.length - 3, 0);
            const active = selectedDegree?.id === d.id;

            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDegreeId(d.id)}
                className="w-full text-left"
              >
                <Card
                  className={cn(
                    "flex flex-col gap-2 border border-zinc-200 bg-white px-3 py-2.5 text-xs transition-all hover:border-zinc-900 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-50",
                    active &&
                      "border-zinc-900 ring-2 ring-zinc-900/10 dark:border-zinc-50 dark:ring-zinc-50/20",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        uniBadgeClass(d.university_short),
                      )}
                    >
                      {d.university_short}
                    </span>
                    <p className="truncate text-[11px] text-zinc-600 dark:text-zinc-400">
                      {d.university}
                    </p>
                  </div>

                  <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                    {d.degree_name}
                  </p>
                  <p className="truncate text-[11px] text-zinc-600 dark:text-zinc-400">
                    {d.faculty}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
                    {d.duration_years ? (
                      <span>{d.duration_years}-year degree</span>
                    ) : null}
                    {d.atar_requirement ? (
                      <span>• ATAR {d.atar_requirement}+</span>
                    ) : null}
                    {d.industry ? (
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        {d.industry}
                      </Badge>
                    ) : null}
                  </div>

                  {firstThree.length ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {firstThree.map((o) => (
                        <span
                          key={o}
                          className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                        >
                          {o}
                        </span>
                      ))}
                      {remainingCount > 0 ? (
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                          +{remainingCount} more
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </Card>
              </button>
            );
          })}

          {filteredDegrees.length === 0 ? (
            <Card className="mt-4 border-dashed border-zinc-200 bg-white p-4 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              No degrees match these filters yet. Try widening your ATAR range
              or clearing a few filters.
            </Card>
          ) : null}
        </div>
      </section>

      {/* Panel 3 – Degree detail */}
      <section className="mt-4 space-y-3 lg:mt-0">
        {!selectedDegree ? (
          <Card className="flex h-full flex-col items-center justify-center gap-2 border-dashed border-zinc-200 bg-white px-6 py-10 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <div className="text-3xl" aria-hidden>
              🎓
            </div>
            <p className="font-medium text-zinc-800 dark:text-zinc-100">
              Select a degree to see the subject roadmap
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              You&apos;ll see which Year 11–12 subjects are essential,
              recommended, and simply helpful.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    uniBadgeClass(selectedDegree.university_short),
                  )}
                >
                  {selectedDegree.university_short}
                </span>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {selectedDegree.university}
                </p>
              </div>
              <h2 className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                {selectedDegree.degree_name}
              </h2>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {selectedDegree.faculty}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                {selectedDegree.duration_years ? (
                  <span>{selectedDegree.duration_years}-year degree</span>
                ) : null}
                {selectedDegree.atar_requirement ? (
                  <span>ATAR {selectedDegree.atar_requirement}+</span>
                ) : null}
                {selectedDegree.industry ? (
                  <Badge variant="outline">{selectedDegree.industry}</Badge>
                ) : null}
              </div>

              {selectedDegree.description ? (
                <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                  {selectedDegree.description}
                </p>
              ) : null}

              {selectedDegree.url ? (
                <div className="mt-4">
                  <a
                    href={selectedDegree.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button size="sm" variant="outline">
                      View on {selectedDegree.university_short} website
                      <ExternalLink className="ml-1.5 size-3.5" />
                    </Button>
                  </a>
                </div>
              ) : null}
            </Card>

            {/* Career outcomes */}
            {selectedDegree.career_outcomes?.length ? (
              <Card className="border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  Career Outcomes
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedDegree.career_outcomes.map((outcome) => (
                    <span
                      key={outcome}
                      className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      {outcome}
                    </span>
                  ))}
                </div>
              </Card>
            ) : null}

            {/* Subject roadmap */}
            <Card className="border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Subject Roadmap
              </h3>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                These subjects help you prepare for entry. Universities may also
                accept equivalents in your state.
              </p>

              <div className="mt-3 space-y-4 text-xs">
                {["Year 11", "Year 12"].map((year) => {
                  const subjects = selectedDegree.subject_requirements.filter(
                    (s) => s.year_level === year,
                  );
                  if (!subjects.length) return null;

                  return (
                    <div key={year} className="space-y-1.5">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {year}
                      </p>
                      <div className="space-y-1">
                        {subjects.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-start justify-between gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-900"
                          >
                            <div>
                              <p className="text-xs text-zinc-900 dark:text-zinc-100">
                                {s.subject_name}
                              </p>
                              {s.notes ? (
                                <p className="mt-0.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                                  {s.notes}
                                </p>
                              ) : null}
                            </div>
                            <Badge
                              variant={requirementVariant(s.requirement_type)}
                              className="ml-2 shrink-0 text-[10px]"
                            >
                              {requirementLabel(s.requirement_type)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* CTA */}
            {selectedDegree.industry ? (
              <Card className="border-amber-200/70 bg-amber-50/80 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
                <p className="font-medium">
                  Want to talk to someone in {selectedDegree.industry}?
                </p>
                <p className="mt-1 text-xs">
                  Book a free CoffeeChat with a{" "}
                  {selectedDegree.industry.toLowerCase()} professional who&apos;s
                  walked this path.
                </p>
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-400 bg-amber-100 text-xs text-amber-900 hover:bg-amber-200 dark:border-amber-700 dark:bg-transparent dark:text-amber-100 dark:hover:bg-amber-900/40"
                    onClick={() =>
                      router.push(
                        `/professionals?industry=${encodeURIComponent(
                          selectedDegree.industry!,
                        )}`,
                      )
                    }
                  >
                    Browse {selectedDegree.industry} professionals
                  </Button>
                </div>
              </Card>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}

