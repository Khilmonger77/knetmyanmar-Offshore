export const INVESTMENT_BROKERAGE_ID = 'inv-brokerage'
export const INVESTMENT_IRA_ID = 'inv-ira'

export type InvestmentAccountProfile = {
  id: string
  typeLabel: string
  name: string
  mask: string
  accountNumberFull: string
  balanceCents: number
  classification: string
}

const PROFILES: Record<string, InvestmentAccountProfile> = {
  [INVESTMENT_BROKERAGE_ID]: {
    id: INVESTMENT_BROKERAGE_ID,
    typeLabel: 'Individual brokerage',
    name: 'Individual brokerage',
    mask: '6912',
    accountNumberFull: '7942863196912',
    balanceCents: 156_320_00,
    classification: 'Taxable',
  },
  [INVESTMENT_IRA_ID]: {
    id: INVESTMENT_IRA_ID,
    typeLabel: 'Traditional IRA',
    name: 'Traditional IRA',
    mask: '8841',
    accountNumberFull: '7942863198841',
    balanceCents: 71_850_00,
    classification: 'Tax-advantaged',
  },
}

export function getInvestmentAccountProfile(
  id: string | undefined,
): InvestmentAccountProfile | null {
  if (!id) return null
  return PROFILES[id] ?? null
}

/** Groups digits for display (e.g. card-style spacing). */
export function formatFullAccountNumberForDisplay(full: string): string {
  const digits = full.replace(/\D/g, '')
  return digits.replace(/(.{4})/g, '$1 ').trim()
}
