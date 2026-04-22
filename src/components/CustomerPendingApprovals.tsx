import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { ApprovalItem, ApprovalType } from '../types/approvals'

function typeLabel(t: ApprovalType): string {
  const m: Partial<Record<ApprovalType, string>> = {
    wire_transfer: 'Wire transfer',
    internal_transfer: 'Between accounts',
    bill_pay: 'Bill payment',
    scheduled_bill: 'Scheduled bill',
    send_to_person: 'Send to someone',
    mobile_deposit: 'Mobile deposit',
    card_funding_deposit: 'Card funding',
    crypto_deposit: 'Crypto deposit',
    currency_exchange: 'Currency exchange',
    loan_application: 'Loan application',
    fdr_open: 'Fixed deposit',
    dps_open: 'Savings plan',
    debit_card_lock: 'Debit card lock',
    debit_card_travel_notice: 'Travel notice',
    debit_card_contactless: 'Contactless',
    debit_card_replacement: 'Card replacement',
    cancel_scheduled_bill: 'Cancel scheduled bill',
  }
  return m[t] ?? t.replace(/_/g, ' ')
}

function formatSubmitted(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

/**
 * Lists customer-submitted approvals still in **pending** (not yet on the ledger).
 * Shown on dashboard / pay — Recent activity only shows posted items.
 */
export function CustomerPendingApprovals({ items }: { items: ApprovalItem[] }) {
  const { pathname } = useLocation()
  const onPayPage = pathname.includes('/app/pay')

  const pending = useMemo(
    () =>
      [...items]
        .filter((i) => i.status === 'pending')
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [items],
  )

  if (pending.length === 0) return null

  return (
    <section
      className="rounded-xl border border-bw-blue-500/25 bg-bw-sky-100/90 px-5 py-4 shadow-sm"
      aria-labelledby="pending-approvals-heading"
    >
      <h2
        id="pending-approvals-heading"
        className="font-display text-base font-semibold text-bw-navy-900"
      >
        Requests in progress
      </h2>
      <p className="mt-1 text-sm text-bw-navy-900/85">
        <span className="font-semibold tabular-nums">{pending.length}</span>{' '}
        item{pending.length === 1 ? '' : 's'} waiting on the bank. These do not
        appear in Recent activity until they are approved; balances update then.
      </p>
      <ul className="mt-4 divide-y divide-bw-blue-500/15 border-t border-bw-blue-500/15 pt-3">
        {pending.map((row) => (
          <li key={row.id} className="py-3 first:pt-0">
            <p className="font-medium text-bw-navy-900">{row.title}</p>
            <p className="mt-0.5 text-xs text-bw-muted">
              {typeLabel(row.type)} · Submitted {formatSubmitted(row.createdAt)}{' '}
              · Ref <span className="font-mono">{row.id}</span>
            </p>
          </li>
        ))}
      </ul>
      {!onPayPage ? (
        <p className="mt-3 text-sm">
          <Link
            to="/app/pay"
            className="font-semibold text-bw-blue-700 underline decoration-bw-blue-500/40 underline-offset-2 hover:text-bw-blue-800"
          >
            Pay &amp; transfer
          </Link>{' '}
          is where you can submit or track payment requests.
        </p>
      ) : null}
    </section>
  )
}
