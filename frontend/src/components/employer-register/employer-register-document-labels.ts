import type { MessageKey } from "@/i18n/translate";
import type {
  EmployerRegisterBusinessDocumentType,
  EmployerRegisterDocumentType,
} from "@/types/employer-register";

export const IDENTITY_DOCUMENT_LABEL_KEYS: Readonly<
  Record<EmployerRegisterDocumentType, MessageKey>
> = {
  aadhaar: "auth.documents.aadhaar",
  pan: "auth.documents.pan",
  "driving-licence": "auth.documents.drivingLicence",
  "voter-id": "auth.documents.voterId",
};

export const BUSINESS_DOCUMENT_LABEL_KEYS: Readonly<
  Record<EmployerRegisterBusinessDocumentType, MessageKey>
> = {
  "gst-certificate": "auth.documents.gstCertificate",
  "certificate-of-incorporation": "auth.documents.certificateOfIncorporation",
  "llp-registration-certificate": "auth.documents.llpRegistration",
  "msme-udyam-registration": "auth.documents.msmeUdyam",
  "shop-establishment-license": "auth.documents.shopEstablishment",
  "trade-license": "auth.documents.tradeLicense",
  "pan-card-business": "auth.documents.panBusiness",
  "trust-society-registration": "auth.documents.trustSociety",
  "partnership-deed": "auth.documents.partnershipDeed",
  "fssai-license": "auth.documents.fssaiLicense",
  "other-government-registration": "auth.documents.otherGovernment",
};
