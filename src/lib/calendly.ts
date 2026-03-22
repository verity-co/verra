const CALENDLY_API_BASE = "https://api.calendly.com"

type CalendlyScheduledEvent = {
  uri?: string
  start_time?: string
  status?: string
}

type CalendlyInvitee = {
  uri?: string
  email?: string
}

function getCalendlyToken() {
  const token = process.env.CALENDLY_PERSONAL_ACCESS_TOKEN

  if (!token) {
    throw new Error(
      "Missing CALENDLY_PERSONAL_ACCESS_TOKEN. Add a Calendly personal access token to enable booking time sync.",
    )
  }

  return token
}

async function calendlyGet<T>(uri: string): Promise<T> {
  const token = getCalendlyToken()
  const url = uri.startsWith("http") ? uri : `${CALENDLY_API_BASE}${uri}`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Calendly request failed with ${response.status}.`)
  }

  const payload = (await response.json()) as { resource?: T } | T
  return "resource" in payload ? (payload.resource as T) : (payload as T)
}

export async function getCalendlyScheduledEvent(eventUri: string) {
  return calendlyGet<CalendlyScheduledEvent>(eventUri)
}

export async function getCalendlyInvitee(inviteeUri: string) {
  return calendlyGet<CalendlyInvitee>(inviteeUri)
}
