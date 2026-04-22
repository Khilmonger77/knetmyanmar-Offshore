import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(__dirname, '..', 'data', 'approvals.json')

/** @typedef {'pending' | 'approved' | 'rejected'} ApprovalStatus */

const APPROVAL_TYPES = new Set([
  'internal_transfer',
  'bill_pay',
  'scheduled_bill',
  'send_to_person',
  'wire_transfer',
  'mobile_deposit',
  'card_funding_deposit',
  'crypto_deposit',
  'debit_card_lock',
  'debit_card_travel_notice',
  'debit_card_contactless',
  'debit_card_replacement',
  'cancel_scheduled_bill',
  'loan_application',
  'fdr_open',
  'dps_open',
  'currency_exchange',
])

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

/**
 * @param {string} type
 * @param {unknown} payload
 * @returns {string | null} error message
 */
function validatePayload(type, payload) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return 'Payload must be a JSON object.'
  }
  const p = /** @type {Record<string, unknown>} */ (payload)
  switch (type) {
    case 'internal_transfer':
      if (typeof p.fromId !== 'string' || !p.fromId) return 'internal_transfer: fromId required'
      if (typeof p.toId !== 'string' || !p.toId) return 'internal_transfer: toId required'
      if (typeof p.amountCents !== 'number' || p.amountCents <= 0)
        return 'internal_transfer: amountCents invalid'
      return null
    case 'bill_pay':
      if (typeof p.fromId !== 'string' || !p.fromId) return 'bill_pay: fromId required'
      if (typeof p.payeeName !== 'string' || !p.payeeName.trim()) return 'bill_pay: payeeName required'
      if (typeof p.amountCents !== 'number' || p.amountCents <= 0)
        return 'bill_pay: amountCents invalid'
      return null
    case 'scheduled_bill':
      if (typeof p.fromId !== 'string' || !p.fromId) return 'scheduled_bill: fromId required'
      if (typeof p.payeeName !== 'string' || !p.payeeName.trim())
        return 'scheduled_bill: payeeName required'
      if (typeof p.amountCents !== 'number' || p.amountCents <= 0)
        return 'scheduled_bill: amountCents invalid'
      if (typeof p.deliverBy !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(p.deliverBy))
        return 'scheduled_bill: deliverBy invalid'
      return null
    case 'send_to_person':
      if (typeof p.fromId !== 'string' || !p.fromId) return 'send_to_person: fromId required'
      if (typeof p.recipientLabel !== 'string' || !p.recipientLabel.trim())
        return 'send_to_person: recipientLabel required'
      if (typeof p.amountCents !== 'number' || p.amountCents <= 0)
        return 'send_to_person: amountCents invalid'
      return null
    case 'wire_transfer':
      if (typeof p.fromId !== 'string' || !p.fromId) return 'wire_transfer: fromId required'
      if (typeof p.amountCents !== 'number' || p.amountCents <= 0)
        return 'wire_transfer: amountCents invalid'
      if (p.scope !== 'domestic' && p.scope !== 'international')
        return 'wire_transfer: scope invalid'
      if (typeof p.beneficiaryName !== 'string' || !p.beneficiaryName.trim())
        return 'wire_transfer: beneficiaryName required'
      if (typeof p.receivingBank !== 'string' || !p.receivingBank.trim())
        return 'wire_transfer: receivingBank required'
      return null
    case 'mobile_deposit':
      if (typeof p.toId !== 'string' || !p.toId) return 'mobile_deposit: toId required'
      if (typeof p.amountCents !== 'number' || p.amountCents <= 0)
        return 'mobile_deposit: amountCents invalid'
      return null
    case 'card_funding_deposit':
      if (typeof p.toId !== 'string' || !p.toId)
        return 'card_funding_deposit: toId required'
      if (typeof p.amountCents !== 'number' || p.amountCents <= 0)
        return 'card_funding_deposit: amountCents invalid'
      return null
    case 'crypto_deposit':
      if (typeof p.toId !== 'string' || !p.toId)
        return 'crypto_deposit: toId required'
      if (typeof p.amountCents !== 'number' || p.amountCents <= 0)
        return 'crypto_deposit: amountCents invalid'
      return null
    case 'debit_card_lock':
      if (typeof p.locked !== 'boolean') return 'debit_card_lock: locked boolean required'
      return null
    case 'debit_card_travel_notice':
      if (typeof p.enabled !== 'boolean')
        return 'debit_card_travel_notice: enabled boolean required'
      return null
    case 'debit_card_contactless':
      if (typeof p.enabled !== 'boolean')
        return 'debit_card_contactless: enabled boolean required'
      return null
    case 'debit_card_replacement':
      return null
    case 'cancel_scheduled_bill':
      if (typeof p.scheduledPaymentId !== 'string' || !p.scheduledPaymentId)
        return 'cancel_scheduled_bill: scheduledPaymentId required'
      return null
    case 'loan_application':
      if (typeof p.amountCents !== 'number' || p.amountCents <= 0)
        return 'loan_application: amountCents invalid'
      return null
    case 'fdr_open': {
      if (typeof p.fromId !== 'string' || !p.fromId) return 'fdr_open: fromId required'
      if (typeof p.amountCents !== 'number' || p.amountCents <= 0)
        return 'fdr_open: amountCents invalid'
      const tm = Math.round(Number(p.termMonths) || 0)
      if (tm < 1 || tm > 600) return 'fdr_open: termMonths invalid'
      return null
    }
    case 'dps_open':
      if (
        typeof p.monthlyContributionCents !== 'number' ||
        p.monthlyContributionCents <= 0
      )
        return 'dps_open: monthlyContributionCents invalid'
      return null
    case 'currency_exchange':
      if (typeof p.fromId !== 'string' || !p.fromId)
        return 'currency_exchange: fromId required'
      if (typeof p.sellAmountCents !== 'number' || p.sellAmountCents <= 0)
        return 'currency_exchange: sellAmountCents invalid'
      if (typeof p.buyAmountCents !== 'number' || p.buyAmountCents <= 0)
        return 'currency_exchange: buyAmountCents invalid'
      return null
    default:
      return 'Unknown type.'
  }
}

