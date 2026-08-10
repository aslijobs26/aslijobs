import type { ApplicationResumeSource } from "@/types/job-seeker-resume";

export const JOB_SEEKER_UPLOADED_RESUME_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const JOB_SEEKER_UPLOADED_RESUME_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const JOB_SEEKER_UPLOADED_RESUME_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
] as const;

export function formatResumeFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "—";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function resumeSourceLabel(source: ApplicationResumeSource): string {
  return source === "uploaded" ? "My Uploaded Resume" : "AsliJobs Resume";
}

export function isAcceptedUploadedResumeFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const hasExtension = JOB_SEEKER_UPLOADED_RESUME_EXTENSIONS.some((ext) =>
    name.endsWith(ext),
  );
  const allowedMime = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);
  return hasExtension && (file.type === "" || allowedMime.has(file.type));
}
