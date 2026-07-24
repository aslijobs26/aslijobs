"use client";

import {
  POST_JOB_INITIAL_STEP,
  POST_JOB_INITIAL_WIZARD_DATA,
} from "@/constants/post-job";
import { getCompanyStrengthValueFromRange } from "@/constants/employer-register";
import { EMPLOYER_JOBS_QUERY_KEYS } from "@/constants/employer-jobs";
import { ROUTES } from "@/constants/routes";
import {
  createEmployerJob,
  createEmployerJobDraft,
  fetchEmployerJob,
  publishEmployerJobDraft,
  updateEmployerActiveJob,
  updateEmployerJobDraft,
} from "@/services/employer-jobs.service";
import { fetchEmployerProfile } from "@/services/employer-profile.service";
import type { CreatedJobResponse, JobStatus } from "@/types/employer-jobs";
import { buildJobPostedSuccessSummary } from "@/utils/build-job-posted-success-summary";
import { getEmployerAccessToken } from "@/utils/employer-auth-storage";
import { setJobPostedSuccessSummary } from "@/utils/job-posted-success-storage";
import { mapWizardDataToCreateJobPayload } from "@/utils/map-post-job-payload";
import {
  hasMeaningfulPostJobDraftContent,
  mapJobDetailToWizardState,
  mapWizardDataToDraftPayload,
} from "@/utils/post-job-draft";
import {
  findFirstInvalidPostJobStep,
  focusFirstInvalidPostJobField,
  validatePostJobStep,
  type PostJobFieldErrors,
} from "@/utils/post-job-validation";
import { buildEmployerLoginHref } from "@/utils/safe-return-url";
import type {
  CandidateInterviewFormData,
  EmployerAccountType,
  LocationAndSalaryFormData,
  PostJobActiveStep,
  PostJobFormData,
  PostJobWizardFormData,
} from "@/types/post-job";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { CandidateInterviewForm } from "./CandidateInterviewForm";
import { JobInformationForm } from "./JobInformationForm";
import { LocationSalaryForm } from "./LocationSalaryForm";
import { PostJobStepper } from "./PostJobStepper";
import { PostJobSubmittingOverlay } from "./PostJobSubmittingOverlay";
import { PostJobWhatsAppPreview } from "./PostJobWhatsAppPreview";
import {
  postJobContentShellClassName,
  postJobFormColumnClassName,
  postJobLayoutGridClassName,
  postJobMainColumnsClassName,
  postJobPreviewColumnClassName,
} from "./post-job-form-styles";

const DRAFT_AUTOSAVE_DEBOUNCE_MS = 1500;

function scheduleFocusFirstInvalidField(errors: PostJobFieldErrors) {
  window.setTimeout(() => {
    focusFirstInvalidPostJobField(errors);
  }, 50);
}

function PostJobActiveSection({
  activeStep,
  formData,
  fieldErrors,
  submitError,
  isSubmitting,
  isEditMode,
  accountType,
  onJobInformationChange,
  onLocationSalaryChange,
  onCandidateInterviewChange,
  onContinueStep1,
  onContinueStep2,
  onBackToStep1,
  onBackToStep2,
  onPostJob,
  scrollContainerRef,
}: {
  activeStep: PostJobActiveStep;
  formData: PostJobWizardFormData;
  fieldErrors: PostJobFieldErrors;
  submitError: string;
  isSubmitting: boolean;
  isEditMode: boolean;
  accountType: EmployerAccountType | null;
  onJobInformationChange: <K extends keyof PostJobFormData>(
    field: K,
    value: PostJobFormData[K],
  ) => void;
  onLocationSalaryChange: <K extends keyof LocationAndSalaryFormData>(
    field: K,
    value: LocationAndSalaryFormData[K],
  ) => void;
  onCandidateInterviewChange: <K extends keyof CandidateInterviewFormData>(
    field: K,
    value: CandidateInterviewFormData[K],
  ) => void;
  onContinueStep1: () => void;
  onContinueStep2: () => void;
  onBackToStep1: () => void;
  onBackToStep2: () => void;
  onPostJob: () => void;
  scrollContainerRef: RefObject<HTMLFormElement | null>;
}) {
  if (activeStep === 1) {
    return (
      <JobInformationForm
        formData={formData.jobInformation}
        fieldErrors={fieldErrors}
        accountType={accountType}
        onFieldChange={onJobInformationChange}
        onContinue={onContinueStep1}
        scrollContainerRef={scrollContainerRef}
      />
    );
  }

  if (activeStep === 2) {
    return (
      <LocationSalaryForm
        formData={formData.locationAndSalary}
        fieldErrors={fieldErrors}
        onFieldChange={onLocationSalaryChange}
        onBack={onBackToStep1}
        onContinue={onContinueStep2}
        scrollContainerRef={scrollContainerRef}
      />
    );
  }

  return (
    <CandidateInterviewForm
      formData={formData.candidateAndInterview}
      fieldErrors={fieldErrors}
      submitError={submitError}
      isSubmitting={isSubmitting}
      isEditMode={isEditMode}
      onFieldChange={onCandidateInterviewChange}
      onBack={onBackToStep2}
      onPostJob={onPostJob}
      scrollContainerRef={scrollContainerRef}
    />
  );
}

