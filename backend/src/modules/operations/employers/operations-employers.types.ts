export interface OperationsEmployerListItem {
  id: string;
  accountType: string;
  displayName: string;
  companyName: string;
  establishmentName: string;
  whatsappNumber: string;
  emailAddress: string;
  city: string;
  state: string;
  registrationStatus: string;
  registrationCompleted: boolean;
  isWhatsappVerified: boolean;
  logoUrl: string;
}

export interface OperationsEmployersListResult {
  employers: OperationsEmployerListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
