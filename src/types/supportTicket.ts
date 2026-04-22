export type SupportTicketStatus = 'open' | 'pending' | 'resolved'

export type SupportMessageAuthor = 'customer' | 'staff'

export type SupportTicketMessage = {
  id: string
  authorType: SupportMessageAuthor
  authorLabel: string
  body: string
  createdAt: string
}

export type SupportTicket = {
  id: string
  userId: string
  customerEmail: string
  customerDisplayName: string
  subject: string
  status: SupportTicketStatus
  assignedTo: string | null
  linkedAccountIds: string[]
  messages: SupportTicketMessage[]
  createdAt: string
  updatedAt: string
}

export type SupportTicketListRow = {
  id: string
  subject: string
  status: SupportTicketStatus
  assignedTo: string | null
  linkedAccountIds: string[]
  createdAt: string
  updatedAt: string
  messageCount: number
  lastPreview: string
}