type PostJobContentProps = {
  draftJobId?: string;
};

export function PostJobContent({ draftJobId }: PostJobContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] =
    useState<PostJobActiveStep>(POST_JOB_INITIAL_STEP);
  const [formData, setFormData] = useState<PostJobWizardFormData>(
    POST_JOB_INITIAL_WIZARD_DATA,
  );
  const [fieldErrors, setFieldErrors] = useState<PostJobFieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHydratingDraft, setIsHydratingDraft] = useState(Boolean(draftJobId));
  const [draftLoadError, setDraftLoadError] = useState("");
  const [loadedJobStatus, setLoadedJobStatus] = useState<JobStatus | null>(
    null,
  );
  const [accountType, setAccountType] = useState<EmployerAccountType | null>(
    null,
  );
  const formScrollRef = useRef<HTMLFormElement>(null);
  const hasPrefillEmployerProfileRef = useRef(false);

  const draftIdRef = useRef<string | null>(draftJobId ?? null);
  const isActiveEditMode = loadedJobStatus === "active";
  const isDraftEditMode = loadedJobStatus === "draft";
  const formDataRef = useRef(formData);
  const activeStepRef = useRef(activeStep);
  const lastSavedSignatureRef = useRef("");
  const isSavingDraftRef = useRef(false);
  const skipAutosaveRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const validationContext = { accountType };

  useEffect(() => {
    formDataRef.current = formData;
    activeStepRef.current = activeStep;
  }, [formData, activeStep]);

  useEffect(() => {
    let cancelled = false;

    const loadEmployerAccountType = async () => {
      try {
        const profile = await fetchEmployerProfile();
        if (cancelled) {
          return;
        }

        setAccountType(profile.accountType);

        if (draftJobId || hasPrefillEmployerProfileRef.current) {
          return;
        }

        hasPrefillEmployerProfileRef.current = true;

        if (profile.accountType === "consultancy") {
          const matchedCompanySize = getCompanyStrengthValueFromRange(
            profile.minimumEmployees,
            profile.maximumEmployees,
          );
          const fallbackCompanySize =
            typeof profile.minimumEmployees === "number" &&
            typeof profile.maximumEmployees === "number"
              ? `${profile.minimumEmployees}-${profile.maximumEmployees}`
              : "";
          const companySize = matchedCompanySize || fallbackCompanySize;

          setFormData((current) => ({
            ...current,
            jobInformation: {
              ...current.jobInformation,
              industry:
                current.jobInformation.industry || profile.industry || "",
              businessCategory:
                current.jobInformation.businessCategory ||
                profile.businessCategory ||
                "",
              companySize: current.jobInformation.companySize || companySize,
            },
          }));
          return;
        }

        if (profile.accountType === "individual") {
          const establishmentName = (profile.establishmentName ?? "").trim();
          if (!establishmentName) {
            return;
          }

          setFormData((current) => ({
            ...current,
            jobInformation: {
              ...current.jobInformation,
              companyDetails:
                current.jobInformation.companyDetails || establishmentName,
            },
          }));
        }
      } catch {
        if (!cancelled) {
          setAccountType(null);
        }
      }
    };

    void loadEmployerAccountType();

    return () => {
      cancelled = true;
    };
  }, [draftJobId]);

  const buildDraftSignature = useCallback(
    (data: PostJobWizardFormData, step: PostJobActiveStep) =>
      JSON.stringify(mapWizardDataToDraftPayload(data, step)),
    [],
  );

  const persistDraft = useCallback(async (options?: { keepalive?: boolean }) => {
    if (
      skipAutosaveRef.current ||
      isSavingDraftRef.current ||
      isActiveEditMode
    ) {
      return;
    }

    const currentFormData = formDataRef.current;
    const currentStep = activeStepRef.current;

    if (!hasMeaningfulPostJobDraftContent(currentFormData)) {
      return;
    }

    const payload = mapWizardDataToDraftPayload(currentFormData, currentStep);
    const signature = JSON.stringify(payload);

    if (signature === lastSavedSignatureRef.current) {
      return;
    }

    isSavingDraftRef.current = true;

    try {
      if (draftIdRef.current) {
        await updateEmployerJobDraft(draftIdRef.current, payload);
      } else {
        const created = await createEmployerJobDraft(payload);
        draftIdRef.current = created.job.id;
        window.history.replaceState(null, "", ROUTES.postJobEdit(created.job.id));
      }

      lastSavedSignatureRef.current = signature;
      await queryClient.invalidateQueries({
        queryKey: EMPLOYER_JOBS_QUERY_KEYS.all,
      });
    } catch {
      // Autosave failures should not interrupt form editing.
    } finally {
      isSavingDraftRef.current = false;
    }

    void options;
  }, [isActiveEditMode, queryClient]);

  const scheduleDraftAutosave = useCallback(() => {
    if (skipAutosaveRef.current || isHydratingDraft || isActiveEditMode) {
      return;
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      void persistDraft();
    }, DRAFT_AUTOSAVE_DEBOUNCE_MS);
  }, [isActiveEditMode, isHydratingDraft, persistDraft]);

  useEffect(() => {
    if (!draftJobId) {
      return;
    }

    let cancelled = false;

    const loadDraft = async () => {
      setIsHydratingDraft(true);
      setDraftLoadError("");

      try {
        const result = await fetchEmployerJob(draftJobId);

        if (cancelled) {
          return;
        }

        if (result.job.status === "draft") {
          const restored = mapJobDetailToWizardState(result.job);
          draftIdRef.current = result.job.id;
          setLoadedJobStatus("draft");
          setFormData(restored.formData);
          setActiveStep(restored.activeStep);
          lastSavedSignatureRef.current = buildDraftSignature(
            restored.formData,
            restored.activeStep,
          );
          return;
        }

        if (result.job.status === "active") {
          const restored = mapJobDetailToWizardState(result.job);
          draftIdRef.current = result.job.id;
          skipAutosaveRef.current = true;
          setLoadedJobStatus("active");
          setFormData(restored.formData);
          setActiveStep(1);
          lastSavedSignatureRef.current = buildDraftSignature(
            restored.formData,
            1,
          );
          return;
        }

        setDraftLoadError("Only draft or active jobs can be edited here.");
        setIsHydratingDraft(false);
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = isAxiosError(error)
          ? (error.response?.data as { message?: string } | undefined)?.message
          : undefined;
        setDraftLoadError(message || "Unable to load job. Please try again.");
      } finally {
        if (!cancelled) {
          setIsHydratingDraft(false);
        }
      }
    };

    void loadDraft();

    return () => {
      cancelled = true;
    };
  }, [buildDraftSignature, draftJobId]);

  useEffect(() => {
    if (isHydratingDraft || isSubmitting || isActiveEditMode) {
      return;
    }

    scheduleDraftAutosave();
  }, [
    formData,
    activeStep,
    isActiveEditMode,
    isHydratingDraft,
    isSubmitting,
    scheduleDraftAutosave,
  ]);

  useEffect(() => {
    if (isActiveEditMode) {
      return;
    }

    const flushDraft = () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }

      void persistDraft({ keepalive: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushDraft();
      }
    };

    window.addEventListener("pagehide", flushDraft);
    window.addEventListener("beforeunload", flushDraft);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", flushDraft);
      window.removeEventListener("beforeunload", flushDraft);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      flushDraft();
    };
  }, [isActiveEditMode, persistDraft]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeStep]);

  const clearFieldError = (field: string) => {
    setFieldErrors((current) => {
      if (!(field in current)) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const updateJobInformation = <K extends keyof PostJobFormData>(
    field: K,
    value: PostJobFormData[K],
  ) => {
    clearFieldError(String(field));
    setFormData((current) => ({
      ...current,
      jobInformation: {
        ...current.jobInformation,
        [field]: value,
      },
    }));
  };

  const updateLocationAndSalary = <K extends keyof LocationAndSalaryFormData>(
    field: K,
    value: LocationAndSalaryFormData[K],
  ) => {
    clearFieldError(String(field));
    setFormData((current) => ({
      ...current,
      locationAndSalary: {
        ...current.locationAndSalary,
        [field]: value,
      },
    }));
  };

  const updateCandidateAndInterview = <
    K extends keyof CandidateInterviewFormData,
  >(
    field: K,
    value: CandidateInterviewFormData[K],
  ) => {
    clearFieldError(String(field));
    setFormData((current) => ({
      ...current,
      candidateAndInterview: {
        ...current.candidateAndInterview,
        [field]: value,
      },
    }));
  };

  const handleStepChange = (step: PostJobActiveStep) => {
    setSubmitError("");

    if (step > activeStep) {
      for (
        let current = activeStep;
        current < step;
        current = (current + 1) as PostJobActiveStep
      ) {
        const errors = validatePostJobStep(current, formData, validationContext);
        if (Object.keys(errors).length > 0) {
          setActiveStep(current);
          setFieldErrors(errors);
          scheduleFocusFirstInvalidField(errors);
          return;
        }
      }
    }

    setFieldErrors({});
    setActiveStep(step);
  };

  const handleContinueStep1 = () => {
    const errors = validatePostJobStep(1, formData, validationContext);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      scheduleFocusFirstInvalidField(errors);
      return;
    }
    setActiveStep(2);
  };

  const handleContinueStep2 = () => {
    const errors = validatePostJobStep(2, formData);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      scheduleFocusFirstInvalidField(errors);
      return;
    }
    setActiveStep(3);
  };

  const handlePostJob = async () => {
    setSubmitError("");

    if (!getEmployerAccessToken()) {
      const returnUrl = `${window.location.pathname}${window.location.search}`;
      router.replace(buildEmployerLoginHref(returnUrl || ROUTES.POST_JOB));
      return;
    }

    const invalid = findFirstInvalidPostJobStep(formData, validationContext);

    if (invalid) {
      setActiveStep(invalid.step);
      setFieldErrors(invalid.errors);
      scheduleFocusFirstInvalidField(invalid.errors);
      return;
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    skipAutosaveRef.current = true;
    setIsSubmitting(true);

    try {
      const payload = mapWizardDataToCreateJobPayload(formData, "active");
      let createdJob: CreatedJobResponse["job"] | undefined;

      if (isActiveEditMode && draftIdRef.current) {
        const result = await updateEmployerActiveJob(
          draftIdRef.current,
          payload,
        );
        createdJob = result.job;
      } else if (isDraftEditMode && draftIdRef.current) {
        const result = await publishEmployerJobDraft(
          draftIdRef.current,
          payload,
        );
        createdJob = result.job;
      } else if (draftIdRef.current) {
        const result = await publishEmployerJobDraft(
          draftIdRef.current,
          payload,
        );
        createdJob = result.job;
      } else {
        const result = await createEmployerJob(payload);
        createdJob = result.data.job;
      }

      const successSummary = buildJobPostedSuccessSummary(formData, createdJob);
      setJobPostedSuccessSummary(successSummary);

      await queryClient.invalidateQueries({
        queryKey: EMPLOYER_JOBS_QUERY_KEYS.all,
      });
      router.replace(ROUTES.POST_JOB_SUCCESS);
    } catch (error) {
      if (!isActiveEditMode) {
        skipAutosaveRef.current = false;
      }
      const message = isAxiosError(error)
        ? (error.response?.data as { message?: string } | undefined)?.message
        : undefined;
      setSubmitError(
        message ||
          (isActiveEditMode
            ? "Unable to update job. Please try again."
            : "Unable to post job. Please try again."),
      );
      setIsSubmitting(false);
    }
  };

  if (isHydratingDraft) {
    return (
      <div className={postJobContentShellClassName}>
        <p className="text-sm text-muted">Loading job…</p>
      </div>
    );
  }

  if (draftLoadError) {
    return (
      <div className={postJobContentShellClassName}>
        <p className="text-sm text-red-600">{draftLoadError}</p>
      </div>
    );
  }

  return (
    <div className={postJobContentShellClassName}>
      {isSubmitting ? (
        <PostJobSubmittingOverlay isEditMode={isActiveEditMode} />
      ) : null}
      <div className={postJobLayoutGridClassName}>
        <PostJobStepper activeStep={activeStep} onStepChange={handleStepChange} />

        <div className={postJobMainColumnsClassName}>
          <div className={postJobFormColumnClassName}>
            <PostJobActiveSection
              activeStep={activeStep}
              formData={formData}
              fieldErrors={fieldErrors}
              submitError={submitError}
              isSubmitting={isSubmitting}
              isEditMode={isActiveEditMode}
              accountType={accountType}
              onJobInformationChange={updateJobInformation}
              onLocationSalaryChange={updateLocationAndSalary}
              onCandidateInterviewChange={updateCandidateAndInterview}
              onContinueStep1={handleContinueStep1}
              onContinueStep2={handleContinueStep2}
              onBackToStep1={() => handleStepChange(1)}
              onBackToStep2={() => handleStepChange(2)}
              onPostJob={() => {
                void handlePostJob();
              }}
              scrollContainerRef={formScrollRef}
            />
          </div>

          <div className={postJobPreviewColumnClassName}>
            <PostJobWhatsAppPreview formData={formData} />
          </div>
        </div>
      </div>
    </div>
  );
}
