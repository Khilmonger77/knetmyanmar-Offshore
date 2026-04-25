import { loadBankConfig } from './bankConfigStore.js'
import {
  applyTemplateHtml,
  applyTemplateText,
  escapeHtml,
  wrapOfficialLetterHtml,
} from './bankEmailRender.js'
import {
  createTransport,
  isMailReady,
  smtpFromEnv,
} from './smtp.js'
import { formatMailFrom, parseMailFrom } from './smtpAdminStore.js'

/** Mirrors server/lib/loginChallenges CHALLENGE_TTL_MS */
export const LOGIN_OTP_EXPIRY_MINUTES = 10

/**
 * When SMTP From has no display name (bare email), use `bankName` from bank config
 * so customers see the institution name (e.g. "Knetmyanmar Offshore Bank").
 * @param {string} [cfgFrom] MAIL_FROM after persisted SMTP / .env
 */
export function effectiveMailFromEnvelope(cfgFrom) {
  const parsed = parseMailFrom(cfgFrom || '')
  const email = parsed.email.trim()
  if (!email) return String(cfgFrom || '').trim()

  if (parsed.name.trim()) {
    return String(cfgFrom || '').trim()
  }

  const bank = loadBankConfig()
  const institution = String(bank.bankName || '').trim()
  if (institution) {
    return formatMailFrom(institution, email)
  }

  return String(cfgFrom || '').trim() || email
}

export class MailNotConfiguredError extends Error {
  constructor() {
    super('Mail is not configured on the server.')
    this.name = 'MailNotConfiguredError'
    this.code = 'MAIL_NOT_CONFIGURED'
  }
}

/**
 * @param {{ to: string, subject: string, text: string, html?: string }} opts
 */
export async function sendMailRich(opts) {
  const cfg = smtpFromEnv()
  if (!isMailReady(cfg)) throw new MailNotConfiguredError()
  const transporter = createTransport(cfg)
  /** @type {import('nodemailer').SendMailOptions} */
  const mail = {
    from: effectiveMailFromEnvelope(cfg.from),
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
  }
  if (opts.html) mail.html = opts.html
  await transporter.sendMail(mail)
}

/**
 * @param {{ to: string, subject: string, text: string }} opts
 */
export async function sendMailText(opts) {
  await sendMailRich({ ...opts })
}

export function getEmailLetters(bank) {
  const el = bank.emailLetters && typeof bank.emailLetters === 'object'
    ? bank.emailLetters
    : {}
  return el
}

/**
 * @param {object} bank — merged bank config
 * @param {Record<string, string | number>} vars
 */
export function buildOtpEmailParts(bank, vars) {
  const letters = getEmailLetters(bank)
  const subject = applyTemplateText(letters.otpSubjectTemplate, vars)
  const innerHtml = applyTemplateHtml(letters.otpInnerHtml, vars)
  const html = wrapOfficialLetterHtml(innerHtml, bank)
  const text = applyTemplateText(letters.otpTextBody, vars)
  return { subject, html, text }
}

/**
 * @param {object} bank — merged bank config
 * @param {Record<string, string | number>} vars
 */
export function buildWireTransferOtpParts(bank, vars) {
  const letters = getEmailLetters(bank)
  const subject = applyTemplateText(
    letters.wireTransferOtpSubjectTemplate,
    vars,
  )
  const innerHtml = applyTemplateHtml(
    letters.wireTransferOtpInnerHtml,
    vars,
  )
  const html = wrapOfficialLetterHtml(innerHtml, bank)
  const text = applyTemplateText(letters.wireTransferOtpTextBody, vars)
  return { subject, html, text }
}

/**
 * @param {object} bank — merged bank config
 * @param {Record<string, string | number>} vars
 */
export function buildEmailChangeOtpParts(bank, vars) {
  const letters = getEmailLetters(bank)
  const subject = applyTemplateText(letters.emailChangeSubjectTemplate, vars)
  const innerHtml = applyTemplateHtml(letters.emailChangeInnerHtml, vars)
  const html = wrapOfficialLetterHtml(innerHtml, bank)
  const text = applyTemplateText(letters.emailChangeTextBody, vars)
  return { subject, html, text }
}

