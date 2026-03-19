import { redirect } from "next/navigation"

import JournalChat from "@/components/journal/JournalChat"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function JournalPage() {
  const supabase = await createSupabaseServerClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) redirect("/auth/login")

  const userId = userData.user.id

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id, content, ai_response, created_at")
    .eq("student_id", userId)
    .order("created_at", { ascending: true })
    .limit(20)

  const initialMessages =
    entries?.map((e) => ({
      id: e.id as string,
      content: e.content as string,
      ai_response: (e.ai_response as string | null) ?? "",
      created_at: e.created_at as string | null,
    })) ?? []

  return (
    <div className="min-h-[calc(100vh-0px)] bg-zinc-50 dark:bg-black">
      <JournalChat initialMessages={initialMessages} studentId={userId} />
    </div>
  )
}

