import { ChevronDown, Loader2, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  OPERATIONS_POST_JOB_ADDITIONAL_REQUIREMENT_TOGGLES,
  OPERATIONS_POST_JOB_CONTRACT_PERIOD_UNITS,
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
import {
  EMPLOYER_REGISTER_COMPANY_STRENGTH_OPTIONS,
  EMPLOYER_REGISTER_INDUSTRY_OPTIONS,
  getEmployerRegisterBusinessCategoryOptions,
} from "../../../../constants/operations-post-job-company-options";
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
  validateOperationsPostJobForPublish,
  validateOperationsPostJobStep,
} from "../../../../utils/operations-post-job-validation";
import { OperationsBadge } from "../../../ui/OperationsBadge";
import { JobDescriptionEditor } from "../../../ui/JobDescriptionEditor";
import { OperationsPostJobActionBar } from "./OperationsPostJobActionBar";
import { OperationsPostJobEmployerSelect } from "./OperationsPostJobEmployerSelect";
import { OperationsPostJobLivePreview } from "./OperationsPostJobLivePreview";
import { OperationsPostJobPlaceAutocomplete } from "./OperationsPostJobPlaceAutocomplete";
import { OperationsPostJobStepper } from "./OperationsPostJobStepper";

const cardClassName =
  "flex flex-col rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5 lg:p-6";
const cardHeadingClassName = "shrink-0 text-lg font-bold text-foreground sm:text-xl";
const formShellClassName = "mt-4 flex flex-col overflow-x-hidden sm:mt-5 lg:mt-6";
const fieldLabelClassName = "text-sm font-bold text-foreground";
const fieldStackClassName = "flex min-w-0 flex-col gap-2";
const inputClassName =
  "h-12 w-full rounded-md border border-border bg-surface px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20";
const textareaClassName =
  "min-h-[5.5rem] w-full resize-y rounded-md border border-border bg-surface px-3.5 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 sm:min-h-[6.5rem]";
const chipClassName =
  "inline-flex min-h-10 max-w-full items-center gap-2 rounded-md border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
const toggleClassName =
  "inline-flex min-h-10 items-center justify-center rounded-md border px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
const walkInSegmentClassName =
  "inline-flex min-h-10 min-w-[4.5rem] items-center justify-center rounded-md border px-6 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

function inputClassNameWithError(error?: string) {
  return cn(
    inputClassName,
    error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
  );
}

function sanitizeNumericInput(value: string) {
  return value.replace(/\D/g, "");
}

function parsePartTimeManualStoredValue(value: string): {
  time: string;
  meridiem: "AM" | "PM";
} {
  const trimmed = value.trim();
  if (!trimmed) {
    return { time: "", meridiem: "AM" };
  }
  const match = /^(.+?)\s*(AM|PM)$/i.exec(trimmed);
  if (!match) {
    return { time: trimmed, meridiem: "AM" };
  }
  return {
    time: match[1].trim(),
    meridiem: match[2].toUpperCase() as "AM" | "PM",
  };
}

function buildPartTimeManualStoredValue(time: string, meridiem: "AM" | "PM") {
  const normalizedTime = time.trim();
  if (!normalizedTime) {
    return "";
  }
  return `${normalizedTime} ${meridiem}`;
}

function FormField({
  id,
  label,
  children,
  error,
  className,
}: {
  id: string;
  label: string;
  children: ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <div className={cn(fieldStackClassName, className)}>
      <label htmlFor={id} className={fieldLabelClassName}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
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
      <span
        className={cn(
          "size-1.5 rounded-full bg-surface transition-opacity",
          checked ? "opacity-100" : "opacity-0",
        )}
      />
    </span>
  );
}

function SelectInput({
  id,
  value,
  placeholder,
  options,
  onChange,
  hasError,
  ariaLabel,
}: {
  id: string;
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  hasError?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          inputClassName,
          "cursor-pointer appearance-none pr-10",
          !value && "text-muted",
          hasError && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
        )}
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
      <ChevronDown
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground/70"
        strokeWidth={2}
        aria-hidden="true"
      />
    </div>
  );
}

