import { listAll } from './approvalsStore.js'
import { listOperatorLedgerDigestRows } from './usersStore.js'

function parseRangeStart(s) {
  if (!s || typeof s !== 'string') return NaN
  const t = s.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return Date.parse(`${t}T00:00:00.000`)
  return Date.parse(t)
}

function parseRangeEnd(s) {
  if (!s || typeof s !== 'string') return NaN
  const t = s.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return Date.parse(`${t}T23:59:59.999`)
  return Date.parse(t)
}

/**
 * @param {string} type
 * @returns {'deposit' | 'withdrawal' | 'transfer' | 'other'}
 */
export function isWithdrawalApprovalType(type) {
  return engineKindFromApprovalType(type) === 'withdrawal'
}

export function engineKindFromApprovalType(type) {
  switch (type) {
    case 'operator_deposit':
      return 'deposit'
    case 'operator_withdrawal':
      return 'withdrawal'
    case 'mobile_deposit':
    case 'card_funding_deposit':
    case 'crypto_deposit':
      return 'deposit'
    case 'bill_pay':
    case 'wire_transfer':
    case 'send_to_person':
    case 'scheduled_bill':
      return 'withdrawal'
    case 'internal_transfer':
    case 'currency_exchange':
      return 'transfer'
    default:
      return 'other'
  }
}

/**
 * Primary monetary amount for filters (USD cents), when applicable.
 * @param {{ type: string, payload: unknown }} item
 * @returns {number | null}
 */
export function amountCentsFromApproval(item) {
  const p =
    item.payload &&
    typeof item.payload === 'object' &&
    !Array.isArray(item.payload)
      ? /** @type {Record<string, unknown>} */ (item.payload)
      : {}
  switch (item.type) {
    case 'internal_transfer':
    case 'bill_pay':
    case 'send_to_person':
    case 'wire_transfer':
    case 'mobile_deposit':
    case 'card_funding_deposit':
    case 'crypto_deposit':
    case 'loan_application':
    case 'fdr_open': {
      const n = Number(p.amountCents)
      return Number.isFinite(n) && n > 0 ? n : null
    }
    case 'scheduled_bill': {
      const n = Number(p.amountCents)
      return Number.isFinite(n) && n > 0 ? n : null
    }
    case 'currency_exchange': {
      const n = Number(p.sellAmountCents)
      return Number.isFinite(n) && n > 0 ? n : null
    }
    case 'dps_open': {
      const n = Number(p.monthlyContributionCents)
      return Number.isFinite(n) && n > 0 ? n : null
    }
    default:
      return null
  }
}

/**
 * Stable sort key for feed ordering (newest first). Falls back to `apr-<ms>-…` id prefix.
 * @param {Record<string, unknown>} item
 */
function digestCreatedMs(item) {
  const raw =
    typeof item.createdAt === 'string' && item.createdAt.trim()
      ? Date.parse(item.createdAt.trim())
      : NaN
  if (!Number.isNaN(raw)) return raw
  const id = typeof item.id === 'string' ? item.id : ''
  const m = /^apr-(\d+)-/.exec(id)
  if (m) {
    const n = Number(m[1])
    if (Number.isFinite(n)) return n
  }
  return 0
}

/** @param {Record<string, unknown>} item */
function digestItem(item) {
  const engineKind = engineKindFromApprovalType(item.type)
  const amountCents = amountCentsFromApproval(item)
  const created = Date.parse(
    typeof item.createdAt === 'string' && item.createdAt.trim()
      ? item.createdAt.trim()
      : '',
  )
  const decided = item.decidedAt ? Date.parse(item.decidedAt) : NaN
  const applied = item.appliedAt ? Date.parse(item.appliedAt) : NaN
  const effectiveAt =
    !Number.isNaN(applied) ? item.appliedAt
    : !Number.isNaN(decided) ? item.decidedAt
    : item.createdAt
  return {
    id: item.id,
    status: item.status,
    type: item.type,
    engineKind,
    amountCents,
    userId: item.userId ?? null,
    submitterId: item.submitterId,
    title: item.title,
    createdAt: item.createdAt,
    decidedAt: item.decidedAt,
    appliedAt: item.appliedAt,
    reversedAt: item.reversedAt ?? null,
    decisionNote: item.decisionNote,
    effectiveAt,
    createdMs: digestCreatedMs(item),
    suspicious: Boolean(item.suspicious),
    suspiciousNote:
      typeof item.suspiciousNote === 'string' ? item.suspiciousNote : null,
    withdrawalCoApprovals: Number(item.withdrawalCoApprovals || 0),
  }
}

