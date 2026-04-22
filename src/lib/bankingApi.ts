import type { OnlineBankingAccessRestriction } from '../types/accessRestriction'
import type { BankingSnapshot } from '../types/banking'
import { customerFetch, getCustomerToken } from './authApi'
import { getApiBase } from './apiBase'

export type { BankingSnapshot }

export type BankingStatePayload = {
  banking: BankingSnapshot
  accessRestriction: OnlineBankingAccessRestriction
}

export async function fetchBankingState(): Promise<BankingStatePayload> {
  const t = getCustomerToken()
  if (!t) throw new Error('Not signed in.')
  const r = await customerFetch(`${getApiBase()}/api/banking/state`)
  const data = (await r.json()) as {
    ok?: boolean
    banking?: BankingSnapshot
    accessRestriction?: OnlineBankingAccessRestriction
    error?: string
  }
  if (!r.ok || !data.ok || !data.banking) {
    throw new Error(data.error ?? 'Could not load accounts.')
  }
  const accessRestriction: OnlineBankingAccessRestriction =
    data.accessRestriction &&
    typeof data.accessRestriction.restricted === 'boolean'
      ? {
          restricted: data.accessRestriction.restricted,
          reason:
            typeof data.accessRestriction.reason === 'string' &&
            data.accessRestriction.reason.trim()
              ? data.accessRestriction.reason.trim()
              : null,
        }
      : { restricted: false, reason: null }
  return { banking: data.banking, accessRestriction }
}

export async function dismissReplacementBannerApi(): Promise<BankingSnapshot> {
  const t = getCustomerToken()
  if (!t) throw new Error('Not signed in.')
  const r = await customerFetch(
    `${getApiBase()}/api/banking/dismiss-replacement-banner`,
    { method: 'POST' },
  )
  const data = (await r.json()) as {
    ok?: boolean
    banking?: BankingSnapshot
    error?: string
  }
  if (!r.ok || !data.ok || !data.banking) {
    throw new Error(data.error ?? 'Could not update.')
  }
  return data.banking
}

export async function cancelScheduledBillPayment(
  scheduledPaymentId: string,
): Promise<BankingSnapshot> {
  const t = getCustomerToken()
  if (!t) throw new Error('Not signed in.')
  const r = await customerFetch(
    `${getApiBase()}/api/banking/cancel-scheduled-bill`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledPaymentId }),
    },
  )
  const raw = await r.text()
  let data: { ok?: boolean; banking?: BankingSnapshot; error?: string }
  try {
    data = JSON.parse(raw) as typeof data
  } catch {
    throw new Error(
      r.status === 404
        ? 'Cancel API not found (404). Restart the API server from the repo so it loads the latest routes.'
        : 'Could not cancel scheduled payment (invalid server response).',
    )
  }
  if (!r.ok || !data.ok || !data.banking) {
    throw new Error(data.error ?? 'Could not cancel scheduled payment.')
  }
  return data.banking
}
