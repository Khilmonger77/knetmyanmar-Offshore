import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getUserBankingSnapshot } from './usersStore.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(__dirname, '..', 'data', 'support-tickets.json')

/** @typedef {'open' | 'pending' | 'resolved'} SupportTicketStatus */
/** @typedef {'customer' | 'staff'} SupportMessageAuthor */

export const SUPPORT_STAFF_OPTIONS = [
  'Jordan M.',
  'Riley Chen',
  'Sam Ortiz',
  'Alex Rivera',
]

const STAFF_SET = new Set(SUPPORT_STAFF_OPTIONS)

const MAX_SUBJECT = 200
const MAX_BODY = 8000
const MAX_LINKED_ACCOUNTS = 8

function ensureDir() {
  const dir = path.dirname(DATA_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function readFile() {
  ensureDir()
  if (!fs.existsSync(DATA_PATH)) {
    const initial = { items: [] }
    fs.writeFileSync(DATA_PATH, JSON.stringify(initial, null, 2), 'utf8')
    return initial
  }
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8')
    const data = JSON.parse(raw)
    if (!data || !Array.isArray(data.items)) return { items: [] }
    return data
  } catch {
    return { items: [] }
  }
}

function writeFile(data) {
  ensureDir()
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8')
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * @param {string} userId
 * @param {string[]} ids
 * @returns {string | null} error
 */
function validateLinkedAccounts(userId, ids) {
  const snap = getUserBankingSnapshot(userId)
  if (!snap || !Array.isArray(snap.accounts)) {
    return ids.length ? 'No accounts on file to link.' : null
  }
  const allowed = new Set(snap.accounts.map((a) => a.id))
  for (const id of ids) {
    if (typeof id !== 'string' || !id.trim()) return 'Invalid account id.'
    if (!allowed.has(id.trim())) return `Unknown account: ${id.trim()}`
  }
  return null
}

/**
 * @param {string} body
 */
function normalizeBody(body) {
  const s = typeof body === 'string' ? body.trim() : ''
  if (!s) return { err: 'Message cannot be empty.', text: '' }
  if (s.length > MAX_BODY) return { err: `Message must be under ${MAX_BODY} characters.`, text: '' }
  return { err: null, text: s }
}

export function countOpenSupportTickets() {
  return readFile().items.filter(
    (t) => t.status === 'open' || t.status === 'pending',
  ).length
}

/**
 * @param {string} userId
 */
export function listSupportTicketsForUser(userId) {
  const uidNorm = String(userId || '').trim()
  if (!uidNorm) return []
  const rows = readFile().items.filter((t) => t.userId === uidNorm)
  rows.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
  return rows.map((t) => ({
    id: t.id,
    subject: t.subject,
    status: t.status,
    assignedTo: t.assignedTo,
    linkedAccountIds: t.linkedAccountIds,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    messageCount: t.messages.length,
    lastPreview:
      t.messages.length > 0
        ? String(t.messages[t.messages.length - 1].body || '').slice(0, 140)
        : '',
  }))
}

/**
 * @param {string} ticketId
 * @param {string} userId
 */
export function getSupportTicketForUser(ticketId, userId) {
  const t = getSupportTicket(ticketId)
  if (!t || t.userId !== String(userId || '').trim()) return null
  return t
}

/**
 * @param {string} id
 */
export function getSupportTicket(id) {
  const tid = String(id || '').trim()
  if (!tid) return null
  return readFile().items.find((x) => x.id === tid) ?? null
}

/**
 * @param {{ status?: string, assignedTo?: string, limit?: number }} [opts]
 */
export function listSupportTicketsAdmin(opts = {}) {
  let items = [...readFile().items]
  const st =
    typeof opts.status === 'string' ? opts.status.trim().toLowerCase() : ''
  if (st === 'open' || st === 'pending' || st === 'resolved') {
    items = items.filter((x) => x.status === st)
  }
  const assignFilter =
    typeof opts.assignedTo === 'string' ? opts.assignedTo.trim() : ''
  if (assignFilter === '__unassigned__') {
    items = items.filter((x) => !x.assignedTo)
  } else if (assignFilter) {
    items = items.filter((x) => x.assignedTo === assignFilter)
  }
  items.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
  const limit = Math.min(Math.max(Number(opts.limit) || 200, 1), 500)
  return items.slice(0, limit)
}

/**
 * @param {{
 *   userId: string
 *   customerEmail: string
 *   customerDisplayName: string
 *   subject: string
 *   body: string
 *   linkedAccountIds?: string[]
 * }} input
 */
export function createSupportTicket(input) {
  const userId = String(input.userId || '').trim()
  const customerEmail = String(input.customerEmail || '').trim().slice(0, 200)
  const customerDisplayName = String(input.customerDisplayName || '')
    .trim()
    .slice(0, 200)
  const subject = String(input.subject || '').trim().slice(0, MAX_SUBJECT)
  const { err, text } = normalizeBody(input.body)
  const linked = Array.isArray(input.linkedAccountIds)
    ? input.linkedAccountIds
        .filter((x) => typeof x === 'string' && x.trim())
        .map((x) => x.trim())
        .slice(0, MAX_LINKED_ACCOUNTS)
    : []
  if (!userId || !customerEmail) {
    const e = new Error('Missing customer identity.')
    e.statusCode = 400
    throw e
  }
  if (!subject) {
    const e = new Error('Subject is required.')
    e.statusCode = 400
    throw e
  }
  if (err) {
    const e = new Error(err)
    e.statusCode = 400
    throw e
  }
  const accErr = validateLinkedAccounts(userId, linked)
  if (accErr) {
    const e = new Error(accErr)
    e.statusCode = 400
    throw e
  }
  const now = new Date().toISOString()
  const msgId = uid('msg')
  const item = {
    id: uid('tkt'),
    userId,
    customerEmail,
    customerDisplayName,
    subject,
    status: /** @type {SupportTicketStatus} */ ('open'),
    assignedTo: null,
    linkedAccountIds: linked,
    messages: [
      {
        id: msgId,
        authorType: /** @type {SupportMessageAuthor} */ ('customer'),
        authorLabel: customerDisplayName || customerEmail,
        body: text,
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  }
  const data = readFile()
  data.items.unshift(item)
  writeFile(data)
  return item
}

/**
 * @param {string} ticketId
 * @param {string} userId
 * @param {{ body: string }} input
 */
export function appendCustomerSupportMessage(ticketId, userId, input) {
  const uidNorm = String(userId || '').trim()
  const t = getSupportTicketForUser(ticketId, uidNorm)
  if (!t) {
    const e = new Error('Ticket not found.')
    e.statusCode = 404
    throw e
  }
  const { err, text } = normalizeBody(input.body)
  if (err) {
    const e = new Error(err)
    e.statusCode = 400
    throw e
  }
  const now = new Date().toISOString()
  let status = t.status
  if (status === 'resolved') status = 'open'
  const next = {
    ...t,
    status,
    updatedAt: now,
    messages: [
      ...t.messages,
      {
        id: uid('msg'),
        authorType: /** @type {SupportMessageAuthor} */ ('customer'),
        authorLabel: t.customerDisplayName || t.customerEmail,
        body: text,
        createdAt: now,
      },
    ],
  }
  const data = readFile()
  const idx = data.items.findIndex((x) => x.id === t.id)
  if (idx === -1) {
    const e = new Error('Ticket not found.')
    e.statusCode = 404
    throw e
  }
  data.items[idx] = next
  writeFile(data)
  return next
}

/**
 * @param {string} ticketId
 * @param {{ body: string, staffLabel?: string }} input
 */
export function appendStaffSupportMessage(ticketId, input) {
  const t = getSupportTicket(ticketId)
  if (!t) {
    const e = new Error('Ticket not found.')
    e.statusCode = 404
    throw e
  }
  const { err, text } = normalizeBody(input.body)
  if (err) {
    const e = new Error(err)
    e.statusCode = 400
    throw e
  }
  const label = String(input.staffLabel || 'Support team')
    .trim()
    .slice(0, 120)
  const now = new Date().toISOString()
  const next = {
    ...t,
    updatedAt: now,
    messages: [
      ...t.messages,
      {
        id: uid('msg'),
        authorType: /** @type {SupportMessageAuthor} */ ('staff'),
        authorLabel: label || 'Support team',
        body: text,
        createdAt: now,
      },
    ],
  }
  const data = readFile()
  const idx = data.items.findIndex((x) => x.id === t.id)
  data.items[idx] = next
  writeFile(data)
  return next
}

/**
 * @param {string} ticketId
 * @param {Record<string, unknown>} body
 */
export function patchSupportTicketAdmin(ticketId, body) {
  const t = getSupportTicket(ticketId)
  if (!t) {
    const e = new Error('Ticket not found.')
    e.statusCode = 404
    throw e
  }
  const next = { ...t }
  if (body && typeof body === 'object') {
    if (typeof body.status === 'string') {
      const st = body.status.trim().toLowerCase()
      if (st !== 'open' && st !== 'pending' && st !== 'resolved') {
        const e = new Error('status must be open, pending, or resolved.')
        e.statusCode = 400
        throw e
      }
      next.status = st
    }
    if (body.assignedTo === null || body.assignedTo === '') {
      next.assignedTo = null
    } else if (typeof body.assignedTo === 'string') {
      const a = body.assignedTo.trim()
      if (!a) next.assignedTo = null
      else if (!STAFF_SET.has(a)) {
        const e = new Error(
          `assignedTo must be one of: ${SUPPORT_STAFF_OPTIONS.join(', ')}.`,
        )
        e.statusCode = 400
        throw e
      } else next.assignedTo = a
    }
    if (Array.isArray(body.linkedAccountIds)) {
      const ids = body.linkedAccountIds
        .filter((x) => typeof x === 'string' && x.trim())
        .map((x) => x.trim())
        .slice(0, MAX_LINKED_ACCOUNTS)
      const accErr = validateLinkedAccounts(t.userId, ids)
      if (accErr) {
        const e = new Error(accErr)
        e.statusCode = 400
        throw e
      }
      next.linkedAccountIds = ids
    }
  }
  next.updatedAt = new Date().toISOString()
  const data = readFile()
  const idx = data.items.findIndex((x) => x.id === t.id)
  data.items[idx] = next
  writeFile(data)
  return next
}
