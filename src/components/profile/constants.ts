export const YEAR_LEVELS = [
  "Year 10",
  "Year 11",
  "Year 12",
  "First Year Uni",
  "Second Year Uni",
  "Third Year Uni",
  "Fourth Year+",
] as const

export type YearLevel = (typeof YEAR_LEVELS)[number]

export const UNI_LEVELS: Set<YearLevel> = new Set([
  "First Year Uni",
  "Second Year Uni",
  "Third Year Uni",
  "Fourth Year+",
])

export const INTERESTS = [
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

export type Interest = (typeof INTERESTS)[number]

export const INDUSTRIES = [
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

export type Industry = (typeof INDUSTRIES)[number]

export const YEARS_EXPERIENCE = ["1-2", "3-5", "6-10", "10+"] as const

export type YearsExperience = (typeof YEARS_EXPERIENCE)[number]
