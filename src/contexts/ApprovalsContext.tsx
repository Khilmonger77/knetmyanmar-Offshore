import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchMyApprovals, submitApprovalRequest } from '../lib/approvalsApi'
import type { ApprovalItem, SubmitApprovalInput } from '../types/approvals'
import { useAuth } from './AuthContext'

type ApprovalsContextValue = {
  items: ApprovalItem[]
  pendingCount: number
  submitForApproval: (
    input: SubmitApprovalInput,
  ) => Promise<
    | {
        ok: true
        item: ApprovalItem
        depositAutoApplied?: boolean
        bankingAutoApplied?: boolean
      }
    | { ok: false; error: string; item?: ApprovalItem }
  >
  refresh: () => Promise<void>
}

const ApprovalsContext = createContext<ApprovalsContextValue | null>(null)

export function ApprovalsProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isBootstrapping } = useAuth()
  const [items, setItems] = useState<ApprovalItem[]>([])

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setItems([])
      return
    }
    const list = await fetchMyApprovals()
    setItems(list)
  }, [isSignedIn])

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

  const submitForApproval = useCallback(
    async (input: SubmitApprovalInput) => {
      const res = await submitApprovalRequest(input)
      if (res.ok) {
        setItems((prev) => [res.item, ...prev.filter((x) => x.id !== res.item.id)])
      }
      return res
    },
    [],
  )

  const pendingCount = useMemo(
    () => items.filter((i) => i.status === 'pending').length,
    [items],
  )

  const value = useMemo(
    () => ({
      items,
      pendingCount,
      submitForApproval,
      refresh,
    }),
    [items, pendingCount, submitForApproval, refresh],
  )

  return (
    <ApprovalsContext.Provider value={value}>{children}</ApprovalsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- hook paired with provider
export function useApprovals(): ApprovalsContextValue {
  const ctx = useContext(ApprovalsContext)
  if (!ctx) throw new Error('useApprovals must be used within ApprovalsProvider')
  return ctx
}
