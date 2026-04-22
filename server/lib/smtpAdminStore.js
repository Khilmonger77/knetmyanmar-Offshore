import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { smtpFromEnv } from './smtp.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(__dirname, '..', 'data', 'smtp-settings.json')

/**
 * @returns {{ name: string, email: string }}
 */
export function parseMailFrom(str) {
  const s = String(str || '').trim()
  if (!s) return { name: '', email: '' }
  const angle = s.match(/<\s*([^>\s]+@[^>\s]+)\s*>/)
  if (angle) {
    const email = angle[1].trim()
    let namePart = s.slice(0, s.indexOf('<')).trim()
    if (
      (namePart.startsWith('"') && namePart.endsWith('"')) ||
      (namePart.startsWith("'") && namePart.endsWith("'"))
    ) {
      namePart = namePart.slice(1, -1).replace(/\\"/g, '"')
    }
    return { name: namePart.trim(), email }
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
    return { name: '', email: s }
  }
  return { name: '', email: s }
}

/**
 * @param {string} name
 * @param {string} email
 */
export function formatMailFrom(name, email) {
  const e = String(email || '').trim()
  if (!e) return ''
  const n = String(name || '').trim()
  if (!n) return e
  const escaped = n.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `"${escaped}" <${e}>`
}

/**
 * Applies operator-saved SMTP settings onto `process.env` so `smtpFromEnv()` picks them up.
 * Called after loading `server/.env` and whenever settings are saved from the admin console.
 */
export function applyPersistedSmtpToProcess() {
  if (!fs.existsSync(DATA_PATH)) return
  let data
  try {
    data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
  } catch (e) {
    console.warn('[smtp-admin] could not read smtp-settings.json:', e.message)
    return
  }
  if (!data || typeof data !== 'object') return

  if (typeof data.host === 'string') process.env.MAIL_SMTP_HOST = data.host.trim()
  if (data.port != null) {
    const n = Number(data.port)
    if (Number.isFinite(n) && n >= 1 && n < 65536) {
      process.env.MAIL_SMTP_PORT = String(Math.floor(n))
    }
  }
  if (typeof data.secure === 'boolean') {
    process.env.MAIL_SMTP_SECURE = data.secure ? 'true' : 'false'
  }

  if (typeof data.user === 'string') process.env.MAIL_SMTP_USER = data.user.trim()

  if (Object.prototype.hasOwnProperty.call(data, 'pass')) {
    process.env.MAIL_SMTP_PASS =
      typeof data.pass === 'string' ? data.pass : ''
  }

  let fromEmail =
    typeof data.fromEmail === 'string' ? data.fromEmail.trim() : ''
  let fromName =
    typeof data.fromName === 'string' ? data.fromName.trim() : ''
  const legacyFrom =
    typeof data.from === 'string' ? data.from.trim() : ''
  if (!fromEmail && legacyFrom) {
    const p = parseMailFrom(legacyFrom)
    fromEmail = p.email
    if (!fromName) fromName = p.name
  }
  const mailFrom = formatMailFrom(fromName, fromEmail)
  if (mailFrom) {
    process.env.MAIL_FROM = mailFrom
  }
}

function readPersistedRaw() {
  if (!fs.existsSync(DATA_PATH)) return null
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
  } catch {
    return null
  }
}

/** Safe fields for GET /api/admin/smtp-settings (never returns password). */
export function getSmtpSettingsForAdmin() {
  const cfg = smtpFromEnv()
  const passwordSet = typeof cfg.pass === 'string' && cfg.pass.length > 0
  const { name, email } = parseMailFrom(cfg.from || '')
  return {
    host: cfg.host || '',
    port: cfg.port || 587,
    secure: !!cfg.secure,
    user: cfg.user || '',
    fromName: name,
    fromEmail: email,
    passwordSet,
  }
}

/**
 * @param {unknown} body
 */
export function saveSmtpSettings(body) {
  const o = body && typeof body === 'object' ? body : {}

  const host = typeof o.host === 'string' ? o.host.trim() : ''
  const portRaw = o.port
  const port =
    portRaw === undefined || portRaw === null || portRaw === ''
      ? 587
      : Number(portRaw)
  const secure = Boolean(o.secure)
  const user = typeof o.user === 'string' ? o.user.trim() : ''

  let fromEmail =
    typeof o.fromEmail === 'string' ? o.fromEmail.trim() : ''
  let fromName =
    typeof o.fromName === 'string' ? o.fromName.trim() : ''
  if (!fromEmail && typeof o.from === 'string' && o.from.trim()) {
    const p = parseMailFrom(o.from.trim())
    fromEmail = p.email
    if (!fromName) fromName = p.name
  }

  if (!Number.isFinite(port) || port < 1 || port >= 65536) {
    const err = new Error('SMTP port must be between 1 and 65535.')
    err.statusCode = 400
    throw err
  }

  const existing = readPersistedRaw()
  let pass = ''
  if (existing && typeof existing.pass === 'string') {
    pass = existing.pass
  } else if (typeof process.env.MAIL_SMTP_PASS === 'string') {
    pass = process.env.MAIL_SMTP_PASS
  }

  if (Object.prototype.hasOwnProperty.call(o, 'pass')) {
    if (typeof o.pass !== 'string') {
      const err = new Error('Invalid SMTP password field.')
      err.statusCode = 400
      throw err
    }
    pass = o.pass
  }

  if (!fromEmail) {
    const err = new Error('From email address is required.')
    err.statusCode = 400
    throw err
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
    const err = new Error('From email must look like a valid address.')
    err.statusCode = 400
    throw err
  }

  const fromHeader = formatMailFrom(fromName, fromEmail)

  const next = {
    host,
    port: Math.floor(port),
    secure,
    user,
    pass,
    fromName,
    fromEmail,
    from: fromHeader,
  }

  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true })
  fs.writeFileSync(DATA_PATH, JSON.stringify(next, null, 2), 'utf8')

  applyPersistedSmtpToProcess()

  return getSmtpSettingsForAdmin()
}
