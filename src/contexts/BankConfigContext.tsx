import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import rawDefaults from '../data/bank.defaults.json'
import { getApiBase } from '../lib/apiBase'
import type { BankConfig } from '../types/bankConfig'

const FALLBACK = rawDefaults as BankConfig

const BankConfigContext = createContext<BankConfig>(FALLBACK)

export function BankConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<BankConfig>(FALLBACK)
  /** Avoid showing bundled default `bankName` in the tab before `/api/public/bank-config` loads. */
  const [bankConfigHydrated, setBankConfigHydrated] = useState(false)

  const reload = useCallback(() => {
    const base = getApiBase()
    fetch(`${base}/api/public/bank-config`, { cache: 'no-store' })
      .then(async (r) => {
        const ct = r.headers.get('content-type') ?? ''
        if (!r.ok || !ct.includes('application/json')) {
          throw new Error(`bank-config HTTP ${r.status}`)
        }
        return r.json() as Promise<{ ok?: boolean; config?: BankConfig }>
      })
      .then((data) => {
        if (data?.ok && data.config) {
          setConfig(data.config)
          setBankConfigHydrated(true)
        }
      })
      .catch(() => {
        if (import.meta.env.PROD && !String(getApiBase()).trim()) {
          console.warn(
            '[bywells] Could not load /api/public/bank-config. When the SPA is hosted separately (e.g. Netlify), set VITE_API_BASE to your API origin at build time and redeploy.',
          )
        }
      })
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    window.addEventListener('bank-config-updated', reload)
    return () => window.removeEventListener('bank-config-updated', reload)
  }, [reload])

  useEffect(() => {
    if (!bankConfigHydrated) return
    const short = String(config.bankNameShort ?? '').trim()
    const full = String(config.bankName ?? '').trim()
    const tabTitle = short || full
    if (tabTitle) document.title = tabTitle
  }, [bankConfigHydrated, config.bankName, config.bankNameShort])

  useEffect(() => {
    const t = config.theme
    const r = document.documentElement
    r.style.setProperty('--color-bw-navy-950', t.navy950)
    r.style.setProperty('--color-bw-navy-900', t.navy900)
    r.style.setProperty('--color-bw-navy-800', t.navy800)
    r.style.setProperty('--color-bw-blue-600', t.blue600)
    r.style.setProperty('--color-bw-blue-500', t.blue500)
    r.style.setProperty('--color-bw-sky-100', t.sky100)
    r.style.setProperty('--color-bw-red-800', t.red800)
    r.style.setProperty('--color-bw-red-700', t.red700)
    r.style.setProperty('--color-bw-red-600', t.red600)
    r.style.setProperty('--color-bw-sand-100', t.sand100)
    r.style.setProperty('--color-bw-sand-200', t.sand200)
    r.style.setProperty('--color-bw-muted', t.muted)
  }, [config.theme])

  return (
    <BankConfigContext.Provider value={config}>
      {children}
    </BankConfigContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- hook paired with provider
export function useBankConfig(): BankConfig {
  return useContext(BankConfigContext)
}
