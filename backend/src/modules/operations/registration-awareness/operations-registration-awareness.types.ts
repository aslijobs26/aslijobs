import type {
  OperationsNotificationEntityType,
  OperationsNotificationType,
  OperationsRegistrationAwarenessState,
} from "./operations-registration-awareness.constants.js";

export type OperationsRegistrationAwarenessFields = {
  state: OperationsRegistrationAwarenessState;
  registeredAt: Date;
  firstSeenAt: Date | null;
  firstSeenBy: string | null;
};

export type EmitEmployerRegisteredInput = {
  employerId: string;
  displayName: string;
  displayId: string;
  registeredAt?: Date;
};

export type EmitCandidateRegisteredInput = {
  candidateId: string;
  displayName: string;
  displayId: string;
  registeredAt?: Date;
};

export type OperationsNavBadgeCounts = {
  newEmployers: number | null;
  newCandidates: number | null;
  pendingJobs: number | null;
  pendingVerifications: number | null;
  unreadNotifications: number;
};

export type OperationsRegistrationMetricBlock = {
  newCount: number;
  today: number;
  thisWeek: number;
};

export type OperationsRecentEmployerRegistration = {
  id: string;
  displayId: string;
  displayName: string;
  registeredAt: string;
  registeredRelative: string;
  verificationStatus: string;
  verificationStatusLabel: string;
  awarenessState: OperationsRegistrationAwarenessState;
  actionPath: string;
};

export type OperationsRecentCandidateRegistration = {
  id: string;
  displayId: string;
  displayName: string;
  registeredAt: string;
  registeredRelative: string;
  profileStatus: string;
  profileStatusLabel: string;
  awarenessState: OperationsRegistrationAwarenessState;
  actionPath: string;
};

export type OperationsRegistrationMetricsResult = {
  employers: OperationsRegistrationMetricBlock | null;
  candidates: OperationsRegistrationMetricBlock | null;
  badges: OperationsNavBadgeCounts;
  recent: {
    employers: OperationsRecentEmployerRegistration[];
    candidates: OperationsRecentCandidateRegistration[];
  };
};

export type OperationsNotificationListItem = {
  id: string;
  type: OperationsNotificationType;
  title: string;
  body: string;
  entityType: OperationsNotificationEntityType;
  entityId: string;
  actionPath: string;
  actorName: string;
  createdAt: string;
  isRead: boolean;
};

export type OperationsNotificationListResult = {
  items: OperationsNotificationListItem[];
  unreadCount: number;
};