/**
 * @param {object} bank
 * @param {Record<string, string | number>} vars
 */
export function buildKycNotifyParts(bank, vars) {
  const letters = getEmailLetters(bank)
  const subject = applyTemplateText(letters.kycNotifySubjectTemplate, vars)
  const innerHtml = applyTemplateHtml(letters.kycNotifyInnerHtml, vars)
  const html = wrapOfficialLetterHtml(innerHtml, bank)
  const text = applyTemplateText(letters.kycNotifyTextBody, vars)
  return { subject, html, text }
}

/**
 * @param {object} bank
 * @param {Record<string, string | number>} vars
 */
export function buildTestLetterParts(bank, vars) {
  const letters = getEmailLetters(bank)
  const subject = applyTemplateText(letters.testSubjectTemplate, vars)
  const innerHtml = applyTemplateHtml(letters.testInnerHtml, vars)
  const html = wrapOfficialLetterHtml(innerHtml, bank)
  const text = applyTemplateText(letters.testTextBody, vars)
  return { subject, html, text }
}

/** Sample placeholder values for admin preview (not sent). */
export function previewVarsFor(type, bank) {
  const b = bank
  switch (type) {
    case 'otp':
      return {
        greetingLine: 'Hi Alex Rivera,',
        code: '482916',
        expiryMinutes: String(LOGIN_OTP_EXPIRY_MINUTES),
        bankName: b.bankName,
        supportEmail: b.supportEmail,
        supportPhone: b.supportPhone,
        supportPhoneFraud: b.supportPhoneFraud,
      }
    case 'email_change':
      return {
        greetingLine: 'Hi Alex Rivera,',
        code: '739204',
        expiryMinutes: String(LOGIN_OTP_EXPIRY_MINUTES),
        bankName: b.bankName,
        supportEmail: b.supportEmail,
        supportPhone: b.supportPhone,
        supportPhoneFraud: b.supportPhoneFraud,
      }
    case 'wire_transfer':
      return {
        greetingLine: 'Hi Alex Rivera,',
        code: '829401',
        expiryMinutes: String(LOGIN_OTP_EXPIRY_MINUTES),
        bankName: b.bankName,
        supportEmail: b.supportEmail,
        supportPhone: b.supportPhone,
        supportPhoneFraud: b.supportPhoneFraud,
      }
    case 'kyc':
      return {
        submissionId: 'kyc_demo_01HZZ9XF',
        customerEmail: 'customer@example.com',
        displayName: 'Jordan Lee',
        bankName: b.bankName,
        supportEmail: b.supportEmail,
        supportPhone: b.supportPhone,
      }
    case 'test':
      return {
        greetingLine: 'Hi Riley,',
        bankName: b.bankName,
        supportEmail: b.supportEmail,
        displayName: 'Operator',
      }
    default:
      throw new Error('Unknown preview type')
  }
}

/**
 * @param {{ submissionId: string, customerEmail: string, displayName: string }} opts
 */
export async function sendKycSubmissionNotifyEmail(opts) {
  const to = String(process.env.KYC_NOTIFY_EMAIL || '').trim()
  if (!to) {
    console.log(
      '[mail] KYC submission received; set KYC_NOTIFY_EMAIL in server/.env to notify compliance.',
    )
    return
  }

  const bank = loadBankConfig()
  const vars = {
    submissionId: opts.submissionId,
    customerEmail: opts.customerEmail,
    displayName: opts.displayName,
    bankName: bank.bankName,
    supportEmail: bank.supportEmail,
    supportPhone: bank.supportPhone,
  }

  const { subject, html, text } = buildKycNotifyParts(bank, vars)
  await sendMailRich({ to, subject, text, html })
}

/**
 * @param {{ to: string, displayName: string, code: string }} opts
 */
