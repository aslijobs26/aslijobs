import type {
  OperationsEmployerDetail,
  OperationsEmployerDocumentItem,
  OperationsEmployerListItem,
} from "../employers/operations-employers.types.js";
import type {
  OperationsCandidateDetail,
  OperationsCandidateListItem,
} from "../candidates/operations-candidates.types.js";
import {
  CANDIDATE_FIELD_PERMISSION_KEYS,
  EMPLOYER_FIELD_PERMISSION_KEYS,
} from "./operations-permission-catalog.js";
import type { OperationsResolvedAccess } from "./operations-access.types.js";
import { operationsAccessCanKey } from "./operations-access.service.js";
import { omitKey } from "./omit-key.js";

export function sanitizeEmployerListItem(
  item: OperationsEmployerListItem,
  access: OperationsResolvedAccess | undefined,
): OperationsEmployerListItem {
  const next = { ...item };
  if (!operationsAccessCanKey(access, EMPLOYER_FIELD_PERMISSION_KEYS.phone)) {
    omitKey(next, "phone");
  }
  if (!operationsAccessCanKey(access, EMPLOYER_FIELD_PERMISSION_KEYS.email)) {
    omitKey(next, "email");
  }
  if (!operationsAccessCanKey(access, EMPLOYER_FIELD_PERMISSION_KEYS.name)) {
    omitKey(next, "displayName");
    omitKey(next, "companyName");
    omitKey(next, "establishmentName");
  }
  if (!operationsAccessCanKey(access, EMPLOYER_FIELD_PERMISSION_KEYS.address)) {
    omitKey(next, "location");
    omitKey(next, "city");
    omitKey(next, "state");
  }
  return next;
}

export function sanitizeEmployerDetail(
  detail: OperationsEmployerDetail,
  access: OperationsResolvedAccess | undefined,
): OperationsEmployerDetail {
  const next: OperationsEmployerDetail = {
    ...sanitizeEmployerListItem(detail, access),
    industry: detail.industry,
    businessCategory: detail.businessCategory,
    companyDescription: detail.companyDescription,
    website: detail.website,
    foundedYear: detail.foundedYear,
    companyType: detail.companyType,
    gstNumber: detail.gstNumber,
    panNumber: detail.panNumber,
    registrationNumber: detail.registrationNumber,
    minimumEmployees: detail.minimumEmployees,
    maximumEmployees: detail.maximumEmployees,
    companyAddress: detail.companyAddress,
    pincode: detail.pincode,
    contactPersonName: detail.contactPersonName,
    contactDesignation: detail.contactDesignation,
    alternatePhone: detail.alternatePhone,
    aboutUs: detail.aboutUs,
    culture: detail.culture,
    benefits: detail.benefits,
    vision: detail.vision,
    mission: detail.mission,
    values: detail.values,
    socialLinks: detail.socialLinks,
    lastLoginAt: detail.lastLoginAt,
    documents: detail.documents,
    analytics: detail.analytics,
    verificationRemarks: detail.verificationRemarks,
    suspensionReason: detail.suspensionReason,
  };

  if (!operationsAccessCanKey(access, EMPLOYER_FIELD_PERMISSION_KEYS.name)) {
    omitKey(next, "contactPersonName");
  }
  if (!operationsAccessCanKey(access, EMPLOYER_FIELD_PERMISSION_KEYS.address)) {
    omitKey(next, "companyAddress");
    omitKey(next, "pincode");
  }
  if (!operationsAccessCanKey(access, EMPLOYER_FIELD_PERMISSION_KEYS.pan)) {
    omitKey(next, "panNumber");
  }
  if (!operationsAccessCanKey(access, EMPLOYER_FIELD_PERMISSION_KEYS.gst)) {
    omitKey(next, "gstNumber");
  }
  if (
    !operationsAccessCanKey(
      access,
      EMPLOYER_FIELD_PERMISSION_KEYS.registrationNumber,
    )
  ) {
    omitKey(next, "registrationNumber");
  }
  if (!operationsAccessCanKey(access, EMPLOYER_FIELD_PERMISSION_KEYS.phone)) {
    omitKey(next, "alternatePhone");
  }
  if (!operationsAccessCanKey(access, EMPLOYER_FIELD_PERMISSION_KEYS.email)) {
    omitKey(next, "email");
  }

  if (!operationsAccessCanKey(access, "employers.profile.documents.view")) {
    next.documents = [];
  } else if (
    !operationsAccessCanKey(access, "employers.profile.documents.download")
  ) {
    next.documents = next.documents.map((doc) =>
      sanitizeEmployerDocumentDownload(doc),
    );
  }

  return next;
}

export function sanitizeEmployerDocumentDownload(
  document: OperationsEmployerDocumentItem,
): OperationsEmployerDocumentItem {
  return {
    ...document,
    url: "",
  };
}

export function sanitizeCandidateListItem(
  item: OperationsCandidateListItem,
  access: OperationsResolvedAccess | undefined,
): OperationsCandidateListItem {
  const next = { ...item };
  if (!operationsAccessCanKey(access, CANDIDATE_FIELD_PERMISSION_KEYS.name)) {
    omitKey(next, "candidateName");
  }
  if (!operationsAccessCanKey(access, CANDIDATE_FIELD_PERMISSION_KEYS.phone)) {
    omitKey(next, "candidatePhone");
  }
  if (!operationsAccessCanKey(access, CANDIDATE_FIELD_PERMISSION_KEYS.email)) {
    omitKey(next, "candidateEmail");
  }
  if (!operationsAccessCanKey(access, CANDIDATE_FIELD_PERMISSION_KEYS.location)) {
    omitKey(next, "candidateLocation");
  }
  return next;
}

export function sanitizeCandidateDetail(
  detail: OperationsCandidateDetail,
  access: OperationsResolvedAccess | undefined,
): OperationsCandidateDetail {
  const next: OperationsCandidateDetail = {
    ...detail,
    ...sanitizeCandidateListItem(detail, access),
  };
  if (!operationsAccessCanKey(access, CANDIDATE_FIELD_PERMISSION_KEYS.location)) {
    omitKey(next, "candidateCity");
    omitKey(next, "candidateState");
    omitKey(next, "candidatePincode");
    next.preferredLocations = [];
  }
  if (!operationsAccessCanKey(access, "candidates.profile.view")) {
    omitKey(next, "uploadedResumeUrl");
  }
  return next;
}
