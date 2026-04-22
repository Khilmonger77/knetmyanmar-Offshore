import { getApiBase } from './apiBase'

const base = getApiBase()

export type NotifyHealthResponse = {
  ok: boolean
  mail: {
    ready: boolean
    fromPreview: string | null
    /** Display name portion of MAIL_FROM when present (e.g. institution name). */
    senderName?: string | null
    hint: string | null
  }
}

export async function fetchNotifyHealth(): Promise<NotifyHealthResponse> {
  const r = await fetch(`${base}/api/notify/health`)
  if (!r.ok) throw new Error(`Health check failed (${r.status})`)
  return r.json() as Promise<NotifyHealthResponse>
}

export async function sendNotifyTestEmail(
  to: string,
  displayName?: string,
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const r = await fetch(`${base}/api/notify/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, displayName: displayName ?? '' }),
  })
  const data = (await r.json()) as {
    ok: boolean
    message?: string
    error?: string
  }
  if (!r.ok) {
    return { ok: false, error: data.error ?? `Request failed (${r.status})` }
  }
  return data
}
