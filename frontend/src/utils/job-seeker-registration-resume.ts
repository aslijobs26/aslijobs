const STORAGE_KEY = "aslijobs.job-seeker.registration-resume";

export type JobSeekerRegistrationResumePayload = {
  jobSeekerId: string;
  registrationContinuationToken: string;
  fullName: string;
  whatsappNumber: string;
};

export function storeJobSeekerRegistrationResume(
  payload: JobSeekerRegistrationResumePayload,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function consumeJobSeekerRegistrationResume(): JobSeekerRegistrationResumePayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  window.sessionStorage.removeItem(STORAGE_KEY);

  try {
    const parsed = JSON.parse(raw) as Partial<JobSeekerRegistrationResumePayload>;
    if (
      typeof parsed.jobSeekerId !== "string" ||
      typeof parsed.registrationContinuationToken !== "string" ||
      typeof parsed.fullName !== "string" ||
      typeof parsed.whatsappNumber !== "string"
    ) {
      return null;
    }

    return {
      jobSeekerId: parsed.jobSeekerId,
      registrationContinuationToken: parsed.registrationContinuationToken,
      fullName: parsed.fullName,
      whatsappNumber: parsed.whatsappNumber,
    };
  } catch {
    return null;
  }
}
