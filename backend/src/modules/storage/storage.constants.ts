/**
 * Logical Cloudinary / local upload folders under the root prefix.
 * Controllers pass these (or nested paths like individual-documents/EMP000001).
 */
export const STORAGE_FOLDERS = {
  EMPLOYER_DOCUMENTS: "employer-documents",
  EMPLOYER_LOGOS: "employer-logos",
  RESUMES: "resumes",
  PROFILE_IMAGES: "profile-images",
  COMPANY_ASSETS: "company-assets",
  INDIVIDUAL_DOCUMENTS: "individual-documents",
} as const;

export type StorageFolder =
  (typeof STORAGE_FOLDERS)[keyof typeof STORAGE_FOLDERS];
