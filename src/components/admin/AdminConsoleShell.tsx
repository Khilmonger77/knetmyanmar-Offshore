import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { clearAdminToken } from '../../lib/adminApi'
import { AdminConsoleSidebar } from './AdminConsoleSidebar'
import {
  IconArrows,
  IconBell,
  IconLayout,
  IconSearch,
} from './AdminConsoleSidebarIcons'

const mobileNavClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex min-w-0 flex-1 basis-0 flex-col items-center gap-1 border-b-2 py-3 text-[10px] font-bold uppercase tracking-wide transition',
    isActive
      ? 'border-[#3b82f6] text-white'
      : 'border-transparent text-slate-500 hover:text-slate-300',
  ].join(' ')

export function AdminConsoleShell({
  title,
  subtitle,
  breadcrumb,
  children,
  footer,
  headerAside,
  mainMaxClass = 'max-w-[1600px]',
}: {
  title: string
  subtitle?: ReactNode
  breadcrumb?: string
  children: ReactNode
  footer?: ReactNode
  headerAside?: ReactNode
  mainMaxClass?: string
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [globalSearch, setGlobalSearch] = useState('')

  useEffect(() => {
    if (location.pathname === '/admin/search') {
      // Mirror ?q= from the URL into the header field when navigating to operator search.
      queueMicrotask(() => {
        setGlobalSearch(searchParams.get('q') ?? '')
      })
    }
  }, [location.pathname, searchParams])

  function submitGlobalSearch(e: FormEvent) {
    e.preventDefault()
    const raw = globalSearch.trim()
    navigate(
      raw
        ? `/admin/search?q=${encodeURIComponent(raw)}`
        : '/admin/search',
    )
  }

  function signOut() {
    clearAdminToken()
    navigate('/admin/login', { replace: true })
  }

  const crumb = breadcrumb ?? title

  return (
    <div className="min-h-screen min-h-dvh bg-[#121417] text-white antialiased">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.08),transparent_50%)]"
        aria-hidden
      />

      <div className="relative flex min-h-screen min-h-dvh min-w-0">
        <AdminConsoleSidebar onSignOut={signOut} />

        <div className="flex min-h-screen min-h-dvh min-w-0 flex-1 flex-col">
          <div className="border-b border-[#2a2f3a] bg-[#161a20] lg:hidden">
            <div className="flex">
              <NavLink to="/admin" end className={mobileNavClass}>
                <IconLayout className="h-5 w-5 text-[#3b82f6]" />
                Home
              </NavLink>
              <NavLink to="/admin/transactions" className={mobileNavClass}>
                <IconArrows className="h-5 w-5 text-[#3b82f6]" />
                Queue
              </NavLink>
              <NavLink to="/admin/search" className={mobileNavClass}>
                <IconSearch className="h-5 w-5 text-[#3b82f6]" />
                Search
              </NavLink>
            </div>
            <div className="flex items-center justify-end gap-4 border-t border-[#2a2f3a] px-4 py-2">
              <Link
                to="/"
                className="text-xs font-semibold text-slate-500 hover:text-white"
              >
                Site
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="text-xs font-semibold text-slate-500 hover:text-white"
              >
                Out
              </button>
            </div>
          </div>

          <header className="border-b border-[#2a2f3a] bg-[#121417]/95 px-4 py-5 backdrop-blur-md sm:px-8">
            <div
              className={['mx-auto w-full min-w-0 space-y-4', mainMaxClass].join(
                ' ',
              )}
            >
              <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
                <div className="min-w-0 max-w-full md:max-w-2xl">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {crumb}
                  </p>
                  <h1 className="mt-1 break-words font-display text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
                    {title}
                  </h1>
                  {subtitle ? (
                    <div className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
                      {subtitle}
                    </div>
                  ) : null}
                </div>
                {headerAside ? (
                  <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2 md:justify-end">
                    {headerAside}
                  </div>
                ) : null}
              </div>

              <div className="flex min-w-0 w-full flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
                <form
                  onSubmit={(e) => void submitGlobalSearch(e)}
                  className="flex min-w-0 w-full flex-1 flex-col gap-2 sm:flex-row sm:items-center"
                >
                  <div className="relative min-w-0 w-full sm:flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      <IconSearch className="h-4 w-4" />
                    </span>
                    <input
                      type="search"
                      name="admin-global-search"
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                      placeholder="Search customers & approvals…"
                      autoComplete="off"
                      className="box-border min-h-[2.5rem] w-full min-w-0 rounded-lg border border-[#2a2f3a] bg-[#1c1f26] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#3b82f6]/50 focus:ring-2 focus:ring-[#3b82f6]/20"
                      aria-label="Search customers and approvals"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-[2.5rem] w-full shrink-0 rounded-lg bg-[#3b82f6] px-4 text-sm font-semibold text-white hover:bg-[#2563eb] sm:h-auto sm:w-auto sm:self-center sm:py-2.5"
                  >
                    Search
                  </button>
                </form>
                <div className="flex shrink-0 items-center justify-end gap-2 self-stretch sm:self-center">
                  <Link
                    to="/admin/support"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#2a2f3a] bg-[#1c1f26] text-slate-400 transition hover:border-[#3b82f6]/40 hover:text-white"
                    aria-label="Support and alerts"
                  >
                    <IconBell />
                  </Link>
                  <div className="flex h-10 items-center gap-2 rounded-lg border border-[#2a2f3a] bg-[#1c1f26] py-1.5 pl-2 pr-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3b82f6]/25 text-xs font-bold text-[#93c5fd]">
                      OP
                    </div>
                    <div className="hidden min-w-0 text-left sm:block">
                      <p className="truncate text-xs font-semibold text-white">
                        Operator
                      </p>
                      <p className="truncate text-[10px] text-slate-500">
                        Admin session
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main
            className={[
              'mx-auto min-h-0 w-full min-w-0 flex-1 px-4 py-8 sm:px-8',
              footer
                ? 'pb-[calc(11rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(9.5rem+env(safe-area-inset-bottom,0px))]'
                : 'pb-10',
              mainMaxClass,
            ].join(' ')}
          >
            {children}
          </main>

          {footer}
        </div>
      </div>
    </div>
  )
}

export {
  ADMIN_CONSOLE_SIDEBAR_LEFT_CLASS,
  ADMIN_CONSOLE_SIDEBAR_PX,
} from './adminSidebarNav'
