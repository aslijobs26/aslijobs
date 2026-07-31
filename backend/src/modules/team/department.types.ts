import type {
  DepartmentColor,
  DepartmentIcon,
  DepartmentStatus,
} from "./team.constants.js";

export type DepartmentHeadSummary = {
  id: string;
  fullName: string;
  email: string;
  status: string;
} | null;

export type DepartmentListItem = {
  id: string;
  name: string;
  code: string;
  description: string;
  status: DepartmentStatus;
  color: DepartmentColor | "";
  icon: DepartmentIcon | "";
  email: string;
  phone: string;
  head: DepartmentHeadSummary;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

export type DepartmentDetails = DepartmentListItem & {
  activeMemberCount: number;
  pendingInvitationCount: number;
  createdBy: string;
  updatedBy: string;
};

export type TeamStats = {
  totalMembers: number;
  activeMembers: number;
  roles: number;
  pendingInvitations: number;
  departments: number;
};

export type TeamMemberOption = {
  id: string;
  fullName: string;
  email: string;
  status: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
