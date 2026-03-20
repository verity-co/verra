#!/usr/bin/env python3
"""Scrape ANU catalogue Bachelor degrees and emit SQL inserts.

This scraper uses ANU's public undergraduate catalogue endpoint to enumerate
programs, then fetches each degree page to extract faculty, duration,
description, ATAR and URL. Career outcomes are generated heuristically because
that information is not consistently structured on the source pages.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://programsandcourses.anu.edu.au"
SEARCH_ENDPOINT = f"{BASE_URL}/data/ProgramSearch/GetProgramsUnderGraduate"
UNIVERSITY = "Australian National University"
UNIVERSITY_SHORT = "ANU"
VALID_INDUSTRIES = {
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
}

USER_AGENT = (
    "Mozilla/5.0 (compatible; ANU-Degree-Scraper/1.0; "
    "+https://programsandcourses.anu.edu.au/catalogue)"
)


@dataclass
class ProgramSummary:
    code: str
    degree_name: str
    year: int
    duration_years: float | None
    atar_requirement: int | None


@dataclass
class DegreeRecord:
    university: str
    university_short: str
    faculty: str | None
    degree_name: str
    duration_years: float | None
    industry: str
    description: str | None
    atar_requirement: int | None
    career_outcomes: list[str]
    url: str


class AnuScraper:
    def __init__(self, delay_seconds: float = 0.0, timeout_seconds: int = 30) -> None:
        self.delay_seconds = delay_seconds
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT})
        self.timeout_seconds = timeout_seconds

    def fetch_program_summaries(self) -> list[ProgramSummary]:
        response = self.session.get(
            SEARCH_ENDPOINT,
            params={"PageSize": 200},
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()
        payload = response.json()
        programs: list[ProgramSummary] = []

        for item in payload.get("Items", []):
            name = clean_text(item.get("ProgramName"))
            if not name.startswith("Bachelor"):
                continue

            programs.append(
                ProgramSummary(
                    code=item["AcademicPlanCode"],
                    degree_name=name,
                    year=int(item.get("ProgramAcademicYear") or 0),
                    duration_years=coerce_float(item.get("Duration")),
                    atar_requirement=coerce_int(item.get("Atar")),
                )
            )

        return programs

    def scrape_degree(self, program: ProgramSummary) -> DegreeRecord:
        url = f"{BASE_URL}/{program.year}/program/{program.code}"
        response = self.session.get(url, timeout=self.timeout_seconds)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        degree_name = text_or_none(soup.select_one("h1 .intro__degree-title__component")) or program.degree_name
        faculty = normalize_faculty(text_or_none(soup.select_one(".first-owner")))
        duration_years = parse_duration_years(
            text_or_none(soup.select_one(".degree-summary__requirements-length .tooltip-area"))
        )
        if duration_years is None:
            duration_years = program.duration_years

        atar_requirement = parse_atar(soup)
        if atar_requirement is None:
            atar_requirement = program.atar_requirement

        description = parse_description(soup)
        industry = infer_industry(degree_name, faculty, description)
        career_outcomes = generate_career_outcomes(degree_name, industry, description)

        if self.delay_seconds:
            time.sleep(self.delay_seconds)

        return DegreeRecord(
            university=UNIVERSITY,
            university_short=UNIVERSITY_SHORT,
            faculty=faculty,
            degree_name=degree_name,
            duration_years=duration_years,
            industry=industry,
            description=description,
            atar_requirement=atar_requirement,
            career_outcomes=career_outcomes,
            url=response.url,
        )


def clean_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value).strip()


def text_or_none(node) -> str | None:
    if node is None:
        return None
    text = clean_text(node.get_text(" ", strip=True))
    return text or None


def coerce_float(value) -> float | None:
    try:
        if value in (None, ""):
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def coerce_int(value) -> int | None:
    try:
        if value in (None, ""):
            return None
        return int(float(value))
    except (TypeError, ValueError):
        return None


def normalize_faculty(faculty: str | None) -> str | None:
    if not faculty:
        return None

    normalized = faculty.removeprefix("ANU ").strip()
    replacements = {
        " and ": " & ",
    }
    for old, new in replacements.items():
        normalized = normalized.replace(old, new)
    return normalized


def parse_duration_years(length_text: str | None) -> float | None:
    if not length_text:
        return None

    match = re.search(r"(\d+(?:\.\d+)?)\s+year", length_text, re.IGNORECASE)
    if not match:
        return None
    return float(match.group(1))


def parse_atar(soup: BeautifulSoup) -> int | None:
    node = soup.select_one(".degree-summary__admission-atar .degree-summary__admission-score")
    if not node:
        return None
    match = re.search(r"\d+(?:\.\d+)?", node.get_text(" ", strip=True))
    if not match:
        return None
    return int(float(match.group(0)))


def parse_description(soup: BeautifulSoup) -> str | None:
    overview_copy = soup.select_one("#overview .body__inner.w-doublewide.copy")
    if overview_copy:
        paragraphs = [clean_text(p.get_text(" ", strip=True)) for p in overview_copy.select("p")]
        paragraphs = [p for p in paragraphs if p]
        if paragraphs:
            return paragraphs[0]

        text = clean_text(overview_copy.get_text(" ", strip=True))
        if text:
            return trim_to_sentence_boundary(text, 420)

    intro_text = text_or_none(soup.select_one(".intro__degree-description__text"))
    if intro_text:
        return intro_text

    return None


def trim_to_sentence_boundary(text: str, limit: int) -> str:
    if len(text) <= limit:
        return text
    truncated = text[:limit].rsplit(". ", 1)[0].strip()
    return truncated + "." if truncated and not truncated.endswith(".") else truncated


def infer_industry(degree_name: str, faculty: str | None, description: str | None) -> str:
    title = degree_name.lower()
    haystack = " ".join(part for part in [degree_name, faculty or "", description or ""] if part).lower()

    title_keyword_groups: list[tuple[str, Sequence[str]]] = [
        ("Law", ["laws", " law", "criminology"]),
        ("Engineering", ["engineering"]),
        ("Technology", ["advanced computing", "computing", "information technology", "data analytics", "software"]),
        ("Medicine", ["medical science", "health science"]),
        ("Finance", ["accounting", "actuarial", "finance", "economics"]),
        ("Business", ["business administration", "commerce", "international business"]),
        ("Design", ["design"]),
        ("Marketing", ["marketing"]),
        ("Education", ["education"]),
        ("Government", ["public policy", "political science", "international relations", "international security", "asia-pacific affairs", "pacific studies"]),
        ("Science", ["science", "biotechnology", "genetics", "statistics", "psychology", "neuroscience", "environment and sustainability"]),
        ("Arts", ["arts", "languages", "music", "visual arts", "art history", "classical studies", "archaeological", "asian studies", "development studies", "philosophy"]),
    ]

    for industry, keywords in title_keyword_groups:
        if any(keyword in title for keyword in keywords):
            return industry

    keyword_groups: list[tuple[str, Sequence[str]]] = [
        ("Law", [" law", "laws", "legal", "criminology"]),
        ("Engineering", ["engineering", "software engineering"]),
        ("Technology", ["comput", "data analytics", "information technology", "software", "information systems"]),
        ("Medicine", ["medical", "health science", "clinical", "biomedical"]),
        ("Finance", ["accounting", "actuarial", "finance", "economics"]),
        ("Business", ["business administration", "commerce", "international business", "management"]),
        ("Design", ["design"]),
        ("Marketing", ["marketing"]),
        ("Education", ["education", "teaching"]),
        ("Government", ["public policy", "political", "international relations", "international security", "asia-pacific affairs", "pacific studies", "government"]),
        ("Science", ["science", "biotechnology", "genetics", "statistics", "sustainability", "psychology", "neuroscience"]),
        ("Arts", ["arts", "languages", "music", "visual arts", "art history", "classical studies", "archaeological", "asian studies", "development studies", "philosophy"]),
    ]

    for industry, keywords in keyword_groups:
        if any(keyword in haystack for keyword in keywords):
            return industry

    if faculty:
        faculty_text = faculty.lower()
        if "business" in faculty_text:
            return "Business"
        if "law" in faculty_text:
            return "Law"
        if "engineering" in faculty_text or "computing" in faculty_text:
            return "Technology"
        if "science" in faculty_text or "medicine" in faculty_text:
            return "Science"
        if "arts" in faculty_text:
            return "Arts"

    fallback = "Business"
    if fallback not in VALID_INDUSTRIES:
        raise ValueError(f"Invalid fallback industry: {fallback}")
    return fallback


def generate_career_outcomes(degree_name: str, industry: str, description: str | None) -> list[str]:
    title = degree_name.lower()

    specialized_roles: list[tuple[Sequence[str], list[str]]] = [
        (("accounting",), ["Accountant", "Auditor", "Financial Analyst", "Tax Consultant"]),
        (("actuarial",), ["Actuary", "Risk Analyst", "Insurance Analyst", "Quantitative Analyst"]),
        (("advanced computing", "computing", "information technology"), ["Software Engineer", "Data Engineer", "Systems Analyst", "Cybersecurity Analyst"]),
        (("software engineering",), ["Software Engineer", "Platform Engineer", "DevOps Engineer", "Technical Product Manager"]),
        (("data analytics",), ["Data Analyst", "Business Intelligence Analyst", "Analytics Consultant", "Product Analyst"]),
        (("archaeological",), ["Archaeologist", "Heritage Consultant", "Collections Officer", "Museum Project Officer"]),
        (("art history",), ["Curator", "Gallery Coordinator", "Collections Assistant", "Arts Program Officer"]),
        (("arts",), ["Policy Officer", "Communications Advisor", "Research Officer", "Program Coordinator"]),
        (("asia-pacific affairs", "asian studies", "pacific studies"), ["Policy Officer", "International Affairs Analyst", "Diplomatic Support Officer", "Program Coordinator"]),
        (("business administration",), ["Business Analyst", "Operations Manager", "Management Consultant", "Project Coordinator"]),
        (("commerce",), ["Management Consultant", "Business Analyst", "Financial Analyst", "Operations Analyst"]),
        (("criminology",), ["Policy Analyst", "Intelligence Analyst", "Compliance Officer", "Justice Program Officer"]),
        (("design",), ["UX Designer", "Service Designer", "Brand Designer", "Creative Strategist"]),
        (("development studies",), ["Development Program Officer", "Policy Analyst", "Research Officer", "NGO Project Coordinator"]),
        (("economics",), ["Economist", "Policy Analyst", "Economic Consultant", "Market Analyst"]),
        (("engineering",), ["Engineer", "Systems Engineer", "Project Engineer", "Engineering Consultant"]),
        (("environment and sustainability",), ["Sustainability Analyst", "Environmental Consultant", "Climate Policy Officer", "ESG Analyst"]),
        (("finance",), ["Financial Analyst", "Investment Analyst", "Risk Analyst", "Corporate Finance Associate"]),
        (("genetics",), ["Genetics Research Assistant", "Laboratory Scientist", "Biotech Analyst", "Clinical Research Coordinator"]),
        (("health science",), ["Health Policy Officer", "Public Health Analyst", "Clinical Research Assistant", "Health Program Coordinator"]),
        (("international business",), ["Business Development Analyst", "Trade Analyst", "Market Research Analyst", "Operations Consultant"]),
        (("international relations",), ["Foreign Affairs Officer", "Policy Analyst", "Intelligence Analyst", "Program Officer"]),
        (("international security",), ["Security Analyst", "Intelligence Analyst", "Policy Officer", "Risk Consultant"]),
        (("languages",), ["Translator", "International Programs Officer", "Communications Advisor", "Cultural Liaison Officer"]),
        (("laws",), ["Lawyer", "Policy Adviser", "Legal Analyst", "Compliance Officer"]),
        (("mathematical sciences",), ["Data Scientist", "Quantitative Analyst", "Research Analyst", "Statistician"]),
        (("medical science",), ["Clinical Research Assistant", "Medical Laboratory Scientist", "Biotech Analyst", "Health Data Analyst"]),
        (("music",), ["Performer", "Music Educator", "Arts Administrator", "Producer"]),
        (("philosophy, neuroscience, and psychology",), ["Behavioural Analyst", "Research Assistant", "Health Research Officer", "Policy Analyst"]),
        (("philosophy",), ["Research Assistant", "Policy Analyst", "Academic Program Officer", "Communications Advisor"]),
        (("political science",), ["Policy Analyst", "Political Adviser", "Research Officer", "Government Relations Officer"]),
        (("politics, philosophy and economics",), ["Policy Analyst", "Strategy Consultant", "Economic Adviser", "Public Sector Analyst"]),
        (("public policy",), ["Policy Officer", "Government Adviser", "Program Evaluator", "Public Sector Consultant"]),
        (("science (psychology)", "psychology"), ["Research Assistant", "Behavioural Analyst", "Mental Health Support Worker", "Human Factors Analyst"]),
        (("science",), ["Research Scientist", "Laboratory Analyst", "Data Analyst", "Science Communicator"]),
        (("statistics",), ["Statistician", "Data Analyst", "Quantitative Researcher", "Risk Analyst"]),
        (("visual arts",), ["Visual Artist", "Gallery Coordinator", "Exhibition Assistant", "Creative Producer"]),
    ]

    for keywords, roles in specialized_roles:
        if any(keyword in title for keyword in keywords):
            return roles

    generic_by_industry = {
        "Technology": ["Software Engineer", "Business Analyst", "Product Analyst", "Technology Consultant"],
        "Medicine": ["Clinical Research Assistant", "Health Program Officer", "Public Health Analyst", "Medical Laboratory Scientist"],
        "Law": ["Lawyer", "Legal Analyst", "Policy Adviser", "Compliance Officer"],
        "Finance": ["Financial Analyst", "Risk Analyst", "Investment Analyst", "Business Consultant"],
        "Engineering": ["Engineer", "Project Engineer", "Systems Engineer", "Engineering Consultant"],
        "Marketing": ["Marketing Coordinator", "Brand Strategist", "Market Research Analyst", "Digital Marketing Specialist"],
        "Design": ["Designer", "UX Designer", "Creative Strategist", "Brand Designer"],
        "Education": ["Teacher", "Education Program Officer", "Curriculum Designer", "Learning Advisor"],
        "Science": ["Research Assistant", "Laboratory Analyst", "Data Analyst", "Science Communicator"],
        "Government": ["Policy Officer", "Program Coordinator", "Research Officer", "Government Adviser"],
        "Arts": ["Communications Advisor", "Program Coordinator", "Research Officer", "Content Producer"],
        "Business": ["Business Analyst", "Management Consultant", "Operations Analyst", "Project Coordinator"],
    }

    outcomes = generic_by_industry[industry]
    if description and "research" in description.lower() and "Research Assistant" not in outcomes:
        outcomes = list(outcomes)
        outcomes[-1] = "Research Assistant"
    return outcomes


def sql_quote(value: str) -> str:
    escaped = value.replace("'", "''")
    return f"'{escaped}'"


def sql_value(value) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, str):
        return sql_quote(value)
    if isinstance(value, float):
        if value.is_integer():
            return str(int(value))
        return str(value)
    if isinstance(value, int):
        return str(value)
    raise TypeError(f"Unsupported SQL value type: {type(value)!r}")


def sql_array(values: Iterable[str]) -> str:
    items = ", ".join(sql_quote(value) for value in values)
    return f"ARRAY[{items}]"


def build_insert_statement(records: Sequence[DegreeRecord]) -> str:
    values_sql = []
    for record in records:
        values_sql.append(
            "(" + ", ".join(
                [
                    "gen_random_uuid()",
                    sql_value(record.university),
                    sql_value(record.university_short),
                    sql_value(record.faculty),
                    sql_value(record.degree_name),
                    sql_value(record.duration_years),
                    sql_value(record.industry),
                    sql_value(record.description),
                    sql_value(record.atar_requirement),
                    sql_array(record.career_outcomes),
                    sql_value(record.url),
                ]
            ) + ")"
        )

    return (
        "insert into degrees "
        "(id, university, university_short, faculty, degree_name, duration_years, industry, description, atar_requirement, career_outcomes, url) values\n"
        + ",\n".join(values_sql)
        + ";"
    )


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        type=Path,
        help="Optional file path to write the generated SQL output.",
    )
    parser.add_argument(
        "--json-output",
        type=Path,
        help="Optional file path to also write scraped records as JSON.",
    )
    parser.add_argument(
        "--exclude-honours",
        action="store_true",
        help="Exclude degrees whose title contains '(Honours)'.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        help="Only scrape the first N matching degrees.",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.2,
        help="Delay in seconds between degree page requests. Default: 0.2",
    )
    return parser.parse_args(argv)


def main(argv: Sequence[str]) -> int:
    args = parse_args(argv)
    scraper = AnuScraper(delay_seconds=args.delay)

    programs = scraper.fetch_program_summaries()
    programs.sort(key=lambda item: item.degree_name)

    if args.exclude_honours:
        programs = [item for item in programs if "(Honours)" not in item.degree_name]

    if args.limit is not None:
        programs = programs[: args.limit]

    records = [scraper.scrape_degree(program) for program in programs]
    sql_output = build_insert_statement(records)

    if args.output:
        args.output.write_text(sql_output + "\n", encoding="utf-8")
    else:
        print(sql_output)

    if args.json_output:
        payload = [record.__dict__ for record in records]
        args.json_output.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(
        f"Scraped {len(records)} ANU degree rows.",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
