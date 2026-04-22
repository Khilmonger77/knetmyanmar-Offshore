import { useState, type FormEvent } from 'react'
import type { KycDocumentKind } from '../types/kyc'
import { submitCustomerKyc } from '../lib/kycCustomerApi'

const MAX_TOTAL_BYTES = 8 * 1024 * 1024

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => {
      const raw = String(fr.result ?? '')
      const idx = raw.indexOf('base64,')
      resolve(idx >= 0 ? raw.slice(idx + 7) : raw)
    }
    fr.onerror = () => reject(new Error('Could not read file.'))
    fr.readAsDataURL(file)
  })
}

type SlotKey = 'id_front' | 'id_back' | 'proof_of_address' | 'other'

const SLOTS: Array<{
  key: SlotKey
  label: string
  required?: boolean
}> = [
  { key: 'id_front', label: 'Government ID — front', required: true },
  { key: 'id_back', label: 'Government ID — back' },
  { key: 'proof_of_address', label: 'Proof of address' },
  { key: 'other', label: 'Other supporting document' },
]

export function KycDocumentSlotsForm({
  disabled = false,
  onSuccess,
  submitLabel = 'Submit for review',
  heading = 'Upload documents',
}: {
  disabled?: boolean
  onSuccess?: (submissionId: string) => void | Promise<void>
  submitLabel?: string
  heading?: string
}) {
  const [files, setFiles] = useState<Partial<Record<SlotKey, File | null>>>({})
  const [busy, setBusy] = useState(false)
  const [formErr, setFormErr] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormErr('')
    const docs: Array<{
      kind: KycDocumentKind
      fileName: string
      contentType: string
      dataBase64: string
    }> = []
    let total = 0
    const idFront = files.id_front
    if (!idFront || idFront.size === 0) {
      setFormErr('ID front image is required.')
      return
    }
    for (const { key } of SLOTS) {
      const f = files[key]
      if (!f || f.size === 0) continue
      total += f.size
      if (total > MAX_TOTAL_BYTES) {
        setFormErr('Total size of selected files must be under 8 MB.')
        return
      }
      const dataBase64 = await fileToBase64(f)
      docs.push({
        kind: key,
        fileName: f.name || 'upload',
        contentType: f.type || 'application/octet-stream',
        dataBase64,
      })
    }
    if (docs.length === 0) {
      setFormErr('Add at least one file.')
      return
    }
    setBusy(true)
    try {
      const { id } = await submitCustomerKyc(docs)
      setFiles({})
      await onSuccess?.(id)
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={(ev) => void onSubmit(ev)}
      className="max-w-xl space-y-6 rounded-2xl border border-bw-sand-200 bg-white p-6 shadow-bw-soft"
    >
      <h2 className="text-lg font-semibold text-bw-navy-900">{heading}</h2>
      <ul className="space-y-5">
        {SLOTS.map(({ key, label, required }) => (
          <li key={key}>
            <label className="block">
              <span className="text-sm font-medium text-bw-navy-900">
                {label}
                {required ? (
                  <span className="text-bw-red-600"> *</span>
                ) : null}
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                disabled={busy || disabled}
                onChange={(ev) => {
                  const f = ev.target.files?.[0] ?? null
                  setFiles((prev) => ({ ...prev, [key]: f }))
                }}
                className="mt-2 block w-full text-sm text-bw-muted file:mr-4 file:rounded-lg file:border-0 file:bg-bw-navy-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-bw-navy-800 disabled:opacity-50"
              />
            </label>
          </li>
        ))}
      </ul>
      <p className="text-xs text-bw-muted">
        JPEG, PNG, or PDF. Combined uploads must stay under 8 MB (up to six
        files on the server).
      </p>
      {formErr ? (
        <p className="text-sm text-bw-red-700" role="alert">
          {formErr}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy || disabled}
        className="rounded-lg bg-bw-navy-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-bw-navy-800 disabled:opacity-50"
      >
        {busy ? 'Uploading…' : submitLabel}
      </button>
    </form>
  )
}
