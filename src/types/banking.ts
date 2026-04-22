export type AccountRow = {
  id: string
  name: string
  mask: string
  /** Full account number; shown only on the account detail screen. */
  accountNumberFull?: string
  type: string
  balanceCents: number
}

export type ActivityRow = {
  id: string
  dateLabel: string
  description: string
  amountCents: number
  /** Set for operator-posted ledger lines (server). */
  bookedAt?: string
  operatorAccountId?: string
  /** Present when this row mirrors a debit card authorization (Recent activity merge). */
  postedAt?: string
}

export type ScheduledBillPayment = {
  id: string
  fromId: string
  payeeName: string
  amountCents: number
  deliverBy: string
}

export type CardTransactionStatus = 'posted' | 'declined' | 'pending'

export type DebitCardTransaction = {
  id: string
  postedAt: string
  merchant: string
  amountCents: number
  status: CardTransactionStatus
}

export type DebitCardInfo = {
  last4: string
  expMonth: number
  expYear: number
  locked: boolean
  travelNoticeEnabled: boolean
  contactlessEnabled: boolean
  cardType?: 'virtual' | 'physical'
  /** ISO time when a card was last issued; null means not yet issued. */
  issuedAt?: string | null
  /** Operator freeze — customer cannot change card settings until cleared. */
  adminFrozen?: boolean
  /** Theft / fraud block — stronger than lock; cleared only by the bank. */
  stolenBlocked?: boolean
  singleTransactionLimitCents?: number | null
  dailySpendLimitCents?: number | null
  transactions?: DebitCardTransaction[]
}

export type BankingSnapshot = {
  accounts: AccountRow[]
  activity: ActivityRow[]
  scheduledBillPayments: ScheduledBillPayment[]
  debitCard: DebitCardInfo
  replacementBanner: string | null
}
