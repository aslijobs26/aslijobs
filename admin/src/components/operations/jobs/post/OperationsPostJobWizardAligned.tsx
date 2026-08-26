import { Check, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  OPERATIONS_POST_JOB_EDUCATION_OPTIONS,
  OPERATIONS_POST_JOB_EXPERIENCE_OPTIONS,
  OPERATIONS_POST_JOB_FLEXIBLE_HOURS_OPTIONS,
  OPERATIONS_POST_JOB_GENDER_OPTIONS,
  OPERATIONS_POST_JOB_INITIAL_STEP,
  OPERATIONS_POST_JOB_INITIAL_WIZARD_DATA,
  OPERATIONS_POST_JOB_LANGUAGE_OPTIONS,
  OPERATIONS_POST_JOB_LONG_TEXT_MAX_LENGTH,
  OPERATIONS_POST_JOB_PART_TIME_SCHEDULE_OPTIONS,
  OPERATIONS_POST_JOB_PERK_OPTIONS,
  OPERATIONS_POST_JOB_SALARY_PERIOD_OPTIONS,
  OPERATIONS_POST_JOB_SALARY_TYPE_OPTIONS,
  OPERATIONS_POST_JOB_TYPE_OPTIONS,
  OPERATIONS_POST_JOB_WALK_IN_TIME_OPTIONS,
  OPERATIONS_POST_JOB_WORK_MODE_OPTIONS,
  buildContractPeriodStoredValue,
  parseContractPeriodStoredValue,
} from "../../../../constants/operations-post-job";
import { operationsJobDetailPath, OPERATIONS_ROUTES } from "../../../../constants/operations-routes";
import { useOperationsJobDetail } from "../../../../hooks/use-operations-job-detail";
import {
  useAssignOperationsJobEmployerMutation,
  useCreateOperationsJobDraftMutation,
  usePublishOperationsJobMutation,
  useUpdateOperationsJobDraftMutation,
} from "../../../../hooks/use-operations-post-job";
import { fetchOperationsEmployerById } from "../../../../services/operations-employers.service";
import type {
  OperationsEmployerOption,
  OperationsPostJobActiveStep,
  OperationsPostJobWizardFormData,
} from "../../../../types/operations-post-job";
import { cn } from "../../../../utils/cn";
import { mapWizardDataToPublishPayload } from "../../../../utils/map-operations-post-job-payload";
import {
  mapWizardDataToPreviewDetail,
  resolveOperationsPostJobWorkflowState,
} from "../../../../utils/map-operations-post-job-preview";
import {
  hasMeaningfulOperationsPostJobContent,
  mapOperationsJobDetailToWizardState,
  mapWizardDataToOperationsDraftPayload,
} from "../../../../utils/operations-post-job-draft";
import {
  validateOperationsAlignedPostJobForPublish,
  validateOperationsAlignedPostJobStep,
} from "../../../../utils/operations-post-job-validation";
import { OperationsBadge } from "../../../ui/OperationsBadge";
import { JobDescriptionEditor } from "../../../ui/JobDescriptionEditor";
import { OperationsPostJobEmployerSelect } from "./OperationsPostJobEmployerSelect";
import { OperationsPostJobWhatsAppPreview } from "./OperationsPostJobWhatsAppPreview";
import { OperationsPostJobPlaceAutocomplete } from "./OperationsPostJobPlaceAutocomplete";
import { OperationsPostJobStepper } from "./OperationsPostJobStepper";

const inputClass =
  "h-12 w-full rounded-md border border-border bg-surface px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20";
const textareaClass =
  "min-h-[5.5rem] w-full resize-y rounded-md border border-border bg-surface px-3.5 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "text-sm font-bold text-foreground";

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label className={labelClass}>
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      {children}
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

function RadioIndicator({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        checked ? "border-primary-soft bg-primary-soft" : "border-border bg-surface",
      )}
    >
      <span className={cn("size-1.5 rounded-full bg-surface", checked ? "opacity-100" : "opacity-0")} />
    </span>
  );
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(inputClass, "cursor-pointer appearance-none pr-10", !value && "text-muted")}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/70">▾</span>
    </div>
  );
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }
  return fallback;
}

