import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(__dirname, '..', 'data', 'otp-policy.json')

/**
 * @param {string} name
 */
function envBool(name) {
  return /^(1|true|yes)$/i.test(String(process.env[name] || '').trim())
}

/**
 * Values taken from server/.env only (live process.env).
 */
export function getOtpPolicyEnvDefaults() {
  return {
    skipLoginEmailOtp: envBool('SKIP_LOGIN_EMAIL_OTP'),
    requireLoginEmailOtp: envBool('REQUIRE_LOGIN_EMAIL_OTP'),
    skipWireEmailOtp: envBool('SKIP_WIRE_EMAIL_OTP'),
  }
}

/**
 * @returns {{
 *   skipLoginEmailOtp: boolean,
 *   requireLoginEmailOtp: boolean,
 *   skipWireEmailOtp: boolean,
 * } | null}
 */
function readPersistedFile() {
  if (!fs.existsSync(DATA_PATH)) return null
  let raw
  try {
    raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
  } catch (e) {
    console.warn('[otp-policy] could not read otp-policy.json:', e.message)
    return null
  }
  if (!raw || typeof raw !== 'object') return null
  const skipLoginEmailOtp = raw.skipLoginEmailOtp
  const requireLoginEmailOtp = raw.requireLoginEmailOtp
  const skipWireEmailOtp = raw.skipWireEmailOtp
  if (
    typeof skipLoginEmailOtp !== 'boolean' ||
    typeof requireLoginEmailOtp !== 'boolean' ||
    typeof skipWireEmailOtp !== 'boolean'
  ) {
    console.warn('[otp-policy] otp-policy.json ignored (invalid shape).')
    return null
  }
  return { skipLoginEmailOtp, requireLoginEmailOtp, skipWireEmailOtp }
}

function persistedFileExists() {
  return fs.existsSync(DATA_PATH)
}

/**
 * Effective policy for auth checks — persisted file overrides env when valid.
 */
export function getOtpPolicyEffective() {
  const env = getOtpPolicyEnvDefaults()
  const persisted = readPersistedFile()
  return persisted ?? env
}

export function hasPersistedOtpPolicyFile() {
  return persistedFileExists()
}

export function getSkipLoginEmailOtp() {
  return getOtpPolicyEffective().skipLoginEmailOtp
}

export function getRequireLoginEmailOtp() {
  return getOtpPolicyEffective().requireLoginEmailOtp
}

export function getSkipWireEmailOtp() {
  return getOtpPolicyEffective().skipWireEmailOtp
}

/**
 * Full snapshot for admin API (env vs file).
 */
export function getOtpPolicySnapshot() {
  const envDefaults = getOtpPolicyEnvDefaults()
  const persisted = readPersistedFile()
  const effective = persisted ?? envDefaults
  const fileExists = persistedFileExists()
  return {
    effective,
    envDefaults,
    persisted,
    persistedFile: Boolean(persisted && fileExists),
    /** True when otp-policy.json exists but could not be parsed or validated. */
    persistedFileInvalid: Boolean(fileExists && !persisted),
  }
}

/**
 * @param {{
 *   skipLoginEmailOtp: boolean,
 *   requireLoginEmailOtp: boolean,
 *   skipWireEmailOtp: boolean,
 * }} body
 */
export function saveOtpPolicy(body) {
  const skipLoginEmailOtp = Boolean(body?.skipLoginEmailOtp)
  const requireLoginEmailOtp = Boolean(body?.requireLoginEmailOtp)
  const skipWireEmailOtp = Boolean(body?.skipWireEmailOtp)

  const dir = path.dirname(DATA_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const payload = {
    skipLoginEmailOtp,
    requireLoginEmailOtp,
    skipWireEmailOtp,
    updatedAt: new Date().toISOString(),
  }
  fs.writeFileSync(DATA_PATH, JSON.stringify(payload, null, 2), 'utf8')
  return getOtpPolicySnapshot()
}

export function clearPersistedOtpPolicy() {
  try {
    if (fs.existsSync(DATA_PATH)) fs.unlinkSync(DATA_PATH)
  } catch (e) {
    console.warn('[otp-policy] could not delete otp-policy.json:', e.message)
  }
  return getOtpPolicySnapshot()
}

export function logOtpPolicyAtStartup() {
  const { effective, envDefaults, persistedFile, persistedFileInvalid } =
    getOtpPolicySnapshot()
  const src = persistedFile ? 'otp-policy.json' : 'server/.env'

  if (persistedFileInvalid) {
    console.warn(
      '[auth] server/data/otp-policy.json exists but is invalid — using server/.env until the file is fixed or removed.',
    )
  }

  if (effective.skipLoginEmailOtp) {
    console.warn(
      `[auth] (${src}) SKIP_LOGIN_EMAIL_OTP — email sign-in verification is bypassed for all users.`,
    )
  } else if (effective.requireLoginEmailOtp) {
    console.log(
      `[auth] (${src}) REQUIRE_LOGIN_EMAIL_OTP — customers receive a 6-digit email code after password when SMTP is configured.`,
    )
  } else {
    console.log(
      `[auth] (${src}) Email OTP after password only for users who enabled it in Settings → Security (set REQUIRE_LOGIN_EMAIL_OTP for all users). SMTP required.`,
    )
  }

  if (effective.skipWireEmailOtp) {
    console.warn(
      `[auth] (${src}) SKIP_WIRE_EMAIL_OTP — wire transfer email verification is bypassed.`,
    )
  }

  if (persistedFile) {
    const differs =
      envDefaults.skipLoginEmailOtp !== effective.skipLoginEmailOtp ||
      envDefaults.requireLoginEmailOtp !== effective.requireLoginEmailOtp ||
      envDefaults.skipWireEmailOtp !== effective.skipWireEmailOtp
    if (differs) {
      console.log(
        '[auth] OTP policy loaded from server/data/otp-policy.json (overrides REQUIRE/SKIP_* from .env).',
      )
    }
  }
}