function newId() {
  return `apr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * @param {{ userId: string, submitterId: string, type: string, title: string, payload: unknown }} input
 */
export function createApproval(input) {
  const userId =
    typeof input.userId === 'string' ? input.userId.trim().slice(0, 120) : ''
  if (!userId) {
    const err = new Error('userId is required.')
    err.statusCode = 400
    throw err
  }
  const submitterId =
    typeof input.submitterId === 'string' ? input.submitterId.trim().slice(0, 200) : ''
  if (!submitterId) {
    const err = new Error('submitterId is required.')
    err.statusCode = 400
    throw err
  }
  const type = typeof input.type === 'string' ? input.type.trim() : ''
  if (!APPROVAL_TYPES.has(type)) {
    const err = new Error(`Unsupported approval type: ${type || '(empty)'}`)
    err.statusCode = 400
    throw err
  }
  const title =
    typeof input.title === 'string' ? input.title.trim().slice(0, 500) : ''
  if (!title) {
    const err = new Error('title is required.')
    err.statusCode = 400
    throw err
  }
  const payloadErr = validatePayload(type, input.payload)
  if (payloadErr) {
    const err = new Error(payloadErr)
    err.statusCode = 400
    throw err
  }

  const data = readFile()
  const item = {
    id: newId(),
    status: /** @type {ApprovalStatus} */ ('pending'),
    type,
    userId,
    submitterId,
    title,
    payload: input.payload,
    createdAt: new Date().toISOString(),
    decidedAt: null,
    decisionNote: null,
    appliedAt: null,
  }
  data.items.unshift(item)
  writeFile(data)
  return item
}

/**
 * @param {string} submitterId
 * @param {{ limit?: number }} [opts]
 */
export function listBySubmitter(submitterId, opts = {}) {
  const id = submitterId.trim().slice(0, 200)
  if (!id) return []
  const limit = Math.min(Math.max(Number(opts.limit) || 80, 1), 200)
  const data = readFile()
  return data.items.filter((x) => x.submitterId === id).slice(0, limit)
}

/**
 * @param {string} userId
 * @param {{ limit?: number }} [opts]
 */
export function listByUserId(userId, opts = {}) {
  const id = userId.trim().slice(0, 120)
  if (!id) return []
  const limit = Math.min(Math.max(Number(opts.limit) || 100, 1), 200)
  const data = readFile()
  return data.items.filter((x) => x.userId === id).slice(0, limit)
}

/**
 * @param {string} id
 */
export function getApprovalById(id) {
  const data = readFile()
  return data.items.find((x) => x.id === id) ?? null
}

/**
 * After banking mutation succeeds: mark approved + applied server-side.
 * @param {string} id
 * @param {string} [note]
 */
export function finalizeApprovalApproved(id, note) {
  const data = readFile()
  const idx = data.items.findIndex((x) => x.id === id)
  if (idx === -1) {
    const err = new Error('Approval request not found.')
    err.statusCode = 404
    throw err
  }
  const item = data.items[idx]
  if (item.status !== 'pending') {
    const err = new Error('Only pending requests can be finalized.')
    err.statusCode = 409
    throw err
  }
  const n =
    typeof note === 'string' ? note.trim().slice(0, 2_000) : ''
  item.status = 'approved'
  item.decidedAt = new Date().toISOString()
  item.decisionNote = n || null
  item.appliedAt = new Date().toISOString()
  writeFile(data)
  return item
}

/**
 * @param {{ status?: string, limit?: number }} [opts]
 */
/**
 * @returns {{ pending: number, approved: number, rejected: number, total: number }}
 */
export function countApprovalsByStatus() {
  const data = readFile()
  const c = { pending: 0, approved: 0, rejected: 0 }
  for (const x of data.items) {
    if (x.status === 'pending') c.pending++
    else if (x.status === 'approved') c.approved++
    else if (x.status === 'rejected') c.rejected++
  }
  return { ...c, total: data.items.length }
}

export function listAll(opts = {}) {
  const limit = Math.min(Math.max(Number(opts.limit) || 200, 1), 1000)
  const status =
    typeof opts.status === 'string' ? opts.status.trim().toLowerCase() : ''
  const data = readFile()
  let items = [...data.items]
  if (status === 'pending' || status === 'approved' || status === 'rejected') {
    items = items.filter((x) => x.status === status)
  }
  items.sort((a, b) => {
    const ta = new Date(a.createdAt).getTime()
    const tb = new Date(b.createdAt).getTime()
    return tb - ta
  })
  return items.slice(0, limit)
}

/**
 * @param {string} id
 * @param {{ status: 'approved' | 'rejected', note?: string }} body
 */
export function updateApprovalStatus(id, body) {
  const data = readFile()
  const idx = data.items.findIndex((x) => x.id === id)
  if (idx === -1) {
    const err = new Error('Approval request not found.')
    err.statusCode = 404
    throw err
  }
  const item = data.items[idx]
  if (item.status !== 'pending') {
    const err = new Error('Only pending requests can be approved or rejected.')
    err.statusCode = 409
    throw err
  }
  const next = body.status
  if (next !== 'approved' && next !== 'rejected') {
    const err = new Error('status must be approved or rejected.')
    err.statusCode = 400
    throw err
  }
  const note =
    typeof body.note === 'string' ? body.note.trim().slice(0, 2_000) : ''
  item.status = next
  item.decidedAt = new Date().toISOString()
  item.decisionNote = note || null
  if (next === 'rejected') {
    item.withdrawalCoApprovals = 0
  }
  writeFile(data)
  return item
}

/**
 * First operator approval for high-value withdrawals (stays pending).
 * @param {string} id
 */
export function recordWithdrawalFirstOperatorApproval(id) {
  const data = readFile()
  const item = data.items.find((x) => x.id === id)
  if (!item) {
    const err = new Error('Approval request not found.')
    err.statusCode = 404
    throw err
  }
  if (item.status !== 'pending') {
    const err = new Error('Only pending requests can receive co-approval.')
    err.statusCode = 409
    throw err
  }
  item.withdrawalCoApprovals = Number(item.withdrawalCoApprovals || 0) + 1
  writeFile(data)
  return item
}

/**
 * @param {string} id
 * @param {{ suspicious: boolean, suspiciousNote?: string }} body
 */
export function patchApprovalSuspicious(id, body) {
  const data = readFile()
  const item = data.items.find((x) => x.id === id)
  if (!item) {
    const err = new Error('Approval request not found.')
    err.statusCode = 404
    throw err
  }
  if (item.status !== 'pending') {
    const err = new Error('Suspicious flags can only be edited while pending.')
    err.statusCode = 409
    throw err
  }
  item.suspicious = Boolean(body.suspicious)
  const raw =
    typeof body.suspiciousNote === 'string' ? body.suspiciousNote.trim() : ''
  item.suspiciousNote =
    item.suspicious && raw
      ? raw.slice(0, 500)
      : item.suspicious
        ? 'Flagged for review'
        : null
  writeFile(data)
  return item
}

/**
 * @param {string} id
 * @param {string} submitterId
 */
/**
 * Marks an approved, applied approval as reversed in the ledger (operator undo).
 * @param {string} id
 */
export function markApprovalReversed(id) {
  const data = readFile()
  const item = data.items.find((x) => x.id === id)
  if (!item) {
    const err = new Error('Approval request not found.')
    err.statusCode = 404
    throw err
  }
  if (item.status !== 'approved') {
    const err = new Error('Only approved requests can be reversed.')
    err.statusCode = 409
    throw err
  }
  if (!item.appliedAt) {
    const err = new Error('Nothing was applied for this request.')
    err.statusCode = 409
    throw err
  }
  if (item.reversedAt) {
    const err = new Error('This transaction was already reversed.')
    err.statusCode = 409
    throw err
  }
  item.reversedAt = new Date().toISOString()
  writeFile(data)
  return item
}

export function markApprovalApplied(id, submitterId) {
  const sid = submitterId.trim().slice(0, 200)
  if (!sid) {
    const err = new Error('submitterId is required.')
    err.statusCode = 400
    throw err
  }
  const data = readFile()
  const item = data.items.find((x) => x.id === id)
  if (!item) {
    const err = new Error('Approval request not found.')
    err.statusCode = 404
    throw err
  }
  if (item.submitterId !== sid) {
    const err = new Error('Not allowed.')
    err.statusCode = 403
    throw err
  }
  if (item.status !== 'approved') {
    const err = new Error('Only approved requests can be marked applied.')
    err.statusCode = 409
    throw err
  }
  if (item.appliedAt) {
    return item
  }
  item.appliedAt = new Date().toISOString()
  writeFile(data)
  return item
}
