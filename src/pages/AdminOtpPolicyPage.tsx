import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AdminConsoleShell } from '../components/admin/AdminConsoleShell'
import {
  clearAdminOtpPolicy,
  fetchAdminOtpPolicy,
  getAdminToken,
  saveAdminOtpPolicy,
  type AdminOtpPolicySnapshot,
  type OtpPolicyFlags,
} from '../lib/adminApi'

function sameFlags(a: OtpPolicyFlags, b: OtpPolicyFlags) {
  return (
    a.skipLoginEmailOtp === b.skipLoginEmailOtp &&
    a.requireLoginEmailOtp === b.requireLoginEmailOtp &&
    a.skipWireEmailOtp === b.skipWireEmailOtp
  )
}

function PolicySwitch({
  checked,
  onChange,
  id,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  id: string
  label: string
  description?: string
  disabled?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#2a2f3a] py-4 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white" id={`${id}-label`}>
          {label}
        </p>
        {description ? (
          <p className="mt-1 text-sm text-white/55">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        id={id}
        disabled={disabled}
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        onClick={() => onChange(!checked)}
        className={[
          'relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0e12]',
          disabled ? 'cursor-not-allowed opacity-45' : '',
          checked ? 'bg-[#2563eb]' : 'bg-[#3f4654]',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
          aria-hidden
        />
      </button>
    </div>
  )
}

export function AdminOtpPolicyPage() {
  const [snapshot, setSnapshot] = useState<AdminOtpPolicySnapshot | null>(null)
  const [draft, setDraft] = useState<OtpPolicyFlags | null>(null)
  const [loadErr, setLoadErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [saveOk, setSaveOk] = useState('')

  const load = useCallback(async () => {
    setLoadErr('')
    const snap = await fetchAdminOtpPolicy()
    setSnapshot(snap)
    setDraft(snap.effective)
  }, [])

  useEffect(() => {
    if (!getAdminToken()) return
    void load().catch((e) =>
      setLoadErr(e instanceof Error ? e.message : 'Load failed.'),
    )
  }, [load])

  const dirty = useMemo(() => {
    if (!snapshot || !draft) return false
    return !sameFlags(draft, snapshot.effective)
  }, [draft, snapshot])

  const requireDisabled = draft?.skipLoginEmailOtp === true

  async function onSave() {
    if (!draft) return
    setBusy(true)
    setSaveErr('')
    setSaveOk('')
    try {
      const next = await saveAdminOtpPolicy(draft)
      setSnapshot(next)
      setDraft(next.effective)
      setSaveOk('Saved. Changes apply immediately for new requests.')
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setBusy(false)
    }
  }

  async function onResetToEnv() {
    setBusy(true)
    setSaveErr('')
    setSaveOk('')
    try {
      const next = await clearAdminOtpPolicy()
      setSnapshot(next)
      setDraft(next.effective)
      setSaveOk('Removed saved policy. The API now follows server/.env.')
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Reset failed.')
    } finally {
      setBusy(false)
    }
  }

  if (!getAdminToken()) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <AdminConsoleShell
      title="OTP policy"
      breadcrumb="Bank admin"
      subtitle="Turn sign-in and wire email verification on or off without editing server/.env. Saving writes server/data/otp-policy.json and overrides REQUIRE_LOGIN_EMAIL_OTP, SKIP_LOGIN_EMAIL_OTP, and SKIP_WIRE_EMAIL_OTP until you reset."
    >
      {loadErr ? (
        <div className="max-w-xl rounded-2xl border border-red-500/25 bg-red-950/30 p-6">
          <h2 className="font-display text-lg font-semibold text-red-100">
            Could not load policy
          </h2>
          <p className="mt-2 text-sm text-red-200/80">{loadErr}</p>
        </div>
      ) : !draft || !snapshot ? (
        <div className="animate-pulse space-y-4">
          <div className="h-40 rounded-xl bg-[#1c1f26]" />
        </div>
      ) : (
        <div className="mx-auto max-w-2xl space-y-6">
          {snapshot.persistedFileInvalid ? (
            <div className="rounded-xl border border-amber-500/35 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/90">
              <strong className="font-semibold">Invalid otp-policy.json.</strong>{' '}
              The API is using server/.env until you click &quot;Use .env defaults&quot;
              or save a new policy.
            </div>
          ) : null}

          {snapshot.persistedFile ? (
            <div className="rounded-xl border border-[#3b82f6]/25 bg-[#172554]/25 px-4 py-3 text-sm text-sky-100/90">
              Active settings are loaded from{' '}
              <code className="rounded bg-black/30 px-1 py-0.5 text-xs">
                server/data/otp-policy.json
              </code>
              . Env defaults below show what server/.env would apply if that file were
              removed.
            </div>
          ) : (
            <div className="rounded-xl border border-[#2a2f3a] bg-[#121417] px-4 py-3 text-sm text-white/65">
              No saved policy file — the API follows{' '}
              <code className="rounded bg-black/30 px-1 py-0.5 text-xs">
                REQUIRE_LOGIN_EMAIL_OTP
              </code>
              ,{' '}
              <code className="rounded bg-black/30 px-1 py-0.5 text-xs">
                SKIP_LOGIN_EMAIL_OTP
              </code>
              , and{' '}
              <code className="rounded bg-black/30 px-1 py-0.5 text-xs">
                SKIP_WIRE_EMAIL_OTP
              </code>{' '}
              in server/.env. Save below to override without restarting.
            </div>
          )}

          <section className="rounded-2xl border border-[#2a2f3a] bg-[#121417] px-5 py-2 shadow-inner shadow-black/25">
            <PolicySwitch
              id="otp-skip-login"
              checked={draft.skipLoginEmailOtp}
              onChange={(next) =>
                setDraft((d) =>
                  d ? { ...d, skipLoginEmailOtp: next } : d,
                )
              }
              label="Bypass sign-in email OTP for everyone"
              description="Maps to SKIP_LOGIN_EMAIL_OTP. Use for emergencies or environments without SMTP. When on, login never asks for an email code."
              disabled={busy}
            />
            <PolicySwitch
              id="otp-require-login"
              checked={draft.requireLoginEmailOtp}
              onChange={(next) =>
                setDraft((d) =>
                  d ? { ...d, requireLoginEmailOtp: next } : d,
                )
              }
              label="Require sign-in email OTP for all customers"
              description="Maps to REQUIRE_LOGIN_EMAIL_OTP. After password, every customer gets a code when SMTP works (unless bypass above is on)."
              disabled={busy || requireDisabled}
            />
            <PolicySwitch
              id="otp-skip-wire"
              checked={draft.skipWireEmailOtp}
              onChange={(next) =>
                setDraft((d) =>
                  d ? { ...d, skipWireEmailOtp: next } : d,
                )
              }
              label="Bypass wire transfer email OTP"
              description="Maps to SKIP_WIRE_EMAIL_OTP. Skips sending and entering a code before wire approvals."
              disabled={busy}
            />
          </section>

          {requireDisabled ? (
            <p className="text-sm text-amber-200/80">
              Sign-in bypass is on — &quot;require for all customers&quot; has no effect
              until bypass is turned off.
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busy || !dirty}
              onClick={() => void onSave()}
              className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow shadow-black/20 transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save to server
            </button>
            <button
              type="button"
              disabled={
                busy ||
                (!snapshot.persistedFile && !snapshot.persistedFileInvalid)
              }
              onClick={() => void onResetToEnv()}
              className="rounded-lg border border-[#3f4654] bg-transparent px-4 py-2 text-sm font-medium text-white/85 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Use .env defaults (delete saved file)
            </button>
          </div>

          {saveErr ? (
            <p className="text-sm text-red-300/90">{saveErr}</p>
          ) : null}
          {saveOk ? (
            <p className="text-sm text-emerald-300/90">{saveOk}</p>
          ) : null}

          <section className="rounded-2xl border border-[#2a2f3a] bg-[#0c0e12] px-5 py-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Current values from server/.env (reference)
            </h3>
            <dl className="mt-3 grid gap-2 text-sm text-white/75">
              <div className="flex justify-between gap-4">
                <dt>SKIP_LOGIN_EMAIL_OTP</dt>
                <dd className="font-mono text-xs text-white/90">
                  {snapshot.envDefaults.skipLoginEmailOtp ? 'on' : 'off'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>REQUIRE_LOGIN_EMAIL_OTP</dt>
                <dd className="font-mono text-xs text-white/90">
                  {snapshot.envDefaults.requireLoginEmailOtp ? 'on' : 'off'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>SKIP_WIRE_EMAIL_OTP</dt>
                <dd className="font-mono text-xs text-white/90">
                  {snapshot.envDefaults.skipWireEmailOtp ? 'on' : 'off'}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-white/45">
              Editing .env still requires an API restart to take effect. The saved JSON
              file overrides these env flags until you reset.
            </p>
          </section>
        </div>
      )}
    </AdminConsoleShell>
  )
}
