import RoadmapExplorer from "@/components/roadmap/RoadmapExplorer";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SubjectRequirement = {
  id: string;
  subject_name: string;
  year_level: string;
  requirement_type: "essential" | "recommended" | "useful";
  notes: string | null;
};

export type DegreeWithRequirements = {
  id: string;
  university: string;
  university_short: string;
  faculty: string;
  degree_name: string;
  duration_years: number | null;
  industry: string | null;
  description: string | null;
  atar_requirement: number | null;
  career_outcomes: string[] | null;
  url: string | null;
  subject_requirements: SubjectRequirement[];
};

type DegreeRow = Omit<DegreeWithRequirements, "subject_requirements"> & {
  subject_requirements: SubjectRequirement[] | null;
};

export default async function RoadmapPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("degrees")
    .select(
      "id, university, university_short, faculty, degree_name, duration_years, industry, description, atar_requirement, career_outcomes, url, subject_requirements(id, subject_name, year_level, requirement_type, notes)",
    )
    .order("university", { ascending: true })
    .order("degree_name", { ascending: true });

  if (error) {
    return (
      <div className="min-h-[calc(100vh-0px)] bg-zinc-50 dark:bg-black">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Degree Roadmap
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            We couldn&apos;t load degree data right now. Please try again in a few
            minutes.
          </p>
        </div>
      </div>
    );
  }

  const degrees: DegreeWithRequirements[] =
    ((data as DegreeRow[] | null) ?? []).map((d) => ({
      id: d.id as string,
      university: d.university as string,
      university_short: d.university_short as string,
      faculty: d.faculty as string,
      degree_name: d.degree_name as string,
      duration_years: (d.duration_years as number | null) ?? null,
      industry: (d.industry as string | null) ?? null,
      description: (d.description as string | null) ?? null,
      atar_requirement: (d.atar_requirement as number | null) ?? null,
      career_outcomes: (d.career_outcomes as string[] | null) ?? null,
      url: (d.url as string | null) ?? null,
      subject_requirements: d.subject_requirements ?? [],
    }));

  return (
    <div className="min-h-[calc(100vh-0px)] bg-zinc-50 dark:bg-black">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Degree Roadmap
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Explore degrees at Australia&apos;s Group of Eight universities and see
            which Year 11–12 subjects help you get there.
          </p>
        </div>

        <RoadmapExplorer degrees={degrees} />
      </div>
    </div>
  );
}
