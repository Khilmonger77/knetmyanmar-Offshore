import { Navigate } from 'react-router-dom'

/** @deprecated Use `/admin/transactions` — kept for bookmarks. */
export function AdminApprovalsPage() {
  return <Navigate to="/admin/transactions" replace />
}
