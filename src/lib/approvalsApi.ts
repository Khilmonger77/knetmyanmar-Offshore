import type { ApprovalItem, SubmitApprovalInput } from '../types/approvals'
import { customerFetch, getCustomerToken } from './authApi'
import { getApiBase } from './apiBase'

export async function submitApprovalRequest(
  input: SubmitApprovalInput,
): Promise<
  | {
      ok: true
      item: ApprovalItem
      depositAutoApplied?: boolean
      bankingAutoApplied?: boolean
    }
  | { ok: false; error: string; item?: ApprovalItem }
> {
  const t = getCustomerToken()
  if (!t) {
    return { ok: false, error: 'Sign in to submit requests.' }
  }
  const r = await customerFetch(`${getApiBase()}/api/approvals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: input.type,
      title: input.title,
      payload: input.payload,
      ...(input.transactionPin
        ? { transactionPin: input.transactionPin }
        : {}),
      ...(input.wireOtpChallengeId && input.wireOtpCode
        ? {
            wireOtpChallengeId: input.wireOtpChallengeId,
            wireOtpCode: input.wireOtpCode,
          }
        : {}),
    }),
  })
  const data = (await r.json()) as {
    ok?: boolean
    item?: ApprovalItem
    error?: string
    depositAutoApplied?: boolean
    bankingAutoApplied?: boolean
  }
  if (!r.ok || !data.ok || !data.item) {
    return {
      ok: false,
      error: data.error ?? 'Could not submit request.',
      item: data.item,
    }
  }
  return {
    ok: true,
    item: data.item,
    depositAutoApplied: Boolean(data.depositAutoApplied),
    bankingAutoApplied: Boolean(data.bankingAutoApplied),
  }
}

export async function fetchMyApprovals(): Promise<ApprovalItem[]> {
  const t = getCustomerToken()
  if (!t) return []
  const r = await customerFetch(`${getApiBase()}/api/approvals/my`)
  const data = (await r.json()) as { ok?: boolean; items?: ApprovalItem[] }
  if (!r.ok || !data.ok || !Array.isArray(data.items)) return []
  return data.items
}
