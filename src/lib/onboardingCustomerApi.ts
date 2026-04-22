import { customerFetch } from './authApi'
import { getApiBase } from './apiBase'

export type CustomerOnboardingStatus = {
  interests: string[]
  needsBusinessProfile: boolean
  businessProfile: {
    legalName: string
    tradeName?: string
    capturedAt?: string
  } | null
  status: string
  updatedAt: string | null
}

export async function fetchCustomerOnboarding(): Promise<CustomerOnboardingStatus> {
  const r = await customerFetch(`${getApiBase()}/api/auth/onboarding`)
  const data = (await r.json()) as {
    ok?: boolean
    onboarding?: CustomerOnboardingStatus
    error?: string
  }
  if (!r.ok || !data.ok || !data.onboarding) {
    throw new Error(data.error ?? 'Could not load onboarding status.')
  }
  return data.onboarding
}

export async function patchCustomerBusinessOnboarding(input: {
  legalName: string
  tradeName?: string
}): Promise<CustomerOnboardingStatus> {
  const r = await customerFetch(`${getApiBase()}/api/auth/onboarding-business`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = (await r.json()) as {
    ok?: boolean
    onboarding?: CustomerOnboardingStatus
    error?: string
  }
  if (!r.ok || !data.ok || !data.onboarding) {
    throw new Error(data.error ?? 'Could not save business details.')
  }
  return data.onboarding
}
