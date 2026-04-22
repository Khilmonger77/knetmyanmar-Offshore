import type { ApprovalType } from '../types/approvals'

export type EngineKind = 'deposit' | 'withdrawal' | 'transfer' | 'other'

/** Approval types whose ledger effects can be undone via POST /api/admin/approvals/:id/reverse */
export const REVERSIBLE_APPROVAL_TYPES: ReadonlySet<ApprovalType> = new Set([
  'mobile_deposit',
  'card_funding_deposit',
  'crypto_deposit',
  'internal_transfer',
  'bill_pay',
  'send_to_person',
  'wire_transfer',
])

export function engineKindFromApprovalType(type: string): EngineKind {
  switch (type) {
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

export function engineKindLabel(k: EngineKind): string {
  switch (k) {
    case 'deposit':
      return 'Deposit'
    case 'withdrawal':
      return 'Withdrawal'
    case 'transfer':
      return 'Transfer'
    default:
      return 'Other'
  }
}
