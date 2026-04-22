import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const JSONL_PATH = path.join(__dirname, '..', 'data', 'audit.log')

/** @type {import('pg').Pool | null} */
let pgPool = null

/**
 * @param {import('pg').Pool | null} pool
 */
export function setAuditPgPool(pool) {
  pgPool = pool
}

function ensureDir() {
  const dir = path.dirname(JSONL_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

/**
 * @param {object} entry
 * @param {string} entry.action
 * @param {'customer' | 'admin' | 'system' | 'anonymous'} entry.actorType
 * @param {string} [entry.actorId]
 * @param {string} [entry.target]
 * @param {string} [entry.ip]
 * @param {Record<string, unknown>} [entry.meta]
 */
export function writeAudit(entry) {
  const row = {
    ts: new Date().toISOString(),
    action: entry.action,
    actorType: entry.actorType,
    actorId: entry.actorId ?? null,
    target: entry.target ?? null,
    ip: entry.ip ?? null,
    meta: entry.meta && typeof entry.meta === 'object' ? entry.meta : null,
  }
  try {
    ensureDir()
    fs.appendFileSync(JSONL_PATH, `${JSON.stringify(row)}\n`, 'utf8')
  } catch (e) {
    console.error('[audit] append failed:', e)
  }
  if (pgPool) {
    pgPool
      .query(
        `INSERT INTO bw_audit_events (ts, action, actor_type, actor_id, target, ip, meta)
         VALUES (NOW(), $1, $2, $3, $4, $5, $6::jsonb)`,
        [
          row.action,
          row.actorType,
          row.actorId,
          row.target,
          row.ip || null,
          row.meta ? JSON.stringify(row.meta) : null,
        ],
      )
      .catch((err) => console.error('[audit] pg insert failed:', err.message))
  }
}

/**
 * Newest-first audit rows from JSONL (tail of file; capped read for large logs).
 * @param {{ limit?: number }} [opts]
 * @returns {Array<{ ts: string, action: string, actorType: string, actorId: string | null, target: string | null, ip: string | null, meta: unknown }>}
 */
export function readRecentAuditEvents(opts = {}) {
  const limit = Math.min(Math.max(Number(opts.limit) || 100, 1), 500)
  try {
    if (!fs.existsSync(JSONL_PATH)) return []
    const stat = fs.statSync(JSONL_PATH)
    if (stat.size === 0) return []
    const maxBytes = 8 * 1024 * 1024
    let raw
    if (stat.size <= maxBytes) {
      raw = fs.readFileSync(JSONL_PATH, 'utf8')
    } else {
      const fd = fs.openSync(JSONL_PATH, 'r')
      const buf = Buffer.alloc(maxBytes)
      fs.readSync(fd, buf, 0, maxBytes, stat.size - maxBytes)
      fs.closeSync(fd)
      const s = buf.toString('utf8')
      const firstNl = s.indexOf('\n')
      raw = firstNl === -1 ? s : s.slice(firstNl + 1)
    }
    const lines = raw.trimEnd().split(/\n/).filter(Boolean)
    const tail = lines.slice(-limit)
    const out = []
    for (let i = tail.length - 1; i >= 0; i--) {
      try {
        out.push(JSON.parse(tail[i]))
      } catch {
        /* skip malformed line */
      }
    }
    return out
  } catch (e) {
    console.error('[audit] read recent failed:', e)
    return []
  }
}

export function clientIp(req) {
  const xf = req.headers['x-forwarded-for']
  if (typeof xf === 'string' && xf.trim()) {
    return xf.split(',')[0].trim().slice(0, 64)
  }
  if (typeof xf === 'object' && xf?.[0]) {
    return String(xf[0]).trim().slice(0, 64)
  }
  const addr = req.socket?.remoteAddress
  return typeof addr === 'string' ? addr.slice(0, 64) : null
}
