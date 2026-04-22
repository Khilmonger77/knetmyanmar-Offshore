import {
  applyApprovalToBankingState,
  reverseAppliedApprovalEffect,
} from './bankingEngine.js'
import { loadBankConfig } from './bankConfigStore.js'
import {
  getInternalUser,
  saveUserBanking,
} from './usersStore.js'

/**
 * @param {object} cfg
 * @param {string} approvalType
 */
export function buildExecutionFees(cfg, approvalType) {
  const fees = cfg.fees ?? {
    wireDomesticCents: 0,
    wireInternationalCents: 0,
    wireCotCents: 0,
    wireImfCents: 0,
    fxUsdPerEur: 1,
  }
  const df = cfg.depositsAndFees
  let incomingDepositFeeCents = 0
  const autoFees =
    df && String(df.transactionFeesMode || 'auto').toLowerCase() === 'auto'
  if (autoFees) {
    if (approvalType === 'mobile_deposit') {
      incomingDepositFeeCents = Math.round(
        Number(df.incomingBankTransferFeeCents) || 0,
      )
    } else if (approvalType === 'card_funding_deposit') {
      incomingDepositFeeCents = Math.round(Number(df.cardFundingFeeCents) || 0)
    } else if (approvalType === 'crypto_deposit') {
      incomingDepositFeeCents = Math.round(Number(df.cryptoDepositFeeCents) || 0)
    }
  }
  return {
    wireDomesticCents: Number(fees.wireDomesticCents) || 0,
    wireInternationalCents: Number(fees.wireInternationalCents) || 0,
    wireCotCents: Number(fees.wireCotCents) || 0,
    wireImfCents: Number(fees.wireImfCents) || 0,
    fxUsdPerEur: Number(fees.fxUsdPerEur) > 0 ? Number(fees.fxUsdPerEur) : 1,
    incomingDepositFeeCents,
  }
}

/**
 * Runs a pending approval against the customer's persisted banking state.
 * @param {{ userId?: string, type: string, payload: unknown }} item
 */
export function executeApprovedApproval(item) {
  if (!item.userId || typeof item.userId !== 'string') {
    return {
      ok: false,
      error:
        'This request has no linked user (legacy data). Reject it and have the customer submit again.',
    }
  }
  const user = getInternalUser(item.userId)
  if (!user) {
    return { ok: false, error: 'Customer account no longer exists.' }
  }
  let cfg
  try {
    cfg = loadBankConfig()
  } catch {
    return { ok: false, error: 'Could not load bank configuration.' }
  }
  const feePayload = buildExecutionFees(cfg, item.type)
  const result = applyApprovalToBankingState(
    user.banking,
    item.type,
    item.payload,
    feePayload,
  )
  if (!result.ok) return result
  saveUserBanking(item.userId, result.banking)
  return { ok: true }
}

/**
 * Undoes ledger effects for a subset of approved approval types.
 * @param {{ userId?: string, type: string, payload: unknown }} item
 */
export function executeReverseApprovedApproval(item) {
  if (!item.userId || typeof item.userId !== 'string') {
    return {
      ok: false,
      error:
        'This request has no linked user (legacy data). Reversal is not supported.',
    }
  }
  const user = getInternalUser(item.userId)
  if (!user) {
    return { ok: false, error: 'Customer account no longer exists.' }
  }
  let cfg
  try {
    cfg = loadBankConfig()
  } catch {
    return { ok: false, error: 'Could not load bank configuration.' }
  }
  const feePayload = buildExecutionFees(cfg, item.type)
  const result = reverseAppliedApprovalEffect(
    user.banking,
    item.type,
    item.payload,
    feePayload,
  )
  if (!result.ok) return result
  saveUserBanking(item.userId, result.banking)
  return { ok: true }
}