export async function sendLoginOtpEmail(opts) {
  const bank = loadBankConfig()

  const greetingLine = opts.displayName?.trim()
    ? `Hi ${opts.displayName.trim().slice(0, 80)},`
    : 'Hello,'

  const vars = {
    greetingLine,
    code: opts.code,
    expiryMinutes: String(LOGIN_OTP_EXPIRY_MINUTES),
    bankName: bank.bankName,
    supportEmail: bank.supportEmail,
    supportPhone: bank.supportPhone,
    supportPhoneFraud: bank.supportPhoneFraud,
  }

  const { subject, html, text } = buildOtpEmailParts(bank, vars)

  await sendMailRich({
    to: opts.to,
    subject,
    text,
    html,
  })
}

/**
 * @param {{ to: string, displayName: string, code: string }} opts
 */
export async function sendWireTransferOtpEmail(opts) {
  const bank = loadBankConfig()

  const greetingLine = opts.displayName?.trim()
    ? `Hi ${opts.displayName.trim().slice(0, 80)},`
    : 'Hello,'

  const vars = {
    greetingLine,
    code: opts.code,
    expiryMinutes: String(LOGIN_OTP_EXPIRY_MINUTES),
    bankName: bank.bankName,
    supportEmail: bank.supportEmail,
    supportPhone: bank.supportPhone,
    supportPhoneFraud: bank.supportPhoneFraud,
  }

  const { subject, html, text } = buildWireTransferOtpParts(bank, vars)

  await sendMailRich({
    to: opts.to,
    subject,
    text,
    html,
  })
}

/**
 * OTP to confirm a new Online Banking email; sent only to the new address.
 * @param {{ to: string, displayName: string, code: string }} opts
 */
export async function sendEmailChangeOtpEmail(opts) {
  const bank = loadBankConfig()

  const greetingLine = opts.displayName?.trim()
    ? `Hi ${opts.displayName.trim().slice(0, 80)},`
    : 'Hello,'

  const vars = {
    greetingLine,
    code: opts.code,
    expiryMinutes: String(LOGIN_OTP_EXPIRY_MINUTES),
    bankName: bank.bankName,
    supportEmail: bank.supportEmail,
    supportPhone: bank.supportPhone,
    supportPhoneFraud: bank.supportPhoneFraud,
  }

  const { subject, html, text } = buildEmailChangeOtpParts(bank, vars)

  await sendMailRich({
    to: opts.to,
    subject,
    text,
    html,
  })
}

/**
 * Operator “send test email” from /api/notify/test
 * @param {{ to: string, displayName?: string }} opts
 */
export async function sendNotifyTestLetter(opts) {
  const bank = loadBankConfig()
  const displayName =
    typeof opts.displayName === 'string' ? opts.displayName.trim().slice(0, 80) : ''
  const greetingLine = displayName ? `Hi ${displayName},` : 'Hello,'

  const vars = {
    greetingLine,
    bankName: bank.bankName,
    supportEmail: bank.supportEmail,
    displayName: displayName || 'Valued customer',
  }

  const { subject, html, text } = buildTestLetterParts(bank, vars)

  await sendMailRich({
    to: opts.to,
    subject,
    text,
    html,
  })
}

const noticeBodyStyle =
  'font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.65;color:#1e293b;margin:0 0 14px;'

/**
 * Customer notice when an operator suspends online banking (fraud / security).
 * @param {{ to: string, displayName?: string, reason?: string | null }} opts
 */
