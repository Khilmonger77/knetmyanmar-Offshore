import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useBankConfig } from '../contexts/BankConfigContext'
import { clearCustomerToken, hasOperatorConsoleReturnHint } from '../lib/authApi'
import { LogoMark } from './LogoMark'

const tabClass = ({ isActive }: { isActive: boolean }) =>
  [
    'relative whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
    isActive
      ? 'bg-bw-navy-900 text-white shadow-sm'
      : 'text-bw-muted hover:bg-bw-sand-200/80 hover:text-bw-navy-900',
  ].join(' ')

export function AppHeader() {
  const { displayName, signOut } = useAuth()
  const cfg = useBankConfig()
  const showOperatorReturn = hasOperatorConsoleReturnHint()

  return (
    <header className="sticky top-0 z-40 border-b border-bw-sand-200/90 bg-white/95 shadow-bw-soft backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link
          to="/app"
          className="flex items-center gap-3 text-bw-navy-900 no-underline"
        >
          <span className="rounded-xl bg-bw-sand-100 p-1 ring-1 ring-bw-sand-200">
            <LogoMark className="h-9 w-9 shrink-0" variant="dark" />
          </span>
          <div>
            <span className="font-display text-lg font-semibold tracking-tight">
              {cfg.bankName}
            </span>
            <p className="text-xs text-bw-muted">Signed in as {displayName}</p>
          </div>
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          {showOperatorReturn ? (
            <button
              type="button"
              onClick={() => {
                clearCustomerToken()
                window.location.assign('/admin/users')
              }}
              className="rounded-lg border border-bw-navy-800 bg-bw-navy-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-bw-navy-800"
            >
              Return to operator console
            </button>
          ) : null}
          <span className="rounded-full bg-bw-sky-100/80 px-3 py-1 text-xs font-medium text-bw-navy-800">
            Last sign-in: Today
          </span>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-lg border border-bw-sand-200 bg-white px-4 py-2 text-sm font-semibold text-bw-navy-900 shadow-sm transition hover:border-bw-navy-800/15 hover:bg-bw-sand-100"
          >
            Sign out
          </button>
        </div>
      </div>
      <div className="border-t border-bw-sand-200/80 bg-bw-sand-100/60">
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-1 px-4 py-3 sm:gap-1.5 sm:px-6">
          <NavLink to="/app" className={tabClass} end>
            Accounts
          </NavLink>
          <NavLink to="/app/debit-card" className={tabClass}>
            Debit card
          </NavLink>
          <NavLink to="/app/pay" className={tabClass}>
            Pay &amp; transfer
          </NavLink>
          <NavLink to="/app/invest" className={tabClass}>
            Plan &amp; invest
          </NavLink>
          <NavLink to="/app/support" className={tabClass}>
            Support
          </NavLink>
          <NavLink to="/app/settings" className={tabClass}>
            Settings
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
