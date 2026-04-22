import { Link } from 'react-router-dom'
import {
  getInvestmentAccountProfile,
  INVESTMENT_BROKERAGE_ID,
  INVESTMENT_IRA_ID,
} from '../lib/investmentAccountProfiles'
import { formatCurrency } from '../lib/money'
import type { AccountRow } from '../types/banking'

const brokerageProfile = getInvestmentAccountProfile(INVESTMENT_BROKERAGE_ID)!
const iraProfile = getInvestmentAccountProfile(INVESTMENT_IRA_ID)!

type AccountsOverviewSectionProps = {
  depositAccounts?: AccountRow[]
}

export function AccountsOverviewSection({
  depositAccounts,
}: AccountsOverviewSectionProps) {
  return (
    <section className="rounded-xl border border-bw-sand-200 bg-white p-6 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-bw-navy-900">
        Accounts overview
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {depositAccounts?.map((a) => (
          <article
            key={a.id}
            className="rounded-lg border border-bw-sand-200 bg-bw-sand-100/40 p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-bw-muted">
              {a.type}
            </p>
            <h3 className="mt-1 font-display text-lg font-semibold text-bw-navy-900">
              {a.name}
            </h3>
            <p className="text-sm text-bw-muted">···{a.mask}</p>
            <p className="mt-3 font-display text-xl font-semibold tabular-nums text-bw-navy-900">
              {formatCurrency(a.balanceCents)}
            </p>
            <p className="text-xs text-bw-muted">Available balance</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to={`/app/accounts/${encodeURIComponent(a.id)}`}
                className="inline-flex items-center justify-center rounded-md bg-bw-navy-900 px-3 py-2 text-xs font-semibold text-white hover:bg-bw-navy-800"
              >
                View details
              </Link>
              <Link
                to="/app/pay"
                className="inline-flex items-center rounded-md border border-bw-sand-200 bg-white px-3 py-2 text-xs font-semibold text-bw-navy-900 hover:bg-bw-sand-100"
              >
                Transfer
              </Link>
            </div>
          </article>
        ))}
        <article className="rounded-lg border border-bw-sand-200 bg-bw-sand-100/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-bw-muted">
            {brokerageProfile.typeLabel}
          </p>
          <p className="mt-1 font-display text-xl font-semibold tabular-nums text-bw-navy-900">
            {formatCurrency(brokerageProfile.balanceCents)}
          </p>
          <p className="mt-1 text-xs text-bw-muted">
            ···{brokerageProfile.mask} · {brokerageProfile.classification}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to={`/app/accounts/${encodeURIComponent(brokerageProfile.id)}`}
              className="inline-flex items-center justify-center rounded-md bg-bw-navy-900 px-3 py-2 text-xs font-semibold text-white hover:bg-bw-navy-800"
            >
              View details
            </Link>
            <Link
              to="/app/invest"
              className="inline-flex items-center rounded-md border border-bw-sand-200 bg-white px-3 py-2 text-xs font-semibold text-bw-navy-900 hover:bg-bw-sand-100"
            >
              Plan &amp; invest
            </Link>
          </div>
        </article>
        <article className="rounded-lg border border-bw-sand-200 bg-bw-sand-100/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-bw-muted">
            {iraProfile.typeLabel}
          </p>
          <p className="mt-1 font-display text-xl font-semibold tabular-nums text-bw-navy-900">
            {formatCurrency(iraProfile.balanceCents)}
          </p>
          <p className="mt-1 text-xs text-bw-muted">
            ···{iraProfile.mask} · {iraProfile.classification}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to={`/app/accounts/${encodeURIComponent(iraProfile.id)}`}
              className="inline-flex items-center justify-center rounded-md bg-bw-navy-900 px-3 py-2 text-xs font-semibold text-white hover:bg-bw-navy-800"
            >
              View details
            </Link>
            <Link
              to="/app/invest"
              className="inline-flex items-center rounded-md border border-bw-sand-200 bg-white px-3 py-2 text-xs font-semibold text-bw-navy-900 hover:bg-bw-sand-100"
            >
              Plan &amp; invest
            </Link>
          </div>
        </article>
      </div>
    </section>
  )
}
