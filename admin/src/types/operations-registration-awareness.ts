export type OperationsRegistrationAwarenessState = "new" | "seen";

export type OperationsRegistrationEntityType = "employer" | "candidate";

export type OperationsRegistrationNotificationType =
  | "employer.registered"
  | "candidate.registered";

export type OperationsNavBadgeKey =
  | "newEmployers"
  | "newCandidates"
  | "pendingJobs"
  | "pendingVerifications"
  | "unreadNotifications";

export interface OperationsNavBadgeCounts {
  newEmployers: number | null;
  newCandidates: number | null;
  pendingJobs: number | null;
  pendingVerifications: number | null;
  unreadNotifications: number;
}

export interface OperationsRegistrationMetricBlock {
  newCount: number;
  today: number;
  thisWeek: number;
}

export interface OperationsRecentEmployerRegistration {
  id: string;
  displayId: string;
  displayName: string;
  registeredAt: string;
  registeredRelative: string;
  verificationStatus: string;
  verificationStatusLabel: string;
  awarenessState: OperationsRegistrationAwarenessState;
  actionPath: string;
}

export interface OperationsRecentCandidateRegistration {
  id: string;
  displayId: string;
  displayName: string;
  registeredAt: string;
  registeredRelative: string;
  profileStatus: string;
  profileStatusLabel: string;
  awarenessState: OperationsRegistrationAwarenessState;
  actionPath: string;
}

export interface OperationsRegistrationMetricsResult {
  employers: OperationsRegistrationMetricBlock | null;
  candidates: OperationsRegistrationMetricBlock | null;
  badges: OperationsNavBadgeCounts;
  recent: {
    employers: OperationsRecentEmployerRegistration[];
    candidates: OperationsRecentCandidateRegistration[];
  };
}

export interface OperationsNotificationListItem {
  id: string;
  type: OperationsRegistrationNotificationType;
  title: string;
  body: string;
  entityType: OperationsRegistrationEntityType;
  entityId: string;
  actionPath: string;
  actorName: string;
  createdAt: string;
  isRead: boolean;
}

export interface OperationsNotificationListResult {
  items: OperationsNotificationListItem[];
  unreadCount: number;
}

export interface MarkRegistrationsSeenInput {
  entityType: OperationsRegistrationEntityType;
  entityIds: string[];
}
