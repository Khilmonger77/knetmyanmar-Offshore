export type KycDocumentKind =
  | 'id_front'
  | 'id_back'
  | 'proof_of_address'
  | 'other'

export type KycDocument = {
  id: string
  kind: KycDocumentKind
  fileName: string
  uploadedAt: string
  contentType: string
  bytesApprox: number
  /** Present when the server saved bytes under server/data/ */
  storagePath?: string
}

export type KycStatus = 'pending' | 'approved' | 'rejected'

export type KycRiskLevel = 'low' | 'standard' | 'elevated' | 'high'

export type KycSubmission = {
  id: string
  userId: string
  customerEmail: string
  customerDisplayName: string
  status: KycStatus
  riskLevel: KycRiskLevel
  documentExpiresAt: string | null
  complianceNotes: string
  documents: KycDocument[]
  createdAt: string
  decidedAt: string | null
  decisionNote: string | null
}