export async function sendOnlineBankingRestrictedNoticeEmail(opts) {
  const bank = loadBankConfig()
  const displayName =
    typeof opts.displayName === 'string' ? opts.displayName.trim().slice(0, 80) : ''
  const greeting = displayName ? `Hi ${escapeHtml(displayName)},` : 'Hello,'
  const brand = escapeHtml(String(bank.bankNameShort || bank.bankName || 'Bank'))
  const reasonRaw =
    typeof opts.reason === 'string' && opts.reason.trim()
      ? opts.reason.trim().slice(0, 800)
      : ''
  const reasonHtml = reasonRaw
    ? `<p style="${noticeBodyStyle}"><strong>Note from the bank:</strong><br>${escapeHtml(reasonRaw).replace(/\n/g, '<br>')}</p>`
    : ''
  const support = escapeHtml(String(bank.supportEmail || '').trim())
  const phone = escapeHtml(String(bank.supportPhone || '').trim())
  const fraudPhone = escapeHtml(
    String(bank.supportPhoneFraud || bank.supportPhone || '').trim(),
  )

  const innerHtml = `<p style="${noticeBodyStyle}">${greeting}</p>
<p style="${noticeBodyStyle}">We have suspended access to <strong>${brand}</strong> online banking for your profile. You will not be able to sign in until this restriction is removed by the bank.</p>
${reasonHtml}
<p style="${noticeBodyStyle}">If you have questions or believe this is an error, contact us at <a href="mailto:${support}">${support}</a>${phone ? ` or call ${phone}` : ''}.</p>
<p style="${noticeBodyStyle}">For card loss, suspected fraud, or urgent security matters, call ${fraudPhone}.</p>`

  const textGreeting = displayName ? `Hi ${displayName},` : 'Hello,'
  const textReason = reasonRaw
    ? `\n\nNote from the bank:\n${reasonRaw}\n`
    : '\n'
  const phonePlain = String(bank.supportPhone || '').trim()
  const textBody = `${textGreeting}

We have suspended access to ${String(bank.bankNameShort || bank.bankName || 'Bank')} online banking for your profile. You will not be able to sign in until this restriction is removed by the bank.${textReason}
If you have questions or believe this is an error, contact us at ${String(bank.supportEmail || '').trim()}${phonePlain ? ` or call ${phonePlain}` : ''}.

For card loss, suspected fraud, or urgent security matters, call ${String(bank.supportPhoneFraud || bank.supportPhone || '').trim()}.
`

  const subject = `${String(bank.bankNameShort || bank.bankName || 'Bank').trim()}: online banking access suspended`

  await sendMailRich({
    to: opts.to,
    subject,
    text: textBody,
    html: wrapOfficialLetterHtml(innerHtml, bank),
  })
}

/**
 * Customer notice when an operator restores online banking after a hold.
 * @param {{ to: string, displayName?: string }} opts
 */
export async function sendOnlineBankingUnrestrictedNoticeEmail(opts) {
  const bank = loadBankConfig()
  const displayName =
    typeof opts.displayName === 'string' ? opts.displayName.trim().slice(0, 80) : ''
  const greeting = displayName ? `Hi ${escapeHtml(displayName)},` : 'Hello,'
  const brand = escapeHtml(String(bank.bankNameShort || bank.bankName || 'Bank'))
  const support = escapeHtml(String(bank.supportEmail || '').trim())
  const phone = escapeHtml(String(bank.supportPhone || '').trim())
  const fraudPhone = escapeHtml(
    String(bank.supportPhoneFraud || bank.supportPhone || '').trim(),
  )

  const innerHtml = `<p style="${noticeBodyStyle}">${greeting}</p>
<p style="${noticeBodyStyle}">Good news: we have restored <strong>${brand}</strong> online banking for your profile. You may sign in again with your usual Internet Banking ID or email and password.</p>
<p style="${noticeBodyStyle}">If you still have trouble signing in, contact us at <a href="mailto:${support}">${support}</a>${phone ? ` or call ${phone}` : ''}.</p>
<p style="${noticeBodyStyle}">For card loss, suspected fraud, or urgent security matters, call ${fraudPhone}.</p>`

  const textGreeting = displayName ? `Hi ${displayName},` : 'Hello,'
  const phonePlain = String(bank.supportPhone || '').trim()
  const textBody = `${textGreeting}

Good news: we have restored ${String(bank.bankNameShort || bank.bankName || 'Bank')} online banking for your profile. You may sign in again with your usual Internet Banking ID or email and password.

If you still have trouble signing in, contact us at ${String(bank.supportEmail || '').trim()}${phonePlain ? ` or call ${phonePlain}` : ''}.

For card loss, suspected fraud, or urgent security matters, call ${String(bank.supportPhoneFraud || bank.supportPhone || '').trim()}.
`

  const subject = `${String(bank.bankNameShort || bank.bankName || 'Bank').trim()}: online banking access restored`

  await sendMailRich({
    to: opts.to,
    subject,
    text: textBody,
    html: wrapOfficialLetterHtml(innerHtml, bank),
  })
}
