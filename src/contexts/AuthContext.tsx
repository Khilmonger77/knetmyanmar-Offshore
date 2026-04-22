import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  ApiPatchProfileInput,
  AuthUser,
  OnlineBankingAccessBlockPayload,
} from '../lib/authApi'
import {
  apiConfirmEmailChange,
  apiLogin,
  apiLogout,
  apiMe,
  apiPatchEmailOtp,
  apiPatchPassword,
  apiPatchProfile,
  apiPatchTransactionPin,
  apiRegister,
  apiStartEmailChange,
  apiVerifyLoginCode,
} from '../lib/authApi'
import { clearOpenAccountKycPending } from '../lib/openAccountSession'

type AuthContextValue = {
  isBootstrapping: boolean
  isSignedIn: boolean
  user: AuthUser | null
  /** Present when online banking was frozen by the bank — customer must contact support by email. */
  accessBlock: OnlineBankingAccessBlockPayload | null
  clearAccessBlock: () => void
  displayName: string
  email: string
  signIn: (
    loginIdOrEmail: string,
    password: string,
  ) => Promise<
    | { ok: true; next: 'app' }
    | {
        ok: true
        next: 'mfa'
        loginChallengeId: string
        maskedEmail: string | null
        otpResendsRemaining: number
      }
    | { ok: false; error: string }
  >
  verifyLoginOtp: (
    loginChallengeId: string,
    code: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  updateEmailOtp: (enabled: boolean, password: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  register: (
    email: string,
    password: string,
    displayName: string,
    openAccountInterest?: string[],
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  signOut: () => Promise<void>
  /** Display name only (email uses verification codes). */
  updateProfile: (patch: ApiPatchProfileInput) => Promise<void>
  startEmailChange: (
    newEmail: string,
    password: string,
  ) => Promise<{ emailChangeChallengeId: string; maskedEmail: string | null }>
  confirmEmailChange: (
    emailChangeChallengeId: string,
    code: string,
  ) => Promise<void>
  updateDisplayName: (name: string) => Promise<void>
  updateTransactionPin: (password: string, newPin: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessBlock, setAccessBlock] =
    useState<OnlineBankingAccessBlockPayload | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const m = await apiMe()
      if (!cancelled) {
        if (m.status === 'restricted') {
          setUser(null)
          setAccessBlock({
            error: m.error,
            supportEmail: m.supportEmail,
          })
        } else if (m.status === 'signed_in') {
          setAccessBlock(null)
          setUser(m.user)
        } else {
          setAccessBlock(null)
          setUser(null)
        }
        setIsBootstrapping(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function onRestricted(ev: Event) {
      const detail = (ev as CustomEvent<OnlineBankingAccessBlockPayload>).detail
      setUser(null)
      setAccessBlock({
        error: detail.error,
        supportEmail: detail.supportEmail,
      })
    }
    window.addEventListener('bw-online-banking-restricted', onRestricted)
    return () =>
      window.removeEventListener('bw-online-banking-restricted', onRestricted)
  }, [])

  const clearAccessBlock = useCallback(() => {
    setAccessBlock(null)
  }, [])

  const signIn = useCallback(async (loginIdOrEmail: string, password: string) => {
    const res = await apiLogin(loginIdOrEmail, password)
    if (!res.ok) {
      if (res.accessBlock) setAccessBlock(res.accessBlock)
      return res
    }
    setAccessBlock(null)
    if (res.login.next === 'app') {
      setUser(res.login.user)
      return { ok: true as const, next: 'app' as const }
    }
    return {
      ok: true as const,
      next: 'mfa' as const,
      loginChallengeId: res.login.loginChallengeId,
      maskedEmail: res.login.maskedEmail,
      otpResendsRemaining: res.login.otpResendsRemaining,
    }
  }, [])

  const verifyLoginOtp = useCallback(
    async (loginChallengeId: string, code: string) => {
      const res = await apiVerifyLoginCode(loginChallengeId, code)
      if (!res.ok) {
        if (res.accessBlock) setAccessBlock(res.accessBlock)
        return res
      }
      setAccessBlock(null)
      setUser(res.user)
      return { ok: true as const }
    },
    [],
  )

  const updateEmailOtp = useCallback(
    async (enabled: boolean, password: string) => {
      const next = await apiPatchEmailOtp(enabled, password)
      setUser(next)
    },
    [],
  )

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const next = await apiPatchPassword(currentPassword, newPassword)
      setUser(next)
    },
    [],
  )

  const register = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      openAccountInterest?: string[],
    ) => {
      const res = await apiRegister(email, password, displayName, openAccountInterest)
      if (!res.ok) return res
      setAccessBlock(null)
      setUser(res.user)
      return { ok: true as const }
    },
    [],
  )

  const signOut = useCallback(async () => {
    await apiLogout()
    clearOpenAccountKycPending()
    setAccessBlock(null)
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (patch: ApiPatchProfileInput) => {
    const next = await apiPatchProfile(patch)
    setUser(next)
  }, [])

  const startEmailChange = useCallback(
    async (newEmail: string, password: string) => {
      return apiStartEmailChange(newEmail, password)
    },
    [],
  )

  const confirmEmailChange = useCallback(
    async (emailChangeChallengeId: string, code: string) => {
      const next = await apiConfirmEmailChange(emailChangeChallengeId, code)
      setUser(next)
    },
    [],
  )

  const updateDisplayName = useCallback(
    async (name: string) => {
      await updateProfile({ displayName: name })
    },
    [updateProfile],
  )

  const updateTransactionPin = useCallback(
    async (password: string, newPin: string) => {
      const next = await apiPatchTransactionPin(password, newPin)
      setUser(next)
    },
    [],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      isBootstrapping,
      isSignedIn: Boolean(user),
      user,
      accessBlock,
      clearAccessBlock,
      displayName: user?.displayName ?? '',
      email: user?.email ?? '',
      signIn,
      verifyLoginOtp,
      updateEmailOtp,
      changePassword,
      register,
      signOut,
      updateProfile,
      startEmailChange,
      confirmEmailChange,
      updateDisplayName,
      updateTransactionPin,
    }),
    [
      isBootstrapping,
      user,
      accessBlock,
      clearAccessBlock,
      signIn,
      verifyLoginOtp,
      updateEmailOtp,
      changePassword,
      register,
      signOut,
      updateProfile,
      startEmailChange,
      confirmEmailChange,
      updateDisplayName,
      updateTransactionPin,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook paired with provider
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