/**
 * @param {{
 *   status?: string
 *   engineKind?: string
 *   userId?: string
 *   from?: string
 *   to?: string
 *   minAmount?: number
 *   maxAmount?: number
 *   limit?: number
 * }} query
 */
export function listAdminTransactionFeed(query = {}) {
  const limit = Math.min(Math.max(Number(query.limit) || 500, 1), 1000)
  const status =
    typeof query.status === 'string' ? query.status.trim().toLowerCase() : ''

  const listOpts = { limit: 1000 }
  if (status === 'pending' || status === 'approved' || status === 'rejected') {
    listOpts.status = status
  }
  const raw = listAll(listOpts)

  let rows = raw.map(digestItem)

  if (status === 'live') {
    rows = rows.filter((r) => r.status === 'pending')
  } else if (status === 'history') {
    rows = rows.filter(
      (r) =>
        r.status === 'pending' ||
        r.status === 'approved' ||
        r.status === 'rejected',
    )
  }

  if (status === 'history' || status === 'all' || status === '') {
    rows = [...rows, ...listOperatorLedgerDigestRows()]
  }

  /**
   * Live queue is the triage inbox: show every open item. Date / amount /
   * engine chips are easy to leave set from a prior search and then hide large
   * wires or transfers with no UI cue.
   */
  const triageLiveQueue = status === 'live'

  const ek =
    typeof query.engineKind === 'string'
      ? query.engineKind.trim().toLowerCase()
      : ''
  if (
    !triageLiveQueue &&
    (ek === 'deposit' || ek === 'withdrawal' || ek === 'transfer' || ek === 'other')
  ) {
    rows = rows.filter((r) => {
      if (r.engineKind === ek) return true
      /** Wires are modeled as withdrawal for policy; include them when operators pick "Transfer". */
      if (ek === 'transfer' && r.type === 'wire_transfer') return true
      return false
    })
  }

  const uid =
    typeof query.userId === 'string' ? query.userId.trim().toLowerCase() : ''
  if (uid) {
    rows = rows.filter(
      (r) =>
        (r.userId && r.userId.toLowerCase().includes(uid)) ||
        r.submitterId.toLowerCase().includes(uid),
    )
  }

  const fromMs = parseRangeStart(query.from)
  const toMs = parseRangeEnd(query.to)
  if (!triageLiveQueue && !Number.isNaN(fromMs)) {
    rows = rows.filter((r) => r.createdMs >= fromMs)
  }
  if (!triageLiveQueue && !Number.isNaN(toMs)) {
    rows = rows.filter((r) => r.createdMs <= toMs)
  }

  const minA = query.minAmount != null ? Number(query.minAmount) : NaN
  const maxA = query.maxAmount != null ? Number(query.maxAmount) : NaN
  if (!triageLiveQueue && !Number.isNaN(minA)) {
    rows = rows.filter(
      (r) => r.amountCents != null && r.amountCents >= minA,
    )
  }
  if (!triageLiveQueue && !Number.isNaN(maxA)) {
    rows = rows.filter(
      (r) => r.amountCents != null && r.amountCents <= maxA,
    )
  }

  rows.sort((a, b) => b.createdMs - a.createdMs)
  return rows.slice(0, limit)
}
