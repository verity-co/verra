import { type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI, Content } from "@google/generative-ai"

// FIX 1: Role is "model" (not "assistant") to match Gemini's convention and the frontend
type ConversationTurn = {
  role: "user" | "model"
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: userData } = await supabase.auth.getUser()

    const user = userData.user
    if (!user) {
      // FIX 2: Return a streaming-compatible error response
      return new Response(
        `data: ${JSON.stringify({ error: "Unauthorized" })}\n\ndata: [DONE]\n\n`,
        { status: 401, headers: { "Content-Type": "text/event-stream" } }
      )
    }

    const body = await request.json()
    const message: string | undefined = body?.message
    const conversationHistory: ConversationTurn[] = body?.conversationHistory ?? []

    if (!message || typeof message !== "string") {
      return new Response(
        `data: ${JSON.stringify({ error: "Missing message" })}\n\ndata: [DONE]\n\n`,
        { status: 400, headers: { "Content-Type": "text/event-stream" } }
      )
    }

    const { data: studentProfile, error: studentError } = await supabase
      .from("student_profiles")
      .select("year_level, interests, career_uncertainty_notes")
      .eq("id", user.id)
      .maybeSingle()

    if (studentError) console.error("Error fetching student profile:", studentError)

    const yearLevel = studentProfile?.year_level ?? "Unknown"
    const interestsValue = Array.isArray(studentProfile?.interests)
      ? (studentProfile!.interests as string[]).join(", ")
      : studentProfile?.interests ?? "Not specified"
    const uncertainty = studentProfile?.career_uncertainty_notes ?? "They haven't shared this yet."

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

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    })

    // FIX 3: Role mapping is now correct — "model" stays "model", everything else is "user"
    // Previously the check was `turn.role === "model" ? "model" : "user"` which was correct
    // in isolation, but the old ConversationTurn type declared "assistant" so the roles
    // arriving from the client were already "model" — now the type and mapping are consistent.
    const history: Content[] = conversationHistory.map((turn: ConversationTurn) => ({
      role: turn.role === "model" ? "model" : "user",
      parts: [{ text: turn.content }],
    }))

    // FIX 4: Use sendMessageStream instead of sendMessage, and return an SSE ReadableStream
    const chatSession = model.startChat({ history })
    const streamResult = await chatSession.sendMessageStream(message)

    let fullResponse = ""

    const stream = new ReadableStream({
      async start(controller) {
        const encode = (data: object) =>
          new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)

        try {
          for await (const chunk of streamResult.stream) {
            const text = chunk.text()
            if (!text) continue

            fullResponse += text

            // Check if the accumulated text contains a booking suggestion —
            // strip it before sending to the client so it never appears in the bubble.
            const match = fullResponse.match(/SUGGEST_BOOKING:([A-Za-z ]+)/)
            let cleanChunk = text

            if (match) {
              // Only emit the suggestion event once, on the chunk that completes the tag
              if (text.includes(match[0]) || fullResponse.includes(match[0])) {
                const suggestedIndustry = match[1].trim()
                cleanChunk = text.replace(match[0], "").trim()
                controller.enqueue(encode({ suggestedIndustry }))
              }
            }

            if (cleanChunk) {
              controller.enqueue(encode({ text: cleanChunk }))
            }
          }

          // Save to Supabase after streaming is complete
          const cleanedFull = fullResponse.replace(/SUGGEST_BOOKING:[A-Za-z ]+/, "").trim()
          const { error: insertError } = await supabase.from("journal_entries").insert({
            student_id: user.id,
            content: message,
            ai_response: cleanedFull,
          })
          if (insertError) console.error("Error inserting journal entry:", insertError)

          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"))
          controller.close()
        } catch (err) {
          console.error("Streaming error:", err)
          controller.enqueue(encode({ error: "Stream failed" }))
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Journal API error:", error)
    const errorStream = new TextEncoder().encode(
      `data: ${JSON.stringify({ error: "Internal server error" })}\n\ndata: [DONE]\n\n`
    )
    return new Response(errorStream, {
      status: 500,
      headers: { "Content-Type": "text/event-stream" },
    })
  }
}