export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export type ApprovalType =
  | 'internal_transfer'
  | 'bill_pay'
  | 'scheduled_bill'
  | 'send_to_person'
  | 'wire_transfer'
  | 'mobile_deposit'
  | 'card_funding_deposit'
  | 'crypto_deposit'
  | 'debit_card_lock'
  | 'debit_card_travel_notice'
  | 'debit_card_contactless'
  | 'debit_card_replacement'
  | 'cancel_scheduled_bill'
  | 'loan_application'
  | 'fdr_open'
  | 'dps_open'
  | 'currency_exchange'
  /** Synthetic feed rows for operator ledger credits (not customer approvals). */
  | 'operator_deposit'
  /** Synthetic feed rows for operator ledger debits (not customer approvals). */
  | 'operator_withdrawal'

export type ApprovalItem = {
  id: string
  status: ApprovalStatus
  type: ApprovalType
  /** Stable customer account id (persisted requests). */
  userId?: string
  submitterId: string
  title: string
  payload: unknown
  createdAt: string
  decidedAt: string | null
  decisionNote: string | null
  appliedAt: string | null
  /** Set when an operator reversed ledger effects for this approval. */
  reversedAt?: string | null
  /** High-risk withdrawal review (operator). */
  suspicious?: boolean
  suspiciousNote?: string | null
  /** Count of operator approvals for multi-step withdrawal policy (pending only). */
  withdrawalCoApprovals?: number
}

export type SubmitApprovalInput = {
  type: ApprovalType
  title: string
  payload: unknown
  /** Required when the customer has set a 6-digit transaction PIN. */
  transactionPin?: string
  /** Required for `wire_transfer` when the API requires email OTP (SMTP configured; not skipped server-side). */
  wireOtpChallengeId?: string
  wireOtpCode?: string
}