function ContractPeriodField({
  id,
  value,
  onChange,
  error,
  ariaLabel,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  ariaLabel: string;
}) {
  const { amount, unit } = parseContractPeriodStoredValue(value);
  return (
    <div className={cn(
      "flex h-12 w-full overflow-hidden rounded-md border border-border bg-surface text-sm text-foreground transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
      error && "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20",
    )}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={amount}
        placeholder="0"
        aria-label={ariaLabel}
        onChange={(event) =>
          onChange(buildContractPeriodStoredValue(event.target.value, unit))
        }
        className="min-w-0 flex-1 border-0 bg-transparent px-3.5 outline-none placeholder:text-muted"
      />
      <div className="relative flex shrink-0 items-center border-l border-border">
        <select
          value={unit}
          aria-label={`${ariaLabel} unit`}
          onChange={(event) =>
            onChange(buildContractPeriodStoredValue(amount, event.target.value as typeof unit))
          }
          className="h-full min-w-[5.75rem] cursor-pointer appearance-none border-0 bg-transparent py-0 pl-3 pr-8 text-sm outline-none"
        >
          {OPERATIONS_POST_JOB_CONTRACT_PERIOD_UNITS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-foreground/70"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function ManualTimeField({
  id,
  value,
  placeholder,
  onChange,
  error,
  ariaLabel,
}: {
  id: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  error?: string;
  ariaLabel: string;
}) {
  const { time, meridiem } = parsePartTimeManualStoredValue(value);
  return (
    <div className={cn(
      "flex h-12 w-full overflow-hidden rounded-md border border-border bg-surface text-sm text-foreground transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
      error && "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20",
    )}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={time}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(event) =>
          onChange(
            buildPartTimeManualStoredValue(
              event.target.value.replace(/[^\d:]/g, "").slice(0, 5),
              meridiem,
            ),
          )
        }
        className="min-w-0 flex-1 border-0 bg-transparent px-3.5 outline-none placeholder:text-muted"
      />
      <div className="relative flex shrink-0 items-center border-l border-border">
        <select
          value={meridiem}
          aria-label={`${ariaLabel} AM or PM`}
          onChange={(event) =>
            onChange(buildPartTimeManualStoredValue(time, event.target.value as "AM" | "PM"))
          }
          className="h-full min-w-[4.5rem] cursor-pointer appearance-none border-0 bg-transparent py-0 pl-3 pr-8 text-sm outline-none"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-foreground/70"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function ChipButton({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onClick}
      className={cn(
        chipClassName,
        isSelected
          ? "border-primary-soft bg-primary-light text-primary"
          : "border-border bg-surface text-foreground hover:border-primary/20",
      )}
    >
      <span className="truncate">{label}</span>
      {isSelected ? (
        <X className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <Plus className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
      )}
    </button>
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

export function OperationsPostJobWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editJobId = searchParams.get("edit")?.trim() ?? "";

  const detailQuery = useOperationsJobDetail(editJobId || undefined);
  const createDraftMutation = useCreateOperationsJobDraftMutation();
  const updateDraftMutation = useUpdateOperationsJobDraftMutation();
  const assignEmployerMutation = useAssignOperationsJobEmployerMutation();
  const publishMutation = usePublishOperationsJobMutation();

  const [formData, setFormData] = useState<OperationsPostJobWizardFormData>(
    OPERATIONS_POST_JOB_INITIAL_WIZARD_DATA,
  );
  const [activeStep, setActiveStep] =
    useState<OperationsPostJobActiveStep>(OPERATIONS_POST_JOB_INITIAL_STEP);
  const [selectedEmployer, setSelectedEmployer] =
    useState<OperationsEmployerOption | null>(null);
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
    if (!editJobId || !detailQuery.data || initialized) {
      return;
    }

    const mapped = mapOperationsJobDetailToWizardState(detailQuery.data);
    setFormData(mapped.formData);
    setActiveStep(mapped.activeStep);
    setSavedJobId(detailQuery.data.jobId);

    if (detailQuery.data.employerAssigned && detailQuery.data.employer.id) {
      void fetchOperationsEmployerById(detailQuery.data.employer.id)
        .then(setSelectedEmployer)
        .catch(() => {
          setSelectedEmployer({
            ...detailQuery.data.employer,
            accountType: "",
            displayName: detailQuery.data.employer.companyName,
            establishmentName: "",
            whatsappNumber: "",
            emailAddress: "",
            city: "",
            state: "",
          });
        });
    }

    setInitialized(true);
  }, [detailQuery.data, editJobId, initialized]);

  const previewJob = useMemo(
    () => mapWizardDataToPreviewDetail(formData, selectedEmployer),
    [formData, selectedEmployer],
  );

  const publishValidationErrors = useMemo(
    () => validateOperationsPostJobForPublish(formData),
    [formData],
  );

  const publishReady =
    Object.keys(publishValidationErrors).length === 0 &&
    Boolean(selectedEmployer?.id);

  const workflowState = resolveOperationsPostJobWorkflowState({
    employerAssigned: Boolean(selectedEmployer?.id),
    publishReady,
    status: previewJob.status,
  });

  function updateFormData(
    updater: (current: OperationsPostJobWizardFormData) => OperationsPostJobWizardFormData,
  ) {
    setFormData((current) => updater(current));
    setActionError(null);
    setStatusMessage(null);
  }

  async function persistDraft(completedStep: OperationsPostJobActiveStep) {
    if (!hasMeaningfulOperationsPostJobContent(formData)) {
      setActionError("Add at least one job field before saving a draft.");
      return null;
    }

    const payload = mapWizardDataToOperationsDraftPayload(
      formData,
      completedStep,
      selectedEmployer?.id ?? null,
    );

    if (savedJobId) {
      const result = await updateDraftMutation.mutateAsync({
        jobId: savedJobId,
        payload,
      });
      setSavedJobId(result.jobId);
      return result;
    }

    const result = await createDraftMutation.mutateAsync(payload);
    setSavedJobId(result.jobId);
    return result;
  }

  async function handleSaveDraft() {
    setActionError(null);
    try {
      await persistDraft(activeStep);
      setStatusMessage("Draft saved.");
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Unable to save draft."));
    }
  }

  async function handleNextStep() {
    const stepErrors = validateOperationsPostJobStep(activeStep, formData);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      return;
    }

    if (activeStep < 3) {
      setActiveStep((step) => (step + 1) as OperationsPostJobActiveStep);
      return;
    }
  }

  async function handlePublish() {
    const allErrors = validateOperationsPostJobForPublish(formData);
    setErrors(allErrors);

    if (!selectedEmployer?.id) {
      setActionError("Assign an employer before publishing this job.");
      return;
    }

    if (Object.keys(allErrors).length > 0) {
      setActionError("Complete all required fields before publishing.");
      return;
    }

    setActionError(null);

    try {
      let jobId = savedJobId;
      if (!jobId) {
        const draft = await persistDraft(3);
        jobId = draft?.jobId ?? "";
      } else {
        await persistDraft(3);
      }

      if (!jobId) {
        throw new Error("Draft job id is missing.");
      }

      if (
        selectedEmployer.id &&
        detailQuery.data?.employer.id !== selectedEmployer.id
      ) {
        await assignEmployerMutation.mutateAsync({
          jobId,
          employerId: selectedEmployer.id,
        });
      }

      await publishMutation.mutateAsync({
        jobId,
        payload: mapWizardDataToPublishPayload(formData),
      });

      setStatusMessage("Job published successfully.");
      navigate(operationsJobDetailPath(jobId));
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Unable to publish job."));
    }
  }

  if (editJobId && detailQuery.isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-border-subtle bg-surface">
        <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Loading job draft…</span>
      </div>
    );
  }

  if (editJobId && detailQuery.isError) {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
        Unable to load this job draft. Return to the jobs list and try again.
      </div>
    );
  }

  const businessCategoryOptions = getEmployerRegisterBusinessCategoryOptions(
    formData.jobInformation.industry,
  );

  const togglePerk = (perk: (typeof OPERATIONS_POST_JOB_PERK_OPTIONS)[number]["value"]) => {
    updateFormData((current) => ({
      ...current,
      locationAndSalary: {
        ...current.locationAndSalary,
        perks: current.locationAndSalary.perks.includes(perk)
          ? current.locationAndSalary.perks.filter((item) => item !== perk)
          : [...current.locationAndSalary.perks, perk],
      },
    }));
  };

  return (
    <div className="flex min-w-0 flex-col gap-3 pb-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <OperationsBadge variant="support">{workflowState.label}</OperationsBadge>
          {savedJobId ? (
            <span className="text-[11px] font-medium text-muted">
              Job ID: <span className="text-foreground">{savedJobId}</span>
            </span>
          ) : null}
        </div>
        <Link
          to={OPERATIONS_ROUTES.JOBS}
          className="inline-flex size-8 items-center justify-center rounded-lg border border-border-subtle bg-surface text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label="Close post job"
        >
          <X className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <OperationsPostJobStepper
        activeStep={activeStep}
        onStepChange={setActiveStep}
      />

      <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-3">
          {activeStep === 1 ? (
            <section aria-labelledby="ops-job-information-heading" className={cardClassName}>
              <h2 id="ops-job-information-heading" className={cardHeadingClassName}>
                Job Information
              </h2>
              <div className={formShellClassName}>
                <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
                    <FormField
                      id="company-details"
                      label="Company Name"
                      error={errors.companyDetails}
                    >
                      <input
                        id="company-details"
                        type="text"
                        value={formData.jobInformation.companyDetails}
                        onChange={(event) =>
                          updateFormData((current) => ({
                            ...current,
                            jobInformation: {
                              ...current.jobInformation,
                              companyDetails: event.target.value,
                            },
                          }))
                        }
                        placeholder="Enter company name"
                        className={inputClassNameWithError(errors.companyDetails)}
                        autoComplete="organization"
                      />
                    </FormField>
                    <FormField id="job-title" label="Job Title / Designation" error={errors.jobTitle}>
                      <input
                        id="job-title"
                        type="text"
                        value={formData.jobInformation.jobTitle}
                        onChange={(event) =>
                          updateFormData((current) => ({
                            ...current,
                            jobInformation: {
                              ...current.jobInformation,
                              jobTitle: event.target.value,
                            },
                          }))
                        }
                        placeholder="Enter Job Title"
                        className={inputClassNameWithError(errors.jobTitle)}
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
                    <FormField id="job-company-size" label="Company Size" error={errors.companySize}>
                      <SelectInput
                        id="job-company-size"
                        value={formData.jobInformation.companySize}
                        placeholder="Select Company Size"
                        hasError={Boolean(errors.companySize)}
                        options={[...EMPLOYER_REGISTER_COMPANY_STRENGTH_OPTIONS]}
                        onChange={(value) =>
                          updateFormData((current) => ({
                            ...current,
                            jobInformation: {
                              ...current.jobInformation,
                              companySize: value,
                            },
                          }))
                        }
                      />
                    </FormField>
                    <FormField id="job-industry" label="Industry" error={errors.industry}>
                      <SelectInput
                        id="job-industry"
                        value={formData.jobInformation.industry}
                        placeholder="Select Industry"
                        hasError={Boolean(errors.industry)}
                        options={[...EMPLOYER_REGISTER_INDUSTRY_OPTIONS]}
                        onChange={(value) =>
                          updateFormData((current) => ({
                            ...current,
                            jobInformation: {
                              ...current.jobInformation,
                              industry: value,
                              businessCategory: "",
                            },
                          }))
                        }
                      />
                    </FormField>
                  </div>

                  <FormField
                    id="job-business-category"
                    label="Business Category"
                    error={errors.businessCategory}
                  >
                    <SelectInput
                      id="job-business-category"
                      value={formData.jobInformation.businessCategory}
                      placeholder="Select Business Category"
                      hasError={Boolean(errors.businessCategory)}
                      options={[...businessCategoryOptions]}
                      onChange={(value) =>
                        updateFormData((current) => ({
                          ...current,
                          jobInformation: {
                            ...current.jobInformation,
                            businessCategory: value,
                          },
                        }))
                      }
                    />
                  </FormField>

                  <fieldset id="job-type-group" className="space-y-3">
                    <legend className={fieldLabelClassName}>Job Type</legend>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {OPERATIONS_POST_JOB_TYPE_OPTIONS.map((option) => {
                        const checked = formData.jobInformation.jobType === option.value;
                        return (
                          <label
                            key={option.value}
                            className={cn(
                              "flex min-h-11 cursor-pointer items-center gap-3 rounded-md border bg-surface px-4 py-2.5 transition-colors sm:min-h-12 sm:py-3",
                              checked
                                ? "border-primary-soft ring-1 ring-primary-soft/30"
                                : errors.jobType
                                  ? "border-red-500"
                                  : "border-border hover:border-primary/20",
                            )}
                          >
                            <input
                              type="radio"
                              name="job-type"
                              value={option.value}
                              checked={checked}
                              onChange={() =>
                                updateFormData((current) => ({
                                  ...current,
                                  jobInformation: {
                                    ...current.jobInformation,
                                    jobType: option.value,
                                    partTimeSchedule: "",
                                    partTimeStartTime: "",
                                    partTimeEndTime: "",
                                    partTimeFlexibleHours: "",
                                  },
                                }))
                              }
                              className="sr-only"
                            />
                            <RadioIndicator checked={checked} />
                            <span className="text-sm font-medium text-foreground">{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                    {errors.jobType ? (
                      <p className="text-xs font-medium text-red-600" role="alert">
                        {errors.jobType}
                      </p>
                    ) : null}
                  </fieldset>

                  {formData.jobInformation.jobType === "part-time" ? (
                    <fieldset id="part-time-schedule-group" className="space-y-3">
                      <legend className={fieldLabelClassName}>Part-time Schedule</legend>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {OPERATIONS_POST_JOB_PART_TIME_SCHEDULE_OPTIONS.map((option) => {
                          const checked = formData.jobInformation.partTimeSchedule === option.value;
                          return (
                            <label
                              key={option.value}
                              className={cn(
                                "flex min-h-11 cursor-pointer items-center gap-3 rounded-md border bg-surface px-4 py-2.5 transition-colors sm:min-h-12 sm:py-3",
                                checked
                                  ? "border-primary-soft ring-1 ring-primary-soft/30"
                                  : errors.partTimeSchedule
                                    ? "border-red-500"
                                    : "border-border hover:border-primary/20",
                              )}
                            >
                              <input
                                type="radio"
                                name="part-time-schedule"
                                value={option.value}
                                checked={checked}
                                onChange={() =>
                                  updateFormData((current) => ({
                                    ...current,
                                    jobInformation: {
                                      ...current.jobInformation,
                                      partTimeSchedule: option.value,
                                      partTimeFlexibleHours:
                                        option.value === "fixed-timings"
                                          ? ""
                                          : current.jobInformation.partTimeFlexibleHours,
                                      partTimeStartTime:
                                        option.value === "fixed-timings"
                                          ? current.jobInformation.partTimeStartTime
                                          : "",
                                      partTimeEndTime:
                                        option.value === "fixed-timings"
                                          ? current.jobInformation.partTimeEndTime
                                          : "",
                                    },
                                  }))
                                }
                                className="sr-only"
                              />
                              <RadioIndicator checked={checked} />
                              <span className="text-sm font-medium text-foreground">{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                      {errors.partTimeSchedule ? (
                        <p className="text-xs font-medium text-red-600" role="alert">
                          {errors.partTimeSchedule}
                        </p>
                      ) : null}

                      {formData.jobInformation.partTimeSchedule === "fixed-timings" ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div className={fieldStackClassName}>
                            <ManualTimeField
                              id="part-time-start-time"
                              value={formData.jobInformation.partTimeStartTime}
                              placeholder="Start time"
                              ariaLabel="Part-time start time"
                              error={errors.partTimeStartTime}
                              onChange={(value) =>
                                updateFormData((current) => ({
                                  ...current,
                                  jobInformation: {
                                    ...current.jobInformation,
                                    partTimeStartTime: value,
                                  },
                                }))
                              }
                            />
                            {errors.partTimeStartTime ? (
                              <p className="text-xs font-medium text-red-600" role="alert">
                                {errors.partTimeStartTime}
                              </p>
                            ) : null}
                          </div>
                          <div className={fieldStackClassName}>
                            <ManualTimeField
                              id="part-time-end-time"
                              value={formData.jobInformation.partTimeEndTime}
                              placeholder="End time"
                              ariaLabel="Part-time end time"
                              error={errors.partTimeEndTime}
                              onChange={(value) =>
                                updateFormData((current) => ({
                                  ...current,
                                  jobInformation: {
                                    ...current.jobInformation,
                                    partTimeEndTime: value,
                                  },
                                }))
                              }
                            />
                            {errors.partTimeEndTime ? (
                              <p className="text-xs font-medium text-red-600" role="alert">
                                {errors.partTimeEndTime}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      {formData.jobInformation.partTimeSchedule === "flexible-hours" ? (
                        <FormField
                          id="part-time-flexible-hours"
                          label="Flexible Hours"
                          error={errors.partTimeFlexibleHours}
                        >
                          <SelectInput
                            id="part-time-flexible-hours"
                            value={formData.jobInformation.partTimeFlexibleHours}
                            placeholder="Select hours"
                            options={OPERATIONS_POST_JOB_FLEXIBLE_HOURS_OPTIONS}
                            hasError={Boolean(errors.partTimeFlexibleHours)}
                            onChange={(value) =>
                              updateFormData((current) => ({
                                ...current,
                                jobInformation: {
                                  ...current.jobInformation,
                                  partTimeFlexibleHours: value,
                                },
                              }))
                            }
                          />
                        </FormField>
                      ) : null}
                    </fieldset>
                  ) : null}

                  {formData.jobInformation.jobType === "contract" ? (
                    <fieldset className="space-y-3">
                      <legend className={fieldLabelClassName}>Contract Period</legend>
                      <div className="grid grid-cols-2 gap-3">
                        <div className={fieldStackClassName}>
                          <ContractPeriodField
                            id="contract-period-from"
                            value={formData.jobInformation.contractPeriodFrom}
                            ariaLabel="Contract period start"
                            error={errors.contractPeriodFrom}
                            onChange={(value) =>
                              updateFormData((current) => ({
                                ...current,
                                jobInformation: {
                                  ...current.jobInformation,
                                  contractPeriodFrom: value,
                                },
                              }))
                            }
                          />
                          {errors.contractPeriodFrom ? (
                            <p className="text-xs font-medium text-red-600" role="alert">
                              {errors.contractPeriodFrom}
                            </p>
                          ) : null}
                        </div>
                        <div className={fieldStackClassName}>
                          <ContractPeriodField
                            id="contract-period-to"
                            value={formData.jobInformation.contractPeriodTo}
                            ariaLabel="Contract period end"
                            error={errors.contractPeriodTo}
                            onChange={(value) =>
                              updateFormData((current) => ({
                                ...current,
                                jobInformation: {
                                  ...current.jobInformation,
                                  contractPeriodTo: value,
                                },
                              }))
                            }
                          />
                          {errors.contractPeriodTo ? (
                            <p className="text-xs font-medium text-red-600" role="alert">
                              {errors.contractPeriodTo}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </fieldset>
                  ) : null}

                  <fieldset id="work-mode-group" className="space-y-3">
                    <legend className={fieldLabelClassName}>Work Mode</legend>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {OPERATIONS_POST_JOB_WORK_MODE_OPTIONS.map((option) => {
                        const checked = formData.jobInformation.workMode === option.value;
                        return (
                          <label
                            key={option.value}
                            className={cn(
                              "flex min-h-[4.5rem] cursor-pointer items-start gap-2.5 rounded-md border bg-surface px-4 py-3.5 transition-colors md:min-h-[5.25rem] md:px-4 md:py-4",
                              checked
                                ? "border-primary-soft ring-1 ring-primary-soft/30"
                                : errors.workMode
                                  ? "border-red-500"
                                  : "border-border hover:border-primary/20",
                            )}
                          >
                            <input
                              type="radio"
                              name="work-mode"
                              value={option.value}
                              checked={checked}
                              onChange={() =>
                                updateFormData((current) => ({
                                  ...current,
                                  jobInformation: {
                                    ...current.jobInformation,
                                    workMode: option.value,
                                  },
                                }))
                              }
                              className="sr-only"
                            />
                            <RadioIndicator checked={checked} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate whitespace-nowrap text-[0.6875rem] font-bold leading-none text-foreground sm:text-xs lg:text-[0.8125rem]">
                                {option.label}
                              </span>
                              <span className="mt-1.5 block text-[0.625rem] leading-snug text-muted sm:text-[0.6875rem] lg:text-xs">
                                {option.description}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {errors.workMode ? (
                      <p className="text-xs font-medium text-red-600" role="alert">
                        {errors.workMode}
                      </p>
                    ) : null}
                  </fieldset>

                  <FormField id="job-vacancies" label="Number of Vacancies" error={errors.vacancies}>
                    <input
                      id="job-vacancies"
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      value={formData.jobInformation.vacancies}
                      onChange={(event) =>
                        updateFormData((current) => ({
                          ...current,
                          jobInformation: {
                            ...current.jobInformation,
                            vacancies: event.target.value,
                          },
                        }))
                      }
                      placeholder="Select number of vacancies"
                      className={inputClassNameWithError(errors.vacancies)}
                    />
                  </FormField>

                  <FormField id="job-description" label="Job Description" error={errors.jobDescription}>
                    <JobDescriptionEditor
                      id="job-description"
                      value={formData.jobInformation.jobDescription}
                      onChange={(next) =>
                        updateFormData((current) => ({
                          ...current,
                          jobInformation: {
                            ...current.jobInformation,
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
                  </FormField>
                </div>
              </div>
            </section>
          ) : null}

          {activeStep === 2 ? (
            <section aria-labelledby="ops-location-salary-heading" className={cardClassName}>
              <h2 id="ops-location-salary-heading" className={cardHeadingClassName}>
                Location & Salary
              </h2>
              <div className={formShellClassName}>
                <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
                    <FormField id="job-state" label="State" error={errors.state}>
                      <OperationsPostJobPlaceAutocomplete
                        id="job-state"
                        mode="state"
                        value={formData.locationAndSalary.state}
                        placeholder="Search state"
                        hasError={Boolean(errors.state)}
                        onChange={(value) =>
                          updateFormData((current) => ({
                            ...current,
                            locationAndSalary: {
                              ...current.locationAndSalary,
                              state: value,
                              city: "",
                            },
                          }))
                        }
                        onSelect={(suggestion) =>
                          updateFormData((current) => ({
                            ...current,
                            locationAndSalary: {
                              ...current.locationAndSalary,
                              state: suggestion.state,
                              city: "",
                            },
                          }))
                        }
                      />
                    </FormField>
                    <FormField id="job-city" label="City" error={errors.city}>
                      <OperationsPostJobPlaceAutocomplete
                        id="job-city"
                        mode="city"
                        value={formData.locationAndSalary.city}
                        selectedState={formData.locationAndSalary.state}
                        disabled={!formData.locationAndSalary.state.trim()}
                        placeholder={
                          formData.locationAndSalary.state.trim()
                            ? "Search city"
                            : "Select a state first"
                        }
                        hasError={Boolean(errors.city)}
                        onChange={(value) =>
                          updateFormData((current) => ({
                            ...current,
                            locationAndSalary: {
                              ...current.locationAndSalary,
                              city: value,
                            },
                          }))
                        }
                        onSelect={(suggestion) =>
                          updateFormData((current) => ({
                            ...current,
                            locationAndSalary: {
                              ...current.locationAndSalary,
                              city: suggestion.city,
                            },
                          }))
                        }
                      />
                    </FormField>
                  </div>

                  <FormField id="job-address" label="Job Address" error={errors.address}>
                    <textarea
                      id="job-address"
                      value={formData.locationAndSalary.address}
                      onChange={(event) =>
                        updateFormData((current) => ({
                          ...current,
                          locationAndSalary: {
                            ...current.locationAndSalary,
                            address: event.target.value,
                          },
                        }))
                      }
                      placeholder="Enter complete job address"
                      className={cn(
                        textareaClassName,
                        errors.address && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                      )}
                    />
                  </FormField>

                  <FormField id="job-landmark" label="Landmark (Optional)" error={errors.landmark}>
                    <input
                      id="job-landmark"
                      type="text"
                      value={formData.locationAndSalary.landmark}
                      onChange={(event) =>
                        updateFormData((current) => ({
                          ...current,
                          locationAndSalary: {
                            ...current.locationAndSalary,
                            landmark: event.target.value,
                          },
                        }))
                      }
                      placeholder="Enter a nearby landmark"
                      className={inputClassName}
                    />
                  </FormField>

                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-foreground sm:text-lg">Salary</h3>
                    <div
                      className={cn(
                        "grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6",
                        formData.locationAndSalary.salaryType === "range" &&
                          "sm:grid-cols-[minmax(10.5rem,13rem)_minmax(10.5rem,13rem)_minmax(0,1fr)_minmax(0,1fr)]",
                        formData.locationAndSalary.salaryType === "fixed" &&
                          "sm:grid-cols-[minmax(10.5rem,13rem)_minmax(10.5rem,13rem)_minmax(10.5rem,13rem)]",
                        !formData.locationAndSalary.salaryType && "sm:grid-cols-2 sm:max-w-[28rem]",
                      )}
                    >
                      <FormField id="salary-type" label="Salary Range" error={errors.salaryType}>
                        <SelectInput
                          id="salary-type"
                          value={formData.locationAndSalary.salaryType}
                          placeholder="Select salary type"
                          hasError={Boolean(errors.salaryType)}
                          options={OPERATIONS_POST_JOB_SALARY_TYPE_OPTIONS.map((option) => ({
                            value: option.value,
                            label: option.label,
                          }))}
                          onChange={(value) =>
                            updateFormData((current) => ({
                              ...current,
                              locationAndSalary: {
                                ...current.locationAndSalary,
                                salaryType:
                                  value as OperationsPostJobWizardFormData["locationAndSalary"]["salaryType"],
                              },
                            }))
                          }
                        />
                      </FormField>

                      <FormField id="salary-period" label="Salary Period" error={errors.salaryPeriod}>
                        <SelectInput
                          id="salary-period"
                          value={formData.locationAndSalary.salaryPeriod}
                          placeholder="Select period"
                          hasError={Boolean(errors.salaryPeriod)}
                          options={OPERATIONS_POST_JOB_SALARY_PERIOD_OPTIONS.map((option) => ({
                            value: option.value,
                            label: option.label,
                          }))}
                          onChange={(value) =>
                            updateFormData((current) => ({
                              ...current,
                              locationAndSalary: {
                                ...current.locationAndSalary,
                                salaryPeriod:
                                  value as OperationsPostJobWizardFormData["locationAndSalary"]["salaryPeriod"],
                              },
                            }))
                          }
                        />
                      </FormField>

                      {formData.locationAndSalary.salaryType === "fixed" ? (
                        <FormField
                          id="salary-incentives"
                          label="Fixed Salary"
                          error={errors.incentives}
                        >
                          <input
                            id="salary-incentives"
                            type="text"
                            inputMode="numeric"
                            value={formData.locationAndSalary.incentives}
                            onChange={(event) =>
                              updateFormData((current) => ({
                                ...current,
                                locationAndSalary: {
                                  ...current.locationAndSalary,
                                  incentives: event.target.value,
                                },
                              }))
                            }
                            placeholder="₹ 500"
                            className={inputClassNameWithError(errors.incentives)}
                          />
                        </FormField>
                      ) : null}

                      {formData.locationAndSalary.salaryType === "range" ? (
                        <>
                          <FormField id="salary-min" label="Minimum Salary" error={errors.salaryMin}>
                            <input
                              id="salary-min"
                              type="text"
                              inputMode="numeric"
                              value={formData.locationAndSalary.salaryMin}
                              onChange={(event) =>
                                updateFormData((current) => ({
                                  ...current,
                                  locationAndSalary: {
                                    ...current.locationAndSalary,
                                    salaryMin: event.target.value,
                                  },
                                }))
                              }
                              placeholder="Enter minimum salary"
                              className={inputClassNameWithError(errors.salaryMin)}
                            />
                          </FormField>
                          <FormField id="salary-max" label="Maximum Salary" error={errors.salaryMax}>
                            <input
                              id="salary-max"
                              type="text"
                              inputMode="numeric"
                              value={formData.locationAndSalary.salaryMax}
                              onChange={(event) =>
                                updateFormData((current) => ({
                                  ...current,
                                  locationAndSalary: {
                                    ...current.locationAndSalary,
                                    salaryMax: event.target.value,
                                  },
                                }))
                              }
                              placeholder="Enter maximum salary"
                              className={inputClassNameWithError(errors.salaryMax)}
                            />
                          </FormField>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <fieldset className="space-y-3">
                    <legend className={fieldLabelClassName}>Additional Perks</legend>
                    <div className="flex flex-wrap gap-2.5 sm:gap-3">
                      {OPERATIONS_POST_JOB_PERK_OPTIONS.map((perk) => (
                        <ChipButton
                          key={perk.value}
                          label={perk.label}
                          isSelected={formData.locationAndSalary.perks.includes(perk.value)}
                          onClick={() => togglePerk(perk.value)}
                        />
                      ))}
                    </div>
                  </fieldset>
                </div>
              </div>
            </section>
          ) : null}

          {activeStep === 3 ? (
            <section aria-labelledby="ops-candidate-interview-heading" className={cardClassName}>
              <h2 id="ops-candidate-interview-heading" className={cardHeadingClassName}>
                Candidate & Interview
              </h2>
              <div className={formShellClassName}>
                <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                  <fieldset id="education-group" className="space-y-3">
                    <legend className={fieldLabelClassName}>Education Qualification</legend>
                    <div className="flex flex-wrap gap-2.5 sm:gap-3">
                      {OPERATIONS_POST_JOB_EDUCATION_OPTIONS.map((option) => (
                        <ChipButton
                          key={option.value}
                          label={option.label}
                          isSelected={formData.candidateAndInterview.education.includes(option.value)}
                          onClick={() =>
                            updateFormData((current) => ({
                              ...current,
                              candidateAndInterview: {
                                ...current.candidateAndInterview,
                                education: current.candidateAndInterview.education.includes(option.value)
                                  ? current.candidateAndInterview.education.filter((item) => item !== option.value)
                                  : [...current.candidateAndInterview.education, option.value],
                              },
                            }))
                          }
                        />
                      ))}
                    </div>
                    {errors.education ? <p className="text-xs font-medium text-red-600">{errors.education}</p> : null}
                  </fieldset>

                  <fieldset id="experience-group" className="space-y-3">
                    <legend className={fieldLabelClassName}>Experience Required</legend>
                    <div className="flex flex-wrap gap-2.5 sm:gap-3">
                      {OPERATIONS_POST_JOB_EXPERIENCE_OPTIONS.map((option) => (
                        <ChipButton
                          key={option.value}
                          label={option.label}
                          isSelected={formData.candidateAndInterview.experienceRequired === option.value}
                          onClick={() =>
                            updateFormData((current) => ({
                              ...current,
                              candidateAndInterview: {
                                ...current.candidateAndInterview,
                                experienceRequired:
                                  current.candidateAndInterview.experienceRequired === option.value
                                    ? ""
                                    : option.value,
                              },
                            }))
                          }
                        />
                      ))}
                    </div>
                    {errors.experienceRequired ? (
                      <p className="text-xs font-medium text-red-600">{errors.experienceRequired}</p>
                    ) : null}
                  </fieldset>

                  <fieldset className="space-y-3">
                    <legend className={fieldLabelClassName}>Additional Requirements</legend>
                    <div className="flex flex-wrap gap-2.5 sm:gap-3">
                      {OPERATIONS_POST_JOB_ADDITIONAL_REQUIREMENT_TOGGLES.map((toggle) => {
                        const isActive = formData.candidateAndInterview.additionalRequirements[toggle.key];
                        return (
                          <button
                            key={toggle.key}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() =>
                              updateFormData((current) => ({
                                ...current,
                                candidateAndInterview: {
                                  ...current.candidateAndInterview,
                                  additionalRequirements: {
                                    ...current.candidateAndInterview.additionalRequirements,
                                    [toggle.key]:
                                      !current.candidateAndInterview.additionalRequirements[toggle.key],
                                  },
                                },
                              }))
                            }
                            className={cn(
                              toggleClassName,
                              isActive
                                ? "border-primary-soft bg-primary-light text-primary"
                                : "border-border bg-surface text-foreground hover:border-primary/20",
                            )}
                          >
                            {toggle.label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  {formData.candidateAndInterview.additionalRequirements.language ? (
                    <fieldset id="language-group" className="space-y-3">
                      <legend className={fieldLabelClassName}>Language Required</legend>
                      <div className="flex flex-wrap gap-2.5 sm:gap-3">
                        {OPERATIONS_POST_JOB_LANGUAGE_OPTIONS.map((option) => (
                          <ChipButton
                            key={option.value}
                            label={option.label}
                            isSelected={formData.candidateAndInterview.languages.includes(option.value)}
                            onClick={() =>
                              updateFormData((current) => ({
                                ...current,
                                candidateAndInterview: {
                                  ...current.candidateAndInterview,
                                  languages: current.candidateAndInterview.languages.includes(option.value)
                                    ? current.candidateAndInterview.languages.filter((item) => item !== option.value)
                                    : [...current.candidateAndInterview.languages, option.value],
                                },
                              }))
                            }
                          />
                        ))}
                      </div>
                      {errors.languages ? <p className="text-xs font-medium text-red-600">{errors.languages}</p> : null}
                    </fieldset>
                  ) : null}

                  {formData.candidateAndInterview.additionalRequirements.gender ? (
                    <fieldset id="gender-group" className="space-y-3">
                      <legend className={fieldLabelClassName}>Gender</legend>
                      <div className="flex flex-wrap gap-2.5 sm:gap-3">
                        {OPERATIONS_POST_JOB_GENDER_OPTIONS.map((option) => (
                          <ChipButton
                            key={option.value}
                            label={option.label}
                            isSelected={formData.candidateAndInterview.gender.includes(option.value)}
                            onClick={() =>
                              updateFormData((current) => ({
                                ...current,
                                candidateAndInterview: {
                                  ...current.candidateAndInterview,
                                  gender: current.candidateAndInterview.gender.includes(option.value)
                                    ? current.candidateAndInterview.gender.filter((item) => item !== option.value)
                                    : [...current.candidateAndInterview.gender, option.value],
                                },
                              }))
                            }
                          />
                        ))}
                      </div>
                      {errors.gender ? <p className="text-xs font-medium text-red-600">{errors.gender}</p> : null}
                    </fieldset>
                  ) : null}

                  {formData.candidateAndInterview.additionalRequirements.age ? (
                    <fieldset className="space-y-3">
                      <legend className={fieldLabelClassName}>Age Range</legend>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          id="age-min"
                          type="text"
                          inputMode="numeric"
                          value={formData.candidateAndInterview.ageMin}
                          onChange={(event) =>
                            updateFormData((current) => ({
                              ...current,
                              candidateAndInterview: {
                                ...current.candidateAndInterview,
                                ageMin: sanitizeNumericInput(event.target.value),
                              },
                            }))
                          }
                          placeholder="Minimum Age"
                          className={inputClassNameWithError(errors.ageMin)}
                        />
                        <input
                          id="age-max"
                          type="text"
                          inputMode="numeric"
                          value={formData.candidateAndInterview.ageMax}
                          onChange={(event) =>
                            updateFormData((current) => ({
                              ...current,
                              candidateAndInterview: {
                                ...current.candidateAndInterview,
                                ageMax: sanitizeNumericInput(event.target.value),
                              },
                            }))
                          }
                          placeholder="Maximum Age"
                          className={inputClassNameWithError(errors.ageMax)}
                        />
                      </div>
                      {errors.ageMin ? <p className="text-xs font-medium text-red-600">{errors.ageMin}</p> : null}
                      {errors.ageMax ? <p className="text-xs font-medium text-red-600">{errors.ageMax}</p> : null}
                    </fieldset>
                  ) : null}

                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-foreground sm:text-lg">Interview</h3>
                    <div className="space-y-3">
                      <div>
                        <span className={fieldLabelClassName}>Is this a walk-in interview?</span>
                        <div className="mt-2 flex flex-wrap gap-2.5 sm:gap-3" role="group" aria-label="Walk-in interview">
                          {(["yes", "no"] as const).map((option) => {
                            const isSelected = formData.candidateAndInterview.walkIn === option;
                            return (
                              <button
                                key={option}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() =>
                                  updateFormData((current) => ({
                                    ...current,
                                    candidateAndInterview: {
                                      ...current.candidateAndInterview,
                                      walkIn: option,
                                    },
                                  }))
                                }
                                className={cn(
                                  walkInSegmentClassName,
                                  isSelected
                                    ? "border-primary-soft bg-primary-soft text-surface"
                                    : "border-border bg-surface text-foreground hover:border-primary/20",
                                )}
                              >
                                {option === "yes" ? "Yes" : "No"}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {formData.candidateAndInterview.walkIn === "yes" ? (
                        <>
                          <FormField
                            id="walk-in-address"
                            label="Walk-in Interview Address"
                            error={errors.walkInAddress}
                          >
                            <textarea
                              id="walk-in-address"
                              value={formData.candidateAndInterview.walkInAddress}
                              onChange={(event) =>
                                updateFormData((current) => ({
                                  ...current,
                                  candidateAndInterview: {
                                    ...current.candidateAndInterview,
                                    walkInAddress: event.target.value,
                                  },
                                }))
                              }
                              placeholder="Enter Complete interview Address"
                              className={textareaClassName}
                            />
                          </FormField>

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] sm:gap-5 lg:gap-6">
                            <div className="space-y-3">
                              <span className={fieldLabelClassName}>Walk-in Dates*</span>
                              <div className="mt-2 grid grid-cols-2 gap-3">
                                <div className={fieldStackClassName}>
                                  <input
                                    id="walk-in-start-date"
                                    type="date"
                                    value={formData.candidateAndInterview.walkInStartDate}
                                    min={new Date().toISOString().slice(0, 10)}
                                    onChange={(event) =>
                                      updateFormData((current) => ({
                                        ...current,
                                        candidateAndInterview: {
                                          ...current.candidateAndInterview,
                                          walkInStartDate: event.target.value,
                                          walkInEndDate:
                                            current.candidateAndInterview.walkInEndDate &&
                                            current.candidateAndInterview.walkInEndDate < event.target.value
                                              ? ""
                                              : current.candidateAndInterview.walkInEndDate,
                                        },
                                      }))
                                    }
                                    className={inputClassNameWithError(errors.walkInStartDate)}
                                  />
                                  {errors.walkInStartDate ? <p className="text-xs font-medium text-red-600">{errors.walkInStartDate}</p> : null}
                                </div>
                                <div className={fieldStackClassName}>
                                  <input
                                    id="walk-in-end-date"
                                    type="date"
                                    value={formData.candidateAndInterview.walkInEndDate}
                                    min={
                                      formData.candidateAndInterview.walkInStartDate ||
                                      new Date().toISOString().slice(0, 10)
                                    }
                                    onChange={(event) =>
                                      updateFormData((current) => ({
                                        ...current,
                                        candidateAndInterview: {
                                          ...current.candidateAndInterview,
                                          walkInEndDate: event.target.value,
                                        },
                                      }))
                                    }
                                    className={inputClassNameWithError(errors.walkInEndDate)}
                                  />
                                  {errors.walkInEndDate ? <p className="text-xs font-medium text-red-600">{errors.walkInEndDate}</p> : null}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <span className={fieldLabelClassName}>Walk-in Time</span>
                              <div className="mt-2 grid grid-cols-2 gap-3">
                                <div className={fieldStackClassName}>
                                  <SelectInput
                                    id="walk-in-start-time"
                                    value={formData.candidateAndInterview.walkInStartTime}
                                    placeholder="Start time"
                                    ariaLabel="Walk-in start time"
                                    hasError={Boolean(errors.walkInStartTime)}
                                    options={OPERATIONS_POST_JOB_WALK_IN_TIME_OPTIONS}
                                    onChange={(value) =>
                                      updateFormData((current) => ({
                                        ...current,
                                        candidateAndInterview: {
                                          ...current.candidateAndInterview,
                                          walkInStartTime: value,
                                        },
                                      }))
                                    }
                                  />
                                  {errors.walkInStartTime ? <p className="text-xs font-medium text-red-600">{errors.walkInStartTime}</p> : null}
                                </div>
                                <div className={fieldStackClassName}>
                                  <SelectInput
                                    id="walk-in-end-time"
                                    value={formData.candidateAndInterview.walkInEndTime}
                                    placeholder="End time"
                                    ariaLabel="Walk-in end time"
                                    hasError={Boolean(errors.walkInEndTime)}
                                    options={OPERATIONS_POST_JOB_WALK_IN_TIME_OPTIONS}
                                    onChange={(value) =>
                                      updateFormData((current) => ({
                                        ...current,
                                        candidateAndInterview: {
                                          ...current.candidateAndInterview,
                                          walkInEndTime: value,
                                        },
                                      }))
                                    }
                                  />
                                  {errors.walkInEndTime ? <p className="text-xs font-medium text-red-600">{errors.walkInEndTime}</p> : null}
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : null}

                      <FormField
                        id="other-instructions"
                        label="Other Instructions"
                        error={errors.otherInstructions}
                      >
                        <textarea
                          id="other-instructions"
                          value={formData.candidateAndInterview.otherInstructions}
                          onChange={(event) =>
                            updateFormData((current) => ({
                              ...current,
                              candidateAndInterview: {
                                ...current.candidateAndInterview,
                                otherInstructions: event.target.value.slice(
                                  0,
                                  OPERATIONS_POST_JOB_LONG_TEXT_MAX_LENGTH,
                                ),
                              },
                            }))
                          }
                          maxLength={OPERATIONS_POST_JOB_LONG_TEXT_MAX_LENGTH}
                          placeholder="Mention required documents, or any other interview instruction"
                          className={cn(
                            textareaClassName,
                            errors.otherInstructions &&
                              "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                          )}
                        />
                        <p className="text-right text-xs text-muted">
                          {formData.candidateAndInterview.otherInstructions.length}/
                          {OPERATIONS_POST_JOB_LONG_TEXT_MAX_LENGTH}
                        </p>
                      </FormField>
                    </div>
                  </div>

                  <fieldset className="space-y-3">
                    <legend className={fieldLabelClassName}>Contact Details</legend>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5 lg:gap-6">
                      <div className={fieldStackClassName}>
                        <input
                          id="contact-name"
                          type="text"
                          value={formData.candidateAndInterview.contactName}
                          onChange={(event) =>
                            updateFormData((current) => ({
                              ...current,
                              candidateAndInterview: {
                                ...current.candidateAndInterview,
                                contactName: event.target.value,
                              },
                            }))
                          }
                          placeholder="Name"
                          className={inputClassNameWithError(errors.contactName)}
                        />
                        {errors.contactName ? <p className="text-xs font-medium text-red-600">{errors.contactName}</p> : null}
                      </div>
                      <div className={fieldStackClassName}>
                        <input
                          id="contact-email"
                          type="email"
                          value={formData.candidateAndInterview.contactEmail}
                          onChange={(event) =>
                            updateFormData((current) => ({
                              ...current,
                              candidateAndInterview: {
                                ...current.candidateAndInterview,
                                contactEmail: event.target.value,
                              },
                            }))
                          }
                          placeholder="Email"
                          className={inputClassNameWithError(errors.contactEmail)}
                        />
                        {errors.contactEmail ? <p className="text-xs font-medium text-red-600">{errors.contactEmail}</p> : null}
                      </div>
                      <div className={fieldStackClassName}>
                        <input
                          id="contact-mobile"
                          type="tel"
                          inputMode="numeric"
                          value={formData.candidateAndInterview.contactMobile}
                          onChange={(event) =>
                            updateFormData((current) => ({
                              ...current,
                              candidateAndInterview: {
                                ...current.candidateAndInterview,
                                contactMobile: sanitizeNumericInput(event.target.value),
                              },
                            }))
                          }
                          placeholder="Mobile Number"
                          className={inputClassNameWithError(errors.contactMobile)}
                        />
                        {errors.contactMobile ? <p className="text-xs font-medium text-red-600">{errors.contactMobile}</p> : null}
                      </div>
                    </div>
                  </fieldset>
                </div>
              </div>
            </section>
          ) : null}

          <OperationsPostJobEmployerSelect
            selectedEmployer={selectedEmployer}
            onSelect={setSelectedEmployer}
            disabled={isSubmitting}
          />

          {actionError ? (
            <p
              className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs font-medium text-danger"
              role="alert"
            >
              {actionError}
            </p>
          ) : null}
          {statusMessage ? (
            <p
              className="rounded-lg border border-primary/20 bg-primary-light px-3 py-2 text-xs font-medium text-primary"
              role="status"
            >
              {statusMessage}
            </p>
          ) : null}

          <OperationsPostJobActionBar
            activeStep={activeStep}
            isSubmitting={isSubmitting}
            isSavingDraft={
              createDraftMutation.isPending || updateDraftMutation.isPending
            }
            isPublishing={publishMutation.isPending}
            publishReady={publishReady}
            onBack={() =>
              setActiveStep((step) => Math.max(1, step - 1) as OperationsPostJobActiveStep)
            }
            onSaveDraft={() => void handleSaveDraft()}
            onContinue={() => void handleNextStep()}
            onPublish={() => void handlePublish()}
          />
        </div>

        <OperationsPostJobLivePreview
          job={previewJob}
          employerAssigned={Boolean(selectedEmployer?.id)}
        />
      </div>
    </div>
  );
}
