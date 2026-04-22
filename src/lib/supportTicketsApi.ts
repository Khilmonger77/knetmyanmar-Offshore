import { customerFetch } from './authApi'
import { getApiBase } from './apiBase'
import type { SupportTicket, SupportTicketListRow } from '../types/supportTicket'

export async function fetchSupportTickets(): Promise<SupportTicketListRow[]> {
  const r = await customerFetch(`${getApiBase()}/api/support/tickets`)
  const data = (await r.json()) as {
    ok?: boolean
    items?: SupportTicketListRow[]
    error?: string
  }
  if (!r.ok || !data.ok || !data.items) {
    throw new Error(data.error ?? 'Could not load tickets.')
  }
  return data.items
}

export async function fetchSupportTicket(id: string): Promise<SupportTicket> {
  const enc = encodeURIComponent(id)
  const r = await customerFetch(`${getApiBase()}/api/support/tickets/${enc}`)
  const data = (await r.json()) as {
    ok?: boolean
    item?: SupportTicket
    error?: string
  }
  if (!r.ok || !data.ok || !data.item) {
    throw new Error(data.error ?? 'Could not load ticket.')
  }
  return data.item
}

export async function createSupportTicket(body: {
  subject: string
  body: string
  linkedAccountIds?: string[]
}): Promise<SupportTicket> {
  const r = await customerFetch(`${getApiBase()}/api/support/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await r.json()) as {
    ok?: boolean
    item?: SupportTicket
    error?: string
  }
  if (!r.ok || !data.ok || !data.item) {
    throw new Error(data.error ?? 'Could not create ticket.')
  }
  return data.item
}

export async function postSupportTicketMessage(
  ticketId: string,
  body: string,
): Promise<SupportTicket> {
  const enc = encodeURIComponent(ticketId)
  const r = await customerFetch(
    `${getApiBase()}/api/support/tickets/${enc}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    },
  )
  const data = (await r.json()) as {
    ok?: boolean
    item?: SupportTicket
    error?: string
  }
  if (!r.ok || !data.ok || !data.item) {
    throw new Error(data.error ?? 'Could not send message.')
  }
  return data.item
}
