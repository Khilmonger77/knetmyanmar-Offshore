import { customerFetch } from './authApi'
import { getApiBase } from './apiBase'
import type { KycSubmission } from '../types/kyc'

export type CustomerKycSummary = Pick<
  KycSubmission,
  'id' | 'status' | 'createdAt' | 'decidedAt' | 'decisionNote'
>

async function readJsonResponse<T>(r: Response): Promise<T> {
  const text = await r.text()
  if (!text.trim()) {
    throw new Error(
      r.status === 413 || r.status === 400
        ? 'The upload may be too large for the server. Try smaller images or fewer files.'
        : 'Empty response from server.',
    )
  }
  try {
    return JSON.parse(text) as T
  } catch {
    const hint =
      r.status === 413 || /too large|payload/i.test(text.slice(0, 200))
        ? 'The upload is too large for the server limit. Try smaller images or fewer files.'
        : 'The server did not return JSON (connection or proxy issue). If you are near the 8 MB combined limit, try smaller files.'
    throw new Error(hint)
  }
}

export async function fetchCustomerKycMe(): Promise<CustomerKycSummary | null> {
  const r = await customerFetch(`${getApiBase()}/api/kyc/me`)
  const data = await readJsonResponse<{
    ok?: boolean
    submission?: CustomerKycSummary | null
    error?: string
  }>(r)
  if (!r.ok) {
    throw new Error(data.error ?? 'Could not load KYC status.')
  }
  if (!data.ok) {
    throw new Error(data.error ?? 'Could not load KYC status.')
  }
  return data.submission ?? null
}

export type KycSubmitDocumentInput = {
  kind: string
  fileName: string
  contentType: string
  dataBase64: string
}

export async function submitCustomerKyc(
  documents: KycSubmitDocumentInput[],
): Promise<{ id: string }> {
  const r = await customerFetch(`${getApiBase()}/api/kyc/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documents }),
  })
  const data = await readJsonResponse<{
    ok?: boolean
    item?: { id: string }
    error?: string
  }>(r)
  if (!r.ok || !data.ok || !data.item?.id) {
    throw new Error(data.error ?? 'Upload failed.')
  }
  return { id: data.item.id }
}
