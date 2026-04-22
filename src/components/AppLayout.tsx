import { Outlet } from 'react-router-dom'
import { AccountsProvider } from '../contexts/AccountsContext'
import { ApprovalsProvider } from '../contexts/ApprovalsContext'
import { AppHeader } from './AppHeader'

function AppLayoutMain() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-bw-sand-100 via-[#faf8f5] to-bw-sand-200/70">
      <AppHeader />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="rounded-2xl border border-bw-sand-200/90 bg-white/95 p-6 shadow-bw-card backdrop-blur-sm sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export function AppLayout() {
  return (
    <AccountsProvider>
      <ApprovalsProvider>
        <AppLayoutMain />
      </ApprovalsProvider>
    </AccountsProvider>
  )
}
