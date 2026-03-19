import { NextResponse, type NextRequest } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

import { GoogleGenerativeAI, Content } from "@google/generative-ai"


type ConversationTurn = {
  role: "user" | "assistant"
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: userData } = await supabase.auth.getUser()

    const user = userData.user
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const message: string | undefined = body?.message
    const conversationHistory: ConversationTurn[] = body?.conversationHistory ?? []

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Missing message" },
        { status: 400 },
      )
    }

    const { data: studentProfile, error: studentError } = await supabase
      .from("student_profiles")
      .select("year_level, interests, career_uncertainty_notes")
      .eq("id", user.id)
      .maybeSingle()

    if (studentError) {
      console.error("Error fetching student profile:", studentError)
    }

    const yearLevel = studentProfile?.year_level ?? "Unknown"
    const interestsValue = Array.isArray(studentProfile?.interests)
      ? (studentProfile!.interests as string[]).join(", ")
      : studentProfile?.interests ?? "Not specified"
    const uncertainty =
      studentProfile?.career_uncertainty_notes ??
      "They haven’t shared this yet."

    const systemPrompt = `
You are a warm, encouraging career advisor helping students aged 15-25 in Australia find clarity and direction in their careers. You have deep knowledge of Australian universities, degrees, and career pathways.

The student you are talking to:
- Year level: ${yearLevel}
- Interests: ${interestsValue}
- What they're unsure about: ${uncertainty}

Your approach:
- Ask thoughtful questions to understand what genuinely excites them
- Be honest but encouraging — never dismissive of their ideas
- Reference real Australian career pathways, salaries, and opportunities where relevant
- If they seem to have a clearer direction, suggest they book a coffee chat with a professional on our platform by saying exactly: 
  SUGGEST_BOOKING:{industry} where industry is one of: Technology, Medicine, Law, Finance, Engineering, Marketing, Design, Education, Science, Government, Arts, Business
- Keep responses conversational and concise — 3-4 paragraphs max
- Never be preachy or lecture them
`.trim()

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 500 },
      )
    }

    const messagesPayload = [
      ...conversationHistory.map((turn) => ({
        role: turn.role,
        content: [{ type: "text", text: turn.content }],
      })),
      {
        role: "user" as const,
        content: [{ type: "text", text: message }],
      },
    ]

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: messagesPayload,
      }),
    })

    if (!anthropicRes.ok) {
      const text = await anthropicRes.text()
      console.error("Anthropic error:", anthropicRes.status, text)
      return NextResponse.json(
        { error: "Failed to get response from AI" },
        { status: 502 },
      )
    }

    const anthropicJson: any = await anthropicRes.json()
    const rawText: string =
      anthropicJson?.content?.[0]?.text ??
      anthropicJson?.content?.[0]?.content?.[0]?.text ??
      ""

    let cleanedResponse = rawText
    let suggestedIndustry: string | null = null

    const match = cleanedResponse.match(/SUGGEST_BOOKING:([A-Za-z ]+)/)
    if (match) {
      suggestedIndustry = match[1].trim()
      cleanedResponse = cleanedResponse.replace(match[0], "").trim()
    }

    const { error: insertError } = await supabase.from("journal_entries").insert({
      student_id: user.id,
      content: message,
      ai_response: cleanedResponse,
    })

    if (insertError) {
      console.error("Error inserting journal entry:", insertError)
    }

    return NextResponse.json({
      response: cleanedResponse,
      suggestedIndustry,
    })
  } catch (error) {
    console.error("Journal API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}

