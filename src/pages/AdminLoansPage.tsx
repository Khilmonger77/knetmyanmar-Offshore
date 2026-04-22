import { Link, Navigate } from 'react-router-dom'
import { AdminConsoleShell } from '../components/admin/AdminConsoleShell'
import { getAdminToken } from '../lib/adminApi'

export function AdminLoansPage() {
  if (!getAdminToken()) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <AdminConsoleShell
      title="Loans"
      breadcrumb="Products"
      subtitle="Retail loan applications and servicing — this screen is a shell until a loan module is connected."
    >
      <div className="max-w-2xl space-y-4 rounded-xl border border-[#2a2f3a] bg-[#1c1f26] p-6">
        <p className="text-sm leading-relaxed text-slate-300">
          Customer-submitted <strong className="text-white">loan_application</strong>{' '}
          requests still flow through the standard approval queue today. Approve
          or reject them there; balances and product records update when the
          server applies the decision.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/transactions"
            className="rounded-lg bg-[#3b82f6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2563eb]"
          >
            Open approval queue
          </Link>
          <Link
            to="/admin"
            className="rounded-lg border border-[#2a2f3a] bg-[#121417] px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-[#3b82f6]/35"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </AdminConsoleShell>
  )
}
