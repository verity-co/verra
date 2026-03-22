import { NextRequest, NextResponse } from "next/server"

import { getCalendlyInvitee, getCalendlyScheduledEvent } from "@/lib/calendly"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type BookingRow = {
  id: string
  status: string
  scheduled_at: string | null
  created_at: string | null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = userData.user

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (profile?.role !== "student") {
      return NextResponse.json(
        { error: "Only students can sync bookings." },
        { status: 403 },
      )
    }

    const body = (await request.json()) as {
      professionalId?: string
      eventUri?: string
      inviteeUri?: string
    }

    if (!body.professionalId || !body.eventUri || !body.inviteeUri) {
      return NextResponse.json(
        { error: "Missing Calendly booking details." },
        { status: 400 },
      )
    }

    const [event, invitee] = await Promise.all([
      getCalendlyScheduledEvent(body.eventUri),
      getCalendlyInvitee(body.inviteeUri),
    ])

    const scheduledAt = event.start_time ?? null
    if (!scheduledAt) {
      return NextResponse.json(
        { error: "Calendly event did not include a start time." },
        { status: 422 },
      )
    }

    if (invitee.email && user.email && invitee.email !== user.email) {
      return NextResponse.json(
        { error: "This Calendly booking belongs to a different email address." },
        { status: 403 },
      )
    }

    const { data: exactExisting } = await supabase
      .from("bookings")
      .select("id, status, scheduled_at, created_at")
      .eq("student_id", user.id)
      .eq("professional_id", body.professionalId)
      .eq("scheduled_at", scheduledAt)
      .maybeSingle()

    let bookingId = (exactExisting as BookingRow | null)?.id ?? null

    if (bookingId) {
      return NextResponse.json({
        ok: true,
        bookingId,
        scheduledAt,
      })
    }

    const { data: pendingRows } = await supabase
      .from("bookings")
      .select("id, status, scheduled_at, created_at")
      .eq("student_id", user.id)
      .eq("professional_id", body.professionalId)
      .is("scheduled_at", null)
      .order("created_at", { ascending: false })
      .limit(1)

    const pendingBooking = (pendingRows?.[0] as BookingRow | undefined) ?? null

    if (pendingBooking) {
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          status: "confirmed",
          scheduled_at: scheduledAt,
        })
        .eq("id", pendingBooking.id)

      if (updateError) throw updateError

      bookingId = pendingBooking.id
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("bookings")
        .insert({
          status: "confirmed",
          student_id: user.id,
          professional_id: body.professionalId,
          scheduled_at: scheduledAt,
        })
        .select("id")
        .single()

      if (insertError) throw insertError
      bookingId = inserted.id as string
    }

    return NextResponse.json({
      ok: true,
      bookingId,
      scheduledAt,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync Calendly booking."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
