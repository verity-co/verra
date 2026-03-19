"use server"

import { revalidatePath } from "next/cache"

import { createSupabaseServerClient } from "@/lib/supabase/server"

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled"

export async function updateBookingStatus(params: {
  bookingId: string
  status: BookingStatus
}) {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "professional") {
    throw new Error("Only professionals can update booking statuses.")
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: params.status })
    .eq("id", params.bookingId)
    .eq("professional_id", user.id)

  if (error) throw error

  revalidatePath("/bookings")
}

