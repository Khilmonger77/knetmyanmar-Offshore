import { NavLink } from 'react-router-dom'
import { useBankConfig } from '../contexts/BankConfigContext'
import { LogoMark } from './LogoMark'

const navClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-full px-3.5 py-2 text-sm font-semibold tracking-tight transition-all duration-200',
    isActive
      ? 'bg-white text-bw-navy-900 shadow-sm'
      : 'text-white/90 hover:bg-white/12 hover:text-white',
  ].join(' ')

export function PublicHeader() {
  const cfg = useBankConfig()
  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-bw-navy-900/10 bg-bw-navy-950 text-white/75">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5 text-xs font-medium">
          <span className="hidden text-white/50 sm:inline">
            {cfg.supportPhone ? `Questions? ${cfg.supportPhone}` : null}
          </span>
          <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-1 sm:justify-start">
            <a
              className="transition hover:text-white"
              href="#"
              aria-label="Branch and ATM locator"
            >
              Locations
            </a>
            <a className="transition hover:text-white" href="#">
              Support
            </a>
            <a className="transition hover:text-white" href="#">
              Español
            </a>
          </div>
        </div>
      </div>
      <div className="border-b border-white/10 bg-bw-navy-900 shadow-bw-soft">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-4">
          <NavLink
            to="/"
            className="group flex items-center gap-3.5 text-left text-white no-underline"
          >
            <span className="rounded-xl bg-white/10 p-1 ring-1 ring-white/15 transition group-hover:bg-white/15">
              <LogoMark className="h-10 w-10 shrink-0" variant="light" />
            </span>
            <div>
              <span className="font-display text-xl font-semibold tracking-tight sm:text-[1.35rem]">
                {cfg.bankName}
              </span>
              <p className="mt-0.5 text-xs font-medium leading-snug text-bw-sky-100/85">
                {cfg.taglineHeader}
              </p>
            </div>
          </NavLink>
          <nav className="flex flex-wrap items-center gap-1.5 sm:justify-end sm:gap-2">
            <NavLink to="/personal" className={navClass}>
              Personal
            </NavLink>
            <NavLink to="/small-business" className={navClass}>
              Small business
            </NavLink>
            <NavLink to="/wealth" className={navClass}>
              Wealth
            </NavLink>
            <NavLink
              to="/sign-in"
              className="ml-0.5 inline-flex items-center justify-center rounded-full bg-bw-red-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-bw-red-900/25 ring-1 ring-white/10 transition hover:bg-bw-red-600 hover:shadow-lg sm:ml-1"
            >
              Sign in
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  )
}