export function OperationsPostJobWizardAligned() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editJobId = searchParams.get("edit")?.trim() ?? "";

  const detailQuery = useOperationsJobDetail(editJobId || undefined);
  const createDraftMutation = useCreateOperationsJobDraftMutation();
  const updateDraftMutation = useUpdateOperationsJobDraftMutation();
  const assignEmployerMutation = useAssignOperationsJobEmployerMutation();
  const publishMutation = usePublishOperationsJobMutation();

  const [formData, setFormData] = useState<OperationsPostJobWizardFormData>(OPERATIONS_POST_JOB_INITIAL_WIZARD_DATA);
  const [activeStep, setActiveStep] = useState<OperationsPostJobActiveStep>(OPERATIONS_POST_JOB_INITIAL_STEP);
  const [selectedEmployer, setSelectedEmployer] = useState<OperationsEmployerOption | null>(null);
  const [savedJobId, setSavedJobId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(!editJobId);

  const isSubmitting =
    createDraftMutation.isPending ||
    updateDraftMutation.isPending ||
    assignEmployerMutation.isPending ||
    publishMutation.isPending;

  useEffect(() => {
    if (!editJobId || !detailQuery.data || initialized) return;
    const mapped = mapOperationsJobDetailToWizardState(detailQuery.data);
    setFormData(mapped.formData);
    setActiveStep(1);
    setSavedJobId(detailQuery.data.jobId);
    setErrors({});
    setActionError(null);
    if (detailQuery.data.employerAssigned && detailQuery.data.employer.id) {
      void fetchOperationsEmployerById(detailQuery.data.employer.id)
        .then((employer) => {
          setSelectedEmployer(employer);
          setFormData((current) => ({
            ...current,
            jobInformation: {
              ...current.jobInformation,
              companyDetails:
                current.jobInformation.companyDetails.trim() ||
                employer.displayName ||
                employer.companyName ||
                employer.establishmentName ||
                "",
            },
            candidateAndInterview: {
              ...current.candidateAndInterview,
              contactName:
                current.candidateAndInterview.contactName.trim() ||
                employer.displayName ||
                employer.companyName ||
                "",
              contactEmail:
                current.candidateAndInterview.contactEmail.trim() ||
                employer.emailAddress ||
                "",
              contactMobile:
                current.candidateAndInterview.contactMobile ||
                (employer.whatsappNumber || "").replace(/\D/g, "").slice(-10),
            },
          }));
        })
        .catch(() => undefined);
    }
    setInitialized(true);
  }, [detailQuery.data, editJobId, initialized]);

  const isEditMode = Boolean(editJobId);
  const existingJobStatus = detailQuery.data?.status;
  const isEditingNonDraft =
    isEditMode && Boolean(existingJobStatus) && existingJobStatus !== "draft";

  const previewJob = useMemo(() => {
    const mapped = mapWizardDataToPreviewDetail(formData, selectedEmployer);
    if (existingJobStatus) {
      return { ...mapped, status: existingJobStatus };
    }
    return mapped;
  }, [formData, selectedEmployer, existingJobStatus]);
  const publishValidationErrors = useMemo(
    () => validateOperationsAlignedPostJobForPublish(formData),
    [formData],
  );
  const publishReady = Object.keys(publishValidationErrors).length === 0 && Boolean(selectedEmployer?.id);
  const workflowState = resolveOperationsPostJobWorkflowState({
    employerAssigned: Boolean(selectedEmployer?.id),
    publishReady,
    status: previewJob.status,
  });

  function updateFormData(updater: (current: OperationsPostJobWizardFormData) => OperationsPostJobWizardFormData) {
    setFormData((current) => updater(current));
    setActionError(null);
    setStatusMessage(null);
  }

  function handleStepChange(targetStep: OperationsPostJobActiveStep) {
    if (targetStep === activeStep) {
      return;
    }

    if (targetStep < activeStep) {
      setErrors({});
      setActiveStep(targetStep);
      return;
    }

    for (let step = activeStep; step < targetStep; step += 1) {
      const stepErrors = validateOperationsAlignedPostJobStep(
        step as OperationsPostJobActiveStep,
        formData,
      );
      if (Object.keys(stepErrors).length > 0) {
        if (step === activeStep) {
          setErrors(stepErrors);
        } else {
          setActiveStep(step as OperationsPostJobActiveStep);
          setErrors(stepErrors);
        }
        return;
      }
    }

    setErrors({});
    setActiveStep(targetStep);
  }

  function handleContinue() {
    const stepErrors = validateOperationsAlignedPostJobStep(activeStep, formData);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      return;
    }
    setActionError(null);
    setActiveStep((step) => (step + 1) as OperationsPostJobActiveStep);
  }

  async function persistDraft(completedStep: OperationsPostJobActiveStep) {
    if (!hasMeaningfulOperationsPostJobContent(formData)) {
      setActionError("Add at least one job field before saving a draft.");
      return null;
    }
    const payload = mapWizardDataToOperationsDraftPayload(formData, completedStep, selectedEmployer?.id ?? null);
    if (savedJobId) {
      const result = await updateDraftMutation.mutateAsync({ jobId: savedJobId, payload });
      setSavedJobId(result.jobId);
      return result;
    }
    const result = await createDraftMutation.mutateAsync(payload);
    setSavedJobId(result.jobId);
    return result;
  }

  async function handleSaveDraft() {
    setActionError(null);
    setStatusMessage(null);
    try {
      const result = await persistDraft(activeStep);
      if (result) {
        setStatusMessage(
          isEditingNonDraft ? "Job updated successfully." : "Draft saved successfully.",
        );
      }
    } catch (error) {
      setActionError(
        getApiErrorMessage(
          error,
          isEditingNonDraft ? "Unable to update job." : "Unable to save draft.",
        ),
      );
    }
  }

  async function handleSaveChanges() {
    const allErrors = validateOperationsAlignedPostJobForPublish(formData);
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      const firstInvalidStep = ([1, 2, 3] as const).find(
        (step) =>
          Object.keys(validateOperationsAlignedPostJobStep(step, formData))
            .length > 0,
      );
      if (firstInvalidStep) {
        setActiveStep(firstInvalidStep);
      }
      setActionError("Complete all required fields before saving changes.");
      return;
    }
    if (!selectedEmployer?.id && !detailQuery.data?.employerAssigned) {
      setActionError("Assign an employer before saving this job.");
      return;
    }

    setActionError(null);
    setStatusMessage(null);
    try {
      if (!savedJobId) {
        throw new Error("Job id is missing.");
      }

      await persistDraft(3);

      if (
        selectedEmployer?.id &&
        detailQuery.data?.employer.id &&
        selectedEmployer.id !== detailQuery.data.employer.id &&
        existingJobStatus === "draft"
      ) {
        await assignEmployerMutation.mutateAsync({
          jobId: savedJobId,
          employerId: selectedEmployer.id,
        });
      }

      setStatusMessage("Job updated successfully.");
      navigate(operationsJobDetailPath(savedJobId));
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Unable to update job."));
    }
  }

  useEffect(() => {
    if (!statusMessage) {
      return;
    }
    const timer = window.setTimeout(() => {
      setStatusMessage(null);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  async function handlePublish() {
    const allErrors = validateOperationsAlignedPostJobForPublish(formData);
    setErrors(allErrors);
    if (!selectedEmployer?.id) {
      setActionError("Assign an employer before publishing this job.");
      return;
    }
    if (Object.keys(allErrors).length > 0) {
      setActionError("Complete all required fields before publishing.");
      return;
    }
    try {
      let jobId = savedJobId;
      if (!jobId) {
        const draft = await persistDraft(3);
        jobId = draft?.jobId ?? "";
      } else {
        await persistDraft(3);
      }
      if (!jobId) throw new Error("Draft job id is missing.");
      if (selectedEmployer.id && detailQuery.data?.employer.id !== selectedEmployer.id) {
        await assignEmployerMutation.mutateAsync({ jobId, employerId: selectedEmployer.id });
      }
      await publishMutation.mutateAsync({ jobId, payload: mapWizardDataToPublishPayload(formData) });
      navigate(operationsJobDetailPath(jobId));
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Unable to publish job."));
    }
  }

  if (editJobId && detailQuery.isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-border-subtle bg-surface">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    );
  }

  if (editJobId && detailQuery.isError) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface px-4 py-16 text-center shadow-sm">
        <p className="text-sm font-medium text-danger">
          {getApiErrorMessage(detailQuery.error, "Unable to load this job for editing.")}
        </p>
        <button
          type="button"
          onClick={() => void detailQuery.refetch()}
          className="mt-3 inline-flex h-9 items-center rounded-lg bg-primary-light px-3 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Retry
        </button>
      </div>
    );
  }

  const contractFrom = parseContractPeriodStoredValue(formData.jobInformation.contractPeriodFrom);
  const contractTo = parseContractPeriodStoredValue(formData.jobInformation.contractPeriodTo);

  return (
    <div className="flex min-w-0 flex-col gap-3 pb-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <OperationsBadge variant="support">{workflowState.label}</OperationsBadge>
          {savedJobId ? <span className="text-[11px] font-medium text-muted">Job ID: <span className="text-foreground">{savedJobId}</span></span> : null}
        </div>
        <Link to={OPERATIONS_ROUTES.JOBS} className="inline-flex size-8 items-center justify-center rounded-lg border border-border-subtle bg-surface text-muted">
          <X className="size-4" />
        </Link>
      </div>

      <OperationsPostJobStepper activeStep={activeStep} onStepChange={handleStepChange} />

      <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          <section className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5 lg:p-6">
            {activeStep === 1 ? (
              <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
                  <Field label="Establishment Name" error={errors.companyDetails}>
                    <input className={inputClass} placeholder="Enter Establishment Name" value={formData.jobInformation.companyDetails} onChange={(e) => updateFormData((c) => ({ ...c, jobInformation: { ...c.jobInformation, companyDetails: e.target.value } }))} />
                  </Field>
                  <Field label="Job Title / Designation" required error={errors.jobTitle}>
                    <input className={inputClass} placeholder="Enter Job Title" value={formData.jobInformation.jobTitle} onChange={(e) => updateFormData((c) => ({ ...c, jobInformation: { ...c.jobInformation, jobTitle: e.target.value } }))} />
                  </Field>
                </div>
                <Field label="Job Type" required error={errors.jobType}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {OPERATIONS_POST_JOB_TYPE_OPTIONS.map((option) => {
                      const checked = formData.jobInformation.jobType === option.value;
                      return (
                        <label key={option.value} className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-md border bg-surface px-4 py-2.5", checked ? "border-primary-soft ring-1 ring-primary-soft/30" : "border-border")}>
                          <input className="sr-only" type="radio" checked={checked} onChange={() => updateFormData((c) => ({ ...c, jobInformation: { ...c.jobInformation, jobType: option.value } }))} />
                          <RadioIndicator checked={checked} />
                          <span className="text-sm font-medium">{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </Field>
                {formData.jobInformation.jobType === "part-time" ? (
                  <Field label="Part-time Schedule" required error={errors.partTimeSchedule}>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {OPERATIONS_POST_JOB_PART_TIME_SCHEDULE_OPTIONS.map((option) => {
                        const checked = formData.jobInformation.partTimeSchedule === option.value;
                        return (
                          <label key={option.value} className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-md border bg-surface px-4 py-2.5", checked ? "border-primary-soft ring-1 ring-primary-soft/30" : "border-border")}>
                            <input className="sr-only" type="radio" checked={checked} onChange={() => updateFormData((c) => ({ ...c, jobInformation: { ...c.jobInformation, partTimeSchedule: option.value } }))} />
                            <RadioIndicator checked={checked} />
                            <span className="text-sm font-medium">{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                    {formData.jobInformation.partTimeSchedule === "fixed-timings" ? (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <Field label="Start Time" error={errors.partTimeStartTime}>
                          <input className={inputClass} placeholder="Start time" value={formData.jobInformation.partTimeStartTime} onChange={(e) => updateFormData((c) => ({ ...c, jobInformation: { ...c.jobInformation, partTimeStartTime: e.target.value } }))} />
                        </Field>
                        <Field label="End Time" error={errors.partTimeEndTime}>
                          <input className={inputClass} placeholder="End time" value={formData.jobInformation.partTimeEndTime} onChange={(e) => updateFormData((c) => ({ ...c, jobInformation: { ...c.jobInformation, partTimeEndTime: e.target.value } }))} />
                        </Field>
                      </div>
                    ) : null}
                    {formData.jobInformation.partTimeSchedule === "flexible-hours" ? (
                      <div className="mt-3">
                        <SelectField value={formData.jobInformation.partTimeFlexibleHours} placeholder="Select hours" options={OPERATIONS_POST_JOB_FLEXIBLE_HOURS_OPTIONS} onChange={(value) => updateFormData((c) => ({ ...c, jobInformation: { ...c.jobInformation, partTimeFlexibleHours: value } }))} />
                      </div>
                    ) : null}
                  </Field>
                ) : null}
                {formData.jobInformation.jobType === "contract" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Contract Period From" error={errors.contractPeriodFrom}>
                      <div className="grid grid-cols-[1fr_auto] overflow-hidden rounded-md border border-border">
                        <input className="h-12 border-0 px-3.5 outline-none" value={contractFrom.amount} onChange={(e) => updateFormData((c) => ({ ...c, jobInformation: { ...c.jobInformation, contractPeriodFrom: buildContractPeriodStoredValue(e.target.value, contractFrom.unit) } }))} />
                        <select className="h-12 border-l border-border px-3 text-sm outline-none" value={contractFrom.unit} onChange={(e) => updateFormData((c) => ({ ...c, jobInformation: { ...c.jobInformation, contractPeriodFrom: buildContractPeriodStoredValue(contractFrom.amount, e.target.value as typeof contractFrom.unit) } }))}>
                          <option value="days">Days</option><option value="months">Months</option><option value="years">Years</option>
                        </select>
                      </div>
                    </Field>
                    <Field label="Contract Period To" error={errors.contractPeriodTo}>
                      <div className="grid grid-cols-[1fr_auto] overflow-hidden rounded-md border border-border">
                        <input className="h-12 border-0 px-3.5 outline-none" value={contractTo.amount} onChange={(e) => updateFormData((c) => ({ ...c, jobInformation: { ...c.jobInformation, contractPeriodTo: buildContractPeriodStoredValue(e.target.value, contractTo.unit) } }))} />
                        <select className="h-12 border-l border-border px-3 text-sm outline-none" value={contractTo.unit} onChange={(e) => updateFormData((c) => ({ ...c, jobInformation: { ...c.jobInformation, contractPeriodTo: buildContractPeriodStoredValue(contractTo.amount, e.target.value as typeof contractTo.unit) } }))}>
                          <option value="days">Days</option><option value="months">Months</option><option value="years">Years</option>
                        </select>
                      </div>
                    </Field>
                  </div>
                ) : null}
                <Field label="Work Mode" required error={errors.workMode}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {OPERATIONS_POST_JOB_WORK_MODE_OPTIONS.map((option) => {
                      const checked = formData.jobInformation.workMode === option.value;
                      return (
                        <label key={option.value} className={cn("flex min-h-[4.5rem] cursor-pointer items-start gap-2.5 rounded-md border bg-surface px-4 py-3.5", checked ? "border-primary-soft ring-1 ring-primary-soft/30" : "border-border")}>
                          <input className="sr-only" type="radio" checked={checked} onChange={() => updateFormData((c) => ({ ...c, jobInformation: { ...c.jobInformation, workMode: option.value } }))} />
                          <RadioIndicator checked={checked} />
                          <span className="text-xs font-bold">{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </Field>
                <Field label="Number of Vacancies" required error={errors.vacancies}>
                  <input className={inputClass} type="number" min={1} placeholder="Select number of vacancies" value={formData.jobInformation.vacancies} onChange={(e) => updateFormData((c) => ({ ...c, jobInformation: { ...c.jobInformation, vacancies: e.target.value } }))} />
                </Field>
                <Field label="Job Description" required error={errors.jobDescription}>
                  <JobDescriptionEditor
                    id="job-description"
                    value={formData.jobInformation.jobDescription}
                    onChange={(next) =>
                      updateFormData((c) => ({
                        ...c,
                        jobInformation: {
                          ...c.jobInformation,
                          jobDescription: next,
                        },
                      }))
                    }
                    maxLength={OPERATIONS_POST_JOB_LONG_TEXT_MAX_LENGTH}
                    placeholder="Describe the job role, responsibilities and requirements."
                    hasError={Boolean(errors.jobDescription)}
                    aria-invalid={Boolean(errors.jobDescription)}
                    aria-describedby="job-description-count"
                  />
                </Field>
              </div>
            ) : null}

            {activeStep === 2 ? (
              <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
                  <Field label="State" required error={errors.state}><OperationsPostJobPlaceAutocomplete id="ops-post-job-state" mode="state" value={formData.locationAndSalary.state} placeholder="Search state" hasError={Boolean(errors.state)} onChange={(value) => updateFormData((c) => ({ ...c, locationAndSalary: { ...c.locationAndSalary, state: value, city: "" } }))} onSelect={(s) => updateFormData((c) => ({ ...c, locationAndSalary: { ...c.locationAndSalary, state: s.state, city: "" } }))} /></Field>
                  <Field label="City" required error={errors.city}><OperationsPostJobPlaceAutocomplete id="ops-post-job-city" mode="city" value={formData.locationAndSalary.city} selectedState={formData.locationAndSalary.state} disabled={!formData.locationAndSalary.state.trim()} placeholder={formData.locationAndSalary.state.trim() ? "Search city" : "Select a state first"} hasError={Boolean(errors.city)} onChange={(value) => updateFormData((c) => ({ ...c, locationAndSalary: { ...c.locationAndSalary, city: value } }))} onSelect={(s) => updateFormData((c) => ({ ...c, locationAndSalary: { ...c.locationAndSalary, city: s.city } }))} /></Field>
                </div>
                <Field label="Job Address" required error={errors.address}><textarea className={textareaClass} placeholder="Enter complete job address" value={formData.locationAndSalary.address} onChange={(e) => updateFormData((c) => ({ ...c, locationAndSalary: { ...c.locationAndSalary, address: e.target.value } }))} /></Field>
                <Field label="Landmark (Optional)" error={errors.landmark}>
                  <input className={inputClass} placeholder="Enter a nearby landmark" value={formData.locationAndSalary.landmark} onChange={(e) => updateFormData((c) => ({ ...c, locationAndSalary: { ...c.locationAndSalary, landmark: e.target.value } }))} />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
                  <Field label="Salary Range" required error={errors.salaryType}><SelectField value={formData.locationAndSalary.salaryType} placeholder="Select salary type" options={OPERATIONS_POST_JOB_SALARY_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} onChange={(value) => updateFormData((c) => ({ ...c, locationAndSalary: { ...c.locationAndSalary, salaryType: value as OperationsPostJobWizardFormData["locationAndSalary"]["salaryType"] } }))} /></Field>
                  <Field label="Salary Period" required error={errors.salaryPeriod}><SelectField value={formData.locationAndSalary.salaryPeriod} placeholder="Select period" options={OPERATIONS_POST_JOB_SALARY_PERIOD_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} onChange={(value) => updateFormData((c) => ({ ...c, locationAndSalary: { ...c.locationAndSalary, salaryPeriod: value as OperationsPostJobWizardFormData["locationAndSalary"]["salaryPeriod"] } }))} /></Field>
                </div>
                {formData.locationAndSalary.salaryType === "fixed" ? (
                  <Field label="Fixed Salary" required error={errors.incentives}>
                    <input className={inputClass} placeholder="₹ 500" value={formData.locationAndSalary.incentives} onChange={(e) => updateFormData((c) => ({ ...c, locationAndSalary: { ...c.locationAndSalary, incentives: e.target.value } }))} />
                  </Field>
                ) : null}
                {formData.locationAndSalary.salaryType === "range" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Minimum Salary" required error={errors.salaryMin}>
                      <input className={inputClass} placeholder="Enter minimum salary" value={formData.locationAndSalary.salaryMin} onChange={(e) => updateFormData((c) => ({ ...c, locationAndSalary: { ...c.locationAndSalary, salaryMin: e.target.value } }))} />
                    </Field>
                    <Field label="Maximum Salary" required error={errors.salaryMax}>
                      <input className={inputClass} placeholder="Enter maximum salary" value={formData.locationAndSalary.salaryMax} onChange={(e) => updateFormData((c) => ({ ...c, locationAndSalary: { ...c.locationAndSalary, salaryMax: e.target.value } }))} />
                    </Field>
                  </div>
                ) : null}
                <Field label="Additional Perks">
                  <div className="flex flex-wrap gap-2.5 sm:gap-3">
                    {OPERATIONS_POST_JOB_PERK_OPTIONS.map((perk) => (
                      <button
                        key={perk.value}
                        type="button"
                        onClick={() =>
                          updateFormData((c) => ({
                            ...c,
                            locationAndSalary: {
                              ...c.locationAndSalary,
                              perks: c.locationAndSalary.perks.includes(perk.value)
                                ? c.locationAndSalary.perks.filter((p) => p !== perk.value)
                                : [...c.locationAndSalary.perks, perk.value],
                            },
                          }))
                        }
                        className={cn(
                          "inline-flex min-h-10 items-center rounded-md border px-3.5 py-2 text-sm",
                          formData.locationAndSalary.perks.includes(perk.value)
                            ? "border-primary-soft bg-primary-light text-primary"
                            : "border-border bg-surface text-foreground",
                        )}
                      >
                        {perk.label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            ) : null}

            {activeStep === 3 ? (
              <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                <Field label="Education Qualification" required error={errors.education}>
                  <div className="flex flex-wrap gap-2.5 sm:gap-3">
                    {OPERATIONS_POST_JOB_EDUCATION_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          updateFormData((c) => ({
                            ...c,
                            candidateAndInterview: {
                              ...c.candidateAndInterview,
                              education: c.candidateAndInterview.education.includes(option.value)
                                ? c.candidateAndInterview.education.filter((item) => item !== option.value)
                                : [...c.candidateAndInterview.education, option.value],
                            },
                          }))
                        }
                        className={cn(
                          "inline-flex min-h-10 items-center rounded-md border px-3.5 py-2 text-sm",
                          formData.candidateAndInterview.education.includes(option.value)
                            ? "border-primary-soft bg-primary-light text-primary"
                            : "border-border bg-surface text-foreground",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Experience Required" required error={errors.experienceRequired}>
                  <div className="flex flex-wrap gap-2.5 sm:gap-3">
                    {OPERATIONS_POST_JOB_EXPERIENCE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          updateFormData((c) => ({
                            ...c,
                            candidateAndInterview: {
                              ...c.candidateAndInterview,
                              experienceRequired:
                                c.candidateAndInterview.experienceRequired === option.value ? "" : option.value,
                            },
                          }))
                        }
                        className={cn(
                          "inline-flex min-h-10 items-center rounded-md border px-3.5 py-2 text-sm",
                          formData.candidateAndInterview.experienceRequired === option.value
                            ? "border-primary-soft bg-primary-light text-primary"
                            : "border-border bg-surface text-foreground",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Additional Requirements">
                  <div className="flex flex-wrap gap-2.5 sm:gap-3">
                    {[
                      { key: "language" as const, label: "Language" },
                      { key: "gender" as const, label: "Gender" },
                      { key: "age" as const, label: "Age" },
                    ].map((toggle) => {
                      const isActive = formData.candidateAndInterview.additionalRequirements[toggle.key];
                      return (
                        <button
                          key={toggle.key}
                          type="button"
                          onClick={() =>
                            updateFormData((c) => ({
                              ...c,
                              candidateAndInterview: {
                                ...c.candidateAndInterview,
                                additionalRequirements: {
                                  ...c.candidateAndInterview.additionalRequirements,
                                  [toggle.key]: !isActive,
                                },
                              },
                            }))
                          }
                          className={cn(
                            "inline-flex min-h-10 items-center rounded-md border px-5 py-2 text-sm",
                            isActive ? "border-primary-soft bg-primary-light text-primary" : "border-border bg-surface",
                          )}
                        >
                          {toggle.label}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {formData.candidateAndInterview.additionalRequirements.language ? (
                  <Field label="Language Required" error={errors.languages}>
                    <div className="flex flex-wrap gap-2.5 sm:gap-3">
                      {OPERATIONS_POST_JOB_LANGUAGE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            updateFormData((c) => ({
                              ...c,
                              candidateAndInterview: {
                                ...c.candidateAndInterview,
                                languages: c.candidateAndInterview.languages.includes(option.value)
                                  ? c.candidateAndInterview.languages.filter((item) => item !== option.value)
                                  : [...c.candidateAndInterview.languages, option.value],
                              },
                            }))
                          }
                          className={cn(
                            "inline-flex min-h-10 items-center rounded-md border px-3.5 py-2 text-sm",
                            formData.candidateAndInterview.languages.includes(option.value)
                              ? "border-primary-soft bg-primary-light text-primary"
                              : "border-border bg-surface",
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                ) : null}

                {formData.candidateAndInterview.additionalRequirements.gender ? (
                  <Field label="Gender" error={errors.gender}>
                    <div className="flex flex-wrap gap-2.5 sm:gap-3">
                      {OPERATIONS_POST_JOB_GENDER_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            updateFormData((c) => ({
                              ...c,
                              candidateAndInterview: {
                                ...c.candidateAndInterview,
                                gender: c.candidateAndInterview.gender.includes(option.value)
                                  ? c.candidateAndInterview.gender.filter((item) => item !== option.value)
                                  : [...c.candidateAndInterview.gender, option.value],
                              },
                            }))
                          }
                          className={cn(
                            "inline-flex min-h-10 items-center rounded-md border px-3.5 py-2 text-sm",
                            formData.candidateAndInterview.gender.includes(option.value)
                              ? "border-primary-soft bg-primary-light text-primary"
                              : "border-border bg-surface",
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                ) : null}

                {formData.candidateAndInterview.additionalRequirements.age ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Minimum Age" error={errors.ageMin}>
                      <input className={inputClass} inputMode="numeric" value={formData.candidateAndInterview.ageMin} onChange={(e) => updateFormData((c) => ({ ...c, candidateAndInterview: { ...c.candidateAndInterview, ageMin: e.target.value.replace(/\D/g, "") } }))} />
                    </Field>
                    <Field label="Maximum Age" error={errors.ageMax}>
                      <input className={inputClass} inputMode="numeric" value={formData.candidateAndInterview.ageMax} onChange={(e) => updateFormData((c) => ({ ...c, candidateAndInterview: { ...c.candidateAndInterview, ageMax: e.target.value.replace(/\D/g, "") } }))} />
                    </Field>
                  </div>
                ) : null}

                <Field label="Walk-in Interview">
                  <div className="flex gap-3">
                    {(["yes", "no"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          updateFormData((c) => ({
                            ...c,
                            candidateAndInterview: { ...c.candidateAndInterview, walkIn: option },
                          }))
                        }
                        className={cn(
                          "inline-flex min-h-10 min-w-[4.5rem] items-center justify-center rounded-md border px-6 text-sm font-bold",
                          formData.candidateAndInterview.walkIn === option
                            ? "border-primary-soft bg-primary-soft text-surface"
                            : "border-border bg-surface text-foreground",
                        )}
                      >
                        {option === "yes" ? "Yes" : "No"}
                      </button>
                    ))}
                  </div>
                </Field>

                {formData.candidateAndInterview.walkIn === "yes" ? (
                  <>
                    <Field label="Walk-in Interview Address" required error={errors.walkInAddress}>
                      <textarea className={textareaClass} value={formData.candidateAndInterview.walkInAddress} onChange={(e) => updateFormData((c) => ({ ...c, candidateAndInterview: { ...c.candidateAndInterview, walkInAddress: e.target.value } }))} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Start Date" error={errors.walkInStartDate}>
                        <input type="date" className={inputClass} value={formData.candidateAndInterview.walkInStartDate} onChange={(e) => updateFormData((c) => ({ ...c, candidateAndInterview: { ...c.candidateAndInterview, walkInStartDate: e.target.value } }))} />
                      </Field>
                      <Field label="End Date" error={errors.walkInEndDate}>
                        <input type="date" min={formData.candidateAndInterview.walkInStartDate || undefined} className={inputClass} value={formData.candidateAndInterview.walkInEndDate} onChange={(e) => updateFormData((c) => ({ ...c, candidateAndInterview: { ...c.candidateAndInterview, walkInEndDate: e.target.value } }))} />
                      </Field>
                      <Field label="Start Time" error={errors.walkInStartTime}>
                        <SelectField value={formData.candidateAndInterview.walkInStartTime} placeholder="Start time" options={OPERATIONS_POST_JOB_WALK_IN_TIME_OPTIONS} onChange={(value) => updateFormData((c) => ({ ...c, candidateAndInterview: { ...c.candidateAndInterview, walkInStartTime: value } }))} />
                      </Field>
                      <Field label="End Time" error={errors.walkInEndTime}>
                        <SelectField value={formData.candidateAndInterview.walkInEndTime} placeholder="End time" options={OPERATIONS_POST_JOB_WALK_IN_TIME_OPTIONS} onChange={(value) => updateFormData((c) => ({ ...c, candidateAndInterview: { ...c.candidateAndInterview, walkInEndTime: value } }))} />
                      </Field>
                    </div>
                  </>
                ) : null}

                <Field label="Contact Name" required error={errors.contactName}>
                  <input className={inputClass} placeholder="Name" value={formData.candidateAndInterview.contactName} onChange={(e) => updateFormData((c) => ({ ...c, candidateAndInterview: { ...c.candidateAndInterview, contactName: e.target.value } }))} />
                </Field>
                <Field label="Contact Email" required error={errors.contactEmail}>
                  <input className={inputClass} type="email" placeholder="Email" value={formData.candidateAndInterview.contactEmail} onChange={(e) => updateFormData((c) => ({ ...c, candidateAndInterview: { ...c.candidateAndInterview, contactEmail: e.target.value } }))} />
                </Field>
                <Field label="Contact Mobile" required error={errors.contactMobile}>
                  <input className={inputClass} inputMode="numeric" maxLength={10} placeholder="Mobile Number" value={formData.candidateAndInterview.contactMobile} onChange={(e) => updateFormData((c) => ({ ...c, candidateAndInterview: { ...c.candidateAndInterview, contactMobile: e.target.value.replace(/\D/g, "") } }))} />
                </Field>
                <Field label="Other Instructions" error={errors.otherInstructions}>
                  <textarea className={textareaClass} maxLength={OPERATIONS_POST_JOB_LONG_TEXT_MAX_LENGTH} placeholder="Mention required documents, or any other interview instruction" value={formData.candidateAndInterview.otherInstructions} onChange={(e) => updateFormData((c) => ({ ...c, candidateAndInterview: { ...c.candidateAndInterview, otherInstructions: e.target.value } }))} />
                </Field>
              </div>
            ) : null}
          </section>

          <OperationsPostJobEmployerSelect selectedEmployer={selectedEmployer} onSelect={setSelectedEmployer} disabled={isSubmitting} />

          {actionError ? <p className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs font-medium text-danger">{actionError}</p> : null}

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-md border border-primary-soft bg-surface px-6 text-sm font-bold text-primary-soft"
              disabled={activeStep === 1 || isSubmitting}
              onClick={() => {
                setErrors({});
                setActiveStep((s) => Math.max(1, s - 1) as OperationsPostJobActiveStep);
              }}
            >
              Back
            </button>
            {isEditingNonDraft ? (
              <>
                {activeStep < 3 ? (
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center rounded-md border border-border-subtle bg-surface px-6 text-sm font-bold text-foreground"
                    disabled={isSubmitting}
                    onClick={handleContinue}
                  >
                    Continue
                  </button>
                ) : null}
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-primary-soft px-8 text-sm font-bold text-white disabled:opacity-50"
                  disabled={isSubmitting}
                  onClick={() => void handleSaveChanges()}
                >
                  {isSubmitting ? "Saving…" : "Save Changes"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-border-subtle bg-surface px-6 text-sm font-bold text-foreground"
                  disabled={isSubmitting}
                  onClick={() => void handleSaveDraft()}
                >
                  Save Draft
                </button>
                {activeStep < 3 ? (
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center rounded-md bg-primary-soft px-8 text-sm font-bold text-white"
                    disabled={isSubmitting}
                    onClick={handleContinue}
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center rounded-md bg-primary-soft px-8 text-sm font-bold text-white disabled:opacity-50"
                    disabled={isSubmitting || !publishReady}
                    onClick={() => void handlePublish()}
                  >
                    Publish Job
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <OperationsPostJobWhatsAppPreview
                formData={formData}
                selectedEmployer={selectedEmployer}
                employerAssigned={Boolean(selectedEmployer?.id)}
              />
      </div>

      {statusMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 sm:bottom-6"
        >
          <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-surface px-4 py-2.5 text-xs font-semibold text-foreground shadow-lg">
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary-light text-primary">
              <Check className="size-3" strokeWidth={3} aria-hidden="true" />
            </span>
            {statusMessage}
          </div>
        </div>
      ) : null}
    </div>
  );
}

