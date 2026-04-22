import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AdminBankDepositsFeesPanel } from '../components/admin/AdminBankDepositsFeesPanel'
import { AdminConsoleShell } from '../components/admin/AdminConsoleShell'
import { ADMIN_CONSOLE_SIDEBAR_LEFT_CLASS } from '../components/admin/adminSidebarNav'
import type { BankConfig } from '../types/bankConfig'
import {
  fetchAdminBankConfig,
  getAdminToken,
  saveAdminBankConfig,
} from '../lib/adminApi'

export function AdminDepositsFeesPage() {
  const [draft, setDraft] = useState<BankConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState('')
  const [saveErr, setSaveErr] = useState('')
  const [saveOk, setSaveOk] = useState(false)

  useEffect(() => {
    if (!getAdminToken()) return
    ;(async () => {
      try {
        setDraft(await fetchAdminBankConfig())
      } catch (e) {
        setLoadErr(e instanceof Error ? e.message : 'Could not load config.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (!getAdminToken()) {
    return <Navigate to="/admin/login" replace />
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!draft) return
    setSaveErr('')
    setSaveOk(false)
    try {
      const next = await saveAdminBankConfig(draft)
      setDraft(next)
      setSaveOk(true)
      window.setTimeout(() => setSaveOk(false), 5000)
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : 'Save failed.')
    }
  }

  return (
    <AdminConsoleShell
      title="Deposits & fees"
      breadcrumb="Bank configuration"
      subtitle="Incoming deposit policy, per-rail fees, maintenance fee mode, and the outbound wire fee table used when wire approvals execute."
      headerAside={
        <Link
          to="/admin"
          className="rounded-lg border border-[#2a2f3a] bg-[#1c1f26] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-[#3b82f6]/35 hover:text-white"
        >
          Full bank config
        </Link>
      }
      footer={
        draft ? (
          <div
            className={[
              'fixed inset-x-0 bottom-0 z-50 border-t border-[#2a2f3a] bg-[#121417]/95 px-4 pt-4 shadow-[0_-20px_56px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:px-8 sm:pt-4',
              ADMIN_CONSOLE_SIDEBAR_LEFT_CLASS,
            ].join(' ')}
            style={{
              paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
            }}
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                {saveOk ? (
                  <span className="font-medium text-emerald-400/95">
                    Saved successfully. Refresh the public site to pull changes.
                  </span>
                ) : saveErr ? (
                  <span className="text-red-400">{saveErr}</span>
                ) : (
                  <span>
                    Saves the full institution JSON (same as dashboard). Other
                    sections are unchanged.
                  </span>
                )}
              </div>
              <button
                type="submit"
                form="admin-deposits-fees-form"
                className="rounded-lg bg-[#3b82f6] px-8 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-[#1e3a8a]/35 transition hover:bg-[#2563eb]"
              >
                Save changes
              </button>
            </div>
          </div>
        ) : undefined
      }
    >
      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="h-24 rounded-xl bg-[#1c1f26]" />
          <div className="h-72 rounded-xl bg-[#1c1f26]" />
        </div>
      ) : loadErr ? (
        <div className="max-w-xl rounded-2xl border border-red-500/25 bg-red-950/30 p-6">
          <h2 className="font-display text-lg font-semibold text-red-100">
            Could not load config
          </h2>
          <p className="mt-2 text-sm text-red-200/80">{loadErr}</p>
        </div>
      ) : draft ? (
        <form
          id="admin-deposits-fees-form"
          onSubmit={onSave}
          className="pb-[calc(11rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(9.5rem+env(safe-area-inset-bottom,0px))]"
        >
          <AdminBankDepositsFeesPanel
            draft={draft}
            setDraft={setDraft}
            sectionId="admin-deposits-fees"
          />
        </form>
      ) : null}
    </AdminConsoleShell>
  )
}
