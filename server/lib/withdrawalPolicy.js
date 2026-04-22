import {
  amountCentsFromApproval,
  isWithdrawalApprovalType,
} from './adminTransactionFeed.js'
import { loadBankConfig } from './bankConfigStore.js'

/**
 * Enforce institution withdrawal caps on customer-submitted queue items.
 * @param {string} type
 * @param {unknown} payload
 * @returns {string | null} error message or null if ok
 */
export function assertWithdrawalPolicyOnSubmit(type, payload) {
  if (!isWithdrawalApprovalType(type)) return null
  const amt = amountCentsFromApproval({ type, payload })
  if (amt == null || !Number.isFinite(amt) || amt <= 0) return null

  let cfg
  try {
    cfg = loadBankConfig()
  } catch {
    return null
  }
  const wd = cfg.withdrawals || {}
  const maxSingle = wd.maxSingleWithdrawalCents
  if (maxSingle != null && Number(maxSingle) > 0 && amt > Number(maxSingle)) {
    return `This amount exceeds the institution single-withdrawal limit (${(Number(maxSingle) / 100).toFixed(2)} USD). Reduce the amount or contact the operator desk.`
  }

  const maxDaily = wd.maxDailyWithdrawalPerCustomerCents
  if (maxDaily != null && Number(maxDaily) > 0) {
    // Reserved for future per-customer daily aggregation; policy stored for operators.
  }

  return null
}

/**
 * @param {string} type
 * @param {unknown} payload
 * @param {{ multiStepEnabled?: boolean, secondStepThresholdCents?: number }} wd
 * @param {number} coApprovalsSoFar
 * @returns {boolean} true if execute should be deferred for a second operator approval
 */
export function withdrawalRequiresSecondOperator(type, payload, wd, coApprovalsSoFar) {
  if (!isWithdrawalApprovalType(type)) return false
  if (!wd || !wd.multiStepEnabled) return false
  const thr = Number(wd.secondStepThresholdCents)
  if (!Number.isFinite(thr) || thr <= 0) return false
  const amt = amountCentsFromApproval({ type, payload })
  if (amt == null || !Number.isFinite(amt) || amt < thr) return false
  return coApprovalsSoFar < 1
}
