export type WhatsAppInboxParticipantType =
  | "job_seeker"
  | "employer"
  | "both"
  | "unknown";

export type WhatsAppInboxFilterType = "all" | "job_seeker" | "employer";

export type WhatsAppInboxMessageDirection = "inbound" | "outbound";

export type WhatsAppInboxSenderType = "user" | "bot" | "admin" | "notification";

export type WhatsAppInboxMessageStatus =
  | "pending"
  | "accepted"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export interface WhatsAppInboxConversation {
  id: string;
  phoneNational: string;
  phoneDisplay: string;
  displayName: string;
  participantType: WhatsAppInboxParticipantType;
  participantLabel: string;
  filterType: "job_seeker" | "employer" | "unknown";
  jobSeekerId: string | null;
  employerId: string | null;
  avatarUrl: string;
  lastMessageAt: string | null;
  lastMessagePreview: string;
  lastMessageDirection: string;
  unreadCount: number;
  lastInboundAt: string | null;
  serviceWindow: "open" | "expired" | "none";
  canSendFreeForm: boolean;
  botPaused: boolean;
}

export interface WhatsAppInboxMessage {
  id: string;
  direction: WhatsAppInboxMessageDirection;
  senderType: WhatsAppInboxSenderType;
  body: string;
  messageType: string;
  status: WhatsAppInboxMessageStatus;
  failureReason: string;
  createdAt: string;
  statusAt: string | null;
}

export interface WhatsAppInboxConversationsResult {
  items: WhatsAppInboxConversation[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface WhatsAppInboxMessagesResult {
  items: WhatsAppInboxMessage[];
  hasMore: boolean;
  nextBefore: string | null;
}

export interface WhatsAppInboxContactDetails {
  kind: "job_seeker" | "employer" | "both" | "unknown";
  displayName: string;
  phoneDisplay: string;
  phoneNational: string;
  profileId: string | null;
  jobSeekerId: string | null;
  employerId: string | null;
  avatarUrl: string;
  location: string;
  contactPerson?: string;
  jobRole?: string;
  education?: string;
  experience?: string;
  verificationStatus?: string;
  profileStatus: string;
  recentApplications?: Array<{
    id: string;
    title: string;
    companyName: string;
    status: string;
    appliedAt: string | null;
  }>;
  recentJobs?: Array<{
    id: string;
    title: string;
    status: string;
    city: string;
    createdAt: string | null;
  }>;
}

export interface WhatsAppInboxSendResult {
  message: WhatsAppInboxMessage;
  conversation: WhatsAppInboxConversation;
  duplicated: boolean;
}

export interface WhatsAppInboxContact {
  accountId: string;
  participantType: "job_seeker" | "employer";
  displayName: string;
  phoneNational: string;
  phoneDisplay: string;
  location: string;
  statusLabel: string;
  avatarUrl: string;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface WhatsAppInboxContactsResult {
  items: WhatsAppInboxContact[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface WhatsAppInboxListParams {
  page: number;
  limit: number;
  search: string;
  participantType: WhatsAppInboxFilterType;
}
