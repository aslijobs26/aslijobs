import { apiClient } from "./api-client";

export interface HireAssistTicket {
  id: string;
  ticketId: string;
  fullName: string;
  companyName: string;
  mobileNumber: string;
  email: string;
  designation: string;
  assistanceType: string;
  assistanceLabel: string;
  message: string;
  source: string;
  status: string;
  statusLabel: string;
  priority: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface HireAssistTicketList {
  items: HireAssistTicket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchHireAssistTickets(params: {
  page: number;
  search: string;
  status: string;
  assistanceType: string;
}): Promise<HireAssistTicketList> {
  const response = await apiClient.get<{ data: HireAssistTicketList }>(
    "/operations/hire-assist",
    { params },
  );
  return response.data.data;
}

export async function fetchHireAssistTicket(
  id: string,
): Promise<HireAssistTicket> {
  const response = await apiClient.get<{ data: HireAssistTicket }>(
    `/operations/hire-assist/${encodeURIComponent(id)}`,
  );
  return response.data.data;
}

export async function updateHireAssistTicketStatus(
  id: string,
  input: { status: string; expectedRevision: number; waitingReason?: string },
): Promise<HireAssistTicket> {
  const response = await apiClient.patch<{ data: HireAssistTicket }>(
    `/operations/hire-assist/${encodeURIComponent(id)}/status`,
    input,
  );
  return response.data.data;
}
