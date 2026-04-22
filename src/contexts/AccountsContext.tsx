import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  dismissReplacementBannerApi,
  fetchBankingState,
} from '../lib/bankingApi'
import { useAuth } from './AuthContext'
import type { OnlineBankingAccessRestriction } from '../types/accessRestriction'
import type {
  AccountRow,
  ActivityRow,
  BankingSnapshot,
  DebitCardInfo,
  ScheduledBillPayment,
} from '../types/banking'

export type {
  AccountRow,
  ActivityRow,
  DebitCardInfo,
  ScheduledBillPayment,
} from '../types/banking'

export type AccountsContextValue = {
  accounts: AccountRow[]
  activity: ActivityRow[]
  debitCard: DebitCardInfo
  replacementBanner: string | null
  scheduledBillPayments: ScheduledBillPayment[]
  accessRestriction: OnlineBankingAccessRestriction
  /** True when operator has restricted online banking (fraud / security review). */
  onlineBankingRestricted: boolean
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  /** Merge server banking JSON (e.g. after cancel) and drop stale in-flight refreshes. */
  applyBankingSnapshot: (b: BankingSnapshot) => void
  dismissDebitCardReplacementBanner: () => void
}

const defaultAccess: OnlineBankingAccessRestriction = {
  restricted: false,
  reason: null,
}

const emptyCard: DebitCardInfo = {
  last4: '0000',
  expMonth: 1,
  expYear: 2030,
  locked: false,
  travelNoticeEnabled: false,
  contactlessEnabled: false,
  cardType: 'physical',
  issuedAt: null,
  adminFrozen: false,
  stolenBlocked: false,
  singleTransactionLimitCents: null,
  dailySpendLimitCents: null,
  transactions: [],
}

const AccountsContext = createContext<AccountsContextValue | null>(null)

export function AccountsProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isBootstrapping } = useAuth()
  const bankingFetchGen = useRef(0)
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [scheduledBillPayments, setScheduledBillPayments] = useState<
    ScheduledBillPayment[]
  >([])
  const [debitCard, setDebitCard] = useState<DebitCardInfo>(emptyCard)
  const [replacementBanner, setReplacementBanner] = useState<string | null>(
    null,
  )
  const [accessRestriction, setAccessRestriction] =
    useState<OnlineBankingAccessRestriction>(defaultAccess)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const applyFromBanking = useCallback((b: BankingSnapshot) => {
    setAccounts(b.accounts)
    setActivity(b.activity)
    setScheduledBillPayments(b.scheduledBillPayments)
    setDebitCard(b.debitCard)
    setReplacementBanner(b.replacementBanner)
  }, [])

  const applyBankingSnapshot = useCallback(
    (b: BankingSnapshot) => {
      bankingFetchGen.current += 1
      setError(null)
      applyFromBanking(b)
      setLoading(false)
    },
    [applyFromBanking],
  )

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      bankingFetchGen.current += 1
      setAccounts([])
      setActivity([])
      setScheduledBillPayments([])
      setDebitCard(emptyCard)
      setReplacementBanner(null)
      setAccessRestriction(defaultAccess)
      setLoading(false)
      setError(null)
      return
    }
    const seq = ++bankingFetchGen.current
    setError(null)
    setLoading(true)
    try {
      const { banking, accessRestriction: ar } = await fetchBankingState()
      if (seq !== bankingFetchGen.current) return
      applyFromBanking(banking)
      setAccessRestriction(ar)
    } catch (e) {
      if (seq !== bankingFetchGen.current) return
      setError(e instanceof Error ? e.message : 'Could not load accounts.')
    } finally {
      if (seq === bankingFetchGen.current) setLoading(false)
    }
  }, [isSignedIn, applyFromBanking])

  useEffect(() => {
    if (isBootstrapping) return
    const t = window.setTimeout(() => void refresh(), 0)
    return () => clearTimeout(t)
  }, [isBootstrapping, refresh])

  useEffect(() => {
    if (!isSignedIn || isBootstrapping) return
    const t = setInterval(() => void refresh(), 5_000)
    function onFocus() {
      void refresh()
    }
    function onVis() {
      if (document.visibilityState === 'visible') void refresh()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(t)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [isSignedIn, isBootstrapping, refresh])

  const dismissDebitCardReplacementBanner = useCallback(async () => {
    try {
      const b = await dismissReplacementBannerApi()
      setReplacementBanner(b.replacementBanner)
    } catch {
      setReplacementBanner(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      accounts,
      activity,
      debitCard,
      replacementBanner,
      scheduledBillPayments,
      accessRestriction,
      onlineBankingRestricted: accessRestriction.restricted,
      loading,
      error,
      refresh,
      applyBankingSnapshot,
      dismissDebitCardReplacementBanner,
    }),
    [
      accounts,
      activity,
      debitCard,
      replacementBanner,
      scheduledBillPayments,
      accessRestriction,
      loading,
      error,
      refresh,
      applyBankingSnapshot,
      dismissDebitCardReplacementBanner,
    ],
  )

  return (
    <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- hook paired with provider
export function useAccounts(): AccountsContextValue {
  const ctx = useContext(AccountsContext)
  if (!ctx) throw new Error('useAccounts must be used within AccountsProvider')
  return ctx
}
