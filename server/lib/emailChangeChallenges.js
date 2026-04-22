import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(__dirname, '..', 'data', 'email-change-challenges.json')

const CHALLENGE_TTL_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 5

function ensureDir() {
  const dir = path.dirname(DATA_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function sha256(s) {
  return crypto.createHash('sha256').update(String(s), 'utf8').digest('hex')
}

function readFile() {
  ensureDir()
  if (!fs.existsSync(DATA_PATH)) {
    const initial = { challenges: {} }
    fs.writeFileSync(DATA_PATH, JSON.stringify(initial, null, 2), 'utf8')
    return initial
  }
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8')
    const data = JSON.parse(raw)
    if (!data || typeof data.challenges !== 'object')
      return { challenges: {} }
    return data
  } catch {
    return { challenges: {} }
  }
}

function writeFile(data) {
  ensureDir()
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8')
}

function pruneExpired(data) {
  const now = Date.now()
  let changed = false
  for (const [id, ch] of Object.entries(data.challenges)) {
    if (!ch || typeof ch.expiresAt !== 'number' || ch.expiresAt < now) {
      delete data.challenges[id]
      changed = true
    }
  }
  return changed
}

function newId() {
  return `ech_${crypto.randomBytes(16).toString('hex')}`
}

function random6Digit() {
  const n = crypto.randomInt(0, 1_000_000)
  return String(n).padStart(6, '0')
}

/**
 * @param {string} userId
 * @param {string} newEmail normalized lower-case email
 * @returns {{ id: string, plainCode: string }}
 */
export function createEmailChangeChallenge(userId, newEmail) {
  const data = readFile()
  pruneExpired(data)
  for (const [id, ch] of Object.entries(data.challenges)) {
    if (ch && ch.userId === userId) {
      delete data.challenges[id]
    }
  }
  const id = newId()
  const plainCode = random6Digit()
  const codeHash = sha256(plainCode)
  data.challenges[id] = {
    userId,
    newEmail,
    codeHash,
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
    attempts: 0,
  }
  writeFile(data)
  return { id, plainCode }
}

/**
 * @param {string} challengeId
 */
export function deleteEmailChangeChallenge(challengeId) {
  const data = readFile()
  if (data.challenges[challengeId]) {
    delete data.challenges[challengeId]
    writeFile(data)
  }
}

/**
 * @param {string} challengeId
 * @param {string} codePlain
 * @returns {{ ok: true, userId: string, newEmail: string } | { ok: false, reason: 'not_found' | 'expired' | 'locked' | 'bad_code' }}
 */
export function consumeEmailChangeChallenge(challengeId, codePlain) {
  const id = String(challengeId || '').trim()
  const code = String(codePlain || '').trim().replace(/\s+/g, '')
  if (!id || !/^\d{6}$/.test(code)) {
    return { ok: false, reason: 'bad_code' }
  }

  const data = readFile()
  pruneExpired(data)
  const ch = data.challenges[id]
  if (!ch) {
    writeFile(data)
    return { ok: false, reason: 'not_found' }
  }
  if (ch.expiresAt < Date.now()) {
    delete data.challenges[id]
    writeFile(data)
    return { ok: false, reason: 'expired' }
  }
  if (ch.attempts >= MAX_ATTEMPTS) {
    delete data.challenges[id]
    writeFile(data)
    return { ok: false, reason: 'locked' }
  }

  const gotHash = sha256(code)
  const a = Buffer.from(gotHash, 'hex')
  const b = Buffer.from(String(ch.codeHash), 'hex')
  const match =
    a.length === b.length && crypto.timingSafeEqual(a, b)

  if (!match) {
    ch.attempts += 1
    if (ch.attempts >= MAX_ATTEMPTS) delete data.challenges[id]
    writeFile(data)
    return { ok: false, reason: 'bad_code' }
  }

  const userId = ch.userId
  const newEmail = String(ch.newEmail || '').trim().toLowerCase()
  delete data.challenges[id]
  writeFile(data)
  return { ok: true, userId, newEmail }
}
