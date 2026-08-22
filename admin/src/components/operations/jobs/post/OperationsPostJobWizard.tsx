import { Briefcase, Loader2, MapPin, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  validateOperationsPostJobForPublish,
  validateOperationsPostJobStep,
} from "../../../../utils/operations-post-job-validation";
import { OperationsBadge } from "../../../ui/OperationsBadge";
import {
  OperationsFormField,
  operationsFieldInputClassName,
  operationsFieldTextareaClassName,
} from "../../../ui/OperationsFormField";
import { OperationsFilterSelect } from "../OperationsFilterSelect";
import { OperationsPostJobActionBar } from "./OperationsPostJobActionBar";
import { OperationsPostJobEmployerSelect } from "./OperationsPostJobEmployerSelect";
import { OperationsPostJobLivePreview } from "./OperationsPostJobLivePreview";
import { OperationsPostJobPlaceAutocomplete } from "./OperationsPostJobPlaceAutocomplete";
import { OperationsPostJobSectionCard } from "./OperationsPostJobSectionCard";
import { OperationsPostJobStepper } from "./OperationsPostJobStepper";

function ChipToggle<T extends string>({
  options,
  value,
  selected,
  onToggle,
}: {
  options: { value: T; label: string }[];
  value: T;
  selected: boolean;
  onToggle: (value: T) => void;
}) {
  const option = options.find((item) => item.value === value);
  if (!option) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => onToggle(value)}
      aria-pressed={selected}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        selected
          ? "border-primary bg-primary-light text-primary"
          : "border-border-subtle bg-surface text-muted hover:border-primary/25 hover:text-foreground",
      )}
    >
      {option.label}
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

const STEP_SECTION_META = {
  1: {
    title: "Job Information",
    description: "Add the basic details about the job.",
    icon: Briefcase,
  },
  2: {
    title: "Location & Salary",
    description: "Add the job location and salary details.",
    icon: MapPin,
  },
  3: {
    title: "Candidate & Interview",
    description: "Add candidate requirements and interview details.",
    icon: Users,
  },
} as const;

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

  const contractFrom = parseContractPeriodStoredValue(
    formData.jobInformation.contractPeriodFrom,
  );
  const contractTo = parseContractPeriodStoredValue(
    formData.jobInformation.contractPeriodTo,
  );
  const stepMeta = STEP_SECTION_META[activeStep];

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
          <OperationsPostJobSectionCard
            title={stepMeta.title}
            description={stepMeta.description}
            icon={stepMeta.icon}
          >
              {activeStep === 1 ? (
                <>
                  <OperationsFormField
                    label="Company / Recruiting For"
                    error={errors.companyDetails}
                  >
                    <input
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
                      className={operationsFieldInputClassName}
                      placeholder="Company or client name"
                    />
                  </OperationsFormField>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <OperationsFormField label="Job Title" required error={errors.jobTitle}>
                      <input
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
                        className={operationsFieldInputClassName}
                      />
                    </OperationsFormField>

                    <OperationsFormField label="Vacancies" required error={errors.vacancies}>
                      <input
                        type="number"
                        min={1}
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
                        className={operationsFieldInputClassName}
                      />
                    </OperationsFormField>
                  </div>

                  <OperationsFormField label="Job Type" required error={errors.jobType}>
                    <OperationsFilterSelect
                      label="Job type"
                      value={formData.jobInformation.jobType}
                      hideSearch
                      options={[
                        { value: "", label: "Select job type" },
                        ...OPERATIONS_POST_JOB_TYPE_OPTIONS,
                      ]}
                      onChange={(value) =>
                        updateFormData((current) => ({
                          ...current,
                          jobInformation: {
                            ...current.jobInformation,
                            jobType:
                              value as OperationsPostJobWizardFormData["jobInformation"]["jobType"],
                          },
                        }))
                      }
                    />
                  </OperationsFormField>

                  {formData.jobInformation.jobType === "contract" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <OperationsFormField label="Contract From">
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <input
                            value={contractFrom.amount}
                            onChange={(event) =>
                              updateFormData((current) => ({
                                ...current,
                                jobInformation: {
                                  ...current.jobInformation,
                                  contractPeriodFrom: buildContractPeriodStoredValue(
                                    event.target.value,
                                    contractFrom.unit,
                                  ),
                                },
                              }))
                            }
                            className={operationsFieldInputClassName}
                          />
                          <OperationsFilterSelect
                            label="Contract from unit"
                            hideSearch
                            value={contractFrom.unit}
                            options={[
                              { value: "days", label: "Days" },
                              { value: "months", label: "Months" },
                              { value: "years", label: "Years" },
                            ]}
                            onChange={(value) =>
                              updateFormData((current) => ({
                                ...current,
                                jobInformation: {
                                  ...current.jobInformation,
                                  contractPeriodFrom: buildContractPeriodStoredValue(
                                    contractFrom.amount,
                                    value as typeof contractFrom.unit,
                                  ),
                                },
                              }))
                            }
                          />
                        </div>
                      </OperationsFormField>
                      <OperationsFormField label="Contract To">
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <input
                            value={contractTo.amount}
                            onChange={(event) =>
                              updateFormData((current) => ({
                                ...current,
                                jobInformation: {
                                  ...current.jobInformation,
                                  contractPeriodTo: buildContractPeriodStoredValue(
                                    event.target.value,
                                    contractTo.unit,
                                  ),
                                },
                              }))
                            }
                            className={operationsFieldInputClassName}
                          />
                          <OperationsFilterSelect
                            label="Contract to unit"
                            hideSearch
                            value={contractTo.unit}
                            options={[
                              { value: "days", label: "Days" },
                              { value: "months", label: "Months" },
                              { value: "years", label: "Years" },
                            ]}
                            onChange={(value) =>
                              updateFormData((current) => ({
                                ...current,
                                jobInformation: {
                                  ...current.jobInformation,
                                  contractPeriodTo: buildContractPeriodStoredValue(
                                    contractTo.amount,
                                    value as typeof contractTo.unit,
                                  ),
                                },
                              }))
                            }
                          />
                        </div>
                      </OperationsFormField>
                    </div>
                  ) : null}

                  {formData.jobInformation.jobType === "part-time" ? (
                    <>
                      <OperationsFormField label="Part-time Schedule">
                        <OperationsFilterSelect
                          label="Part-time schedule"
                          hideSearch
                          value={formData.jobInformation.partTimeSchedule}
                          options={[
                            { value: "", label: "Select schedule" },
                            ...OPERATIONS_POST_JOB_PART_TIME_SCHEDULE_OPTIONS.map(
                              (option) => ({
                                value: option.value,
                                label: option.label,
                              }),
                            ),
                          ]}
                          onChange={(value) =>
                            updateFormData((current) => ({
                              ...current,
                              jobInformation: {
                                ...current.jobInformation,
                                partTimeSchedule:
                                  value as OperationsPostJobWizardFormData["jobInformation"]["partTimeSchedule"],
                              },
                            }))
                          }
                        />
                      </OperationsFormField>
                      {formData.jobInformation.partTimeSchedule ===
                      "flexible-hours" ? (
                        <OperationsFormField label="Flexible Hours">
                          <OperationsFilterSelect
                            label="Flexible hours"
                            hideSearch
                            value={formData.jobInformation.partTimeFlexibleHours}
                            options={[
                              { value: "", label: "Select hours" },
                              ...OPERATIONS_POST_JOB_FLEXIBLE_HOURS_OPTIONS,
                            ]}
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
                        </OperationsFormField>
                      ) : null}
                    </>
                  ) : null}

                  <OperationsFormField label="Work Mode" required error={errors.workMode}>
                    <OperationsFilterSelect
                      label="Work mode"
                      hideSearch
                      value={formData.jobInformation.workMode}
                      options={[
                        { value: "", label: "Select work mode" },
                        ...OPERATIONS_POST_JOB_WORK_MODE_OPTIONS,
                      ]}
                      onChange={(value) =>
                        updateFormData((current) => ({
                          ...current,
                          jobInformation: {
                            ...current.jobInformation,
                            workMode:
                              value as OperationsPostJobWizardFormData["jobInformation"]["workMode"],
                          },
                        }))
                      }
                    />
                  </OperationsFormField>

                  <OperationsFormField
                    label="Job Description"
                    required
                    error={errors.jobDescription}
                    hint={`${formData.jobInformation.jobDescription.length} / ${OPERATIONS_POST_JOB_LONG_TEXT_MAX_LENGTH}`}
                  >
                    <textarea
                      value={formData.jobInformation.jobDescription}
                      maxLength={OPERATIONS_POST_JOB_LONG_TEXT_MAX_LENGTH}
                      onChange={(event) =>
                        updateFormData((current) => ({
                          ...current,
                          jobInformation: {
                            ...current.jobInformation,
                            jobDescription: event.target.value,
                          },
                        }))
                      }
                      className={cn(
                        operationsFieldTextareaClassName,
                        "min-h-[140px] resize-y",
                      )}
                      placeholder="Describe the role, responsibilities, and expectations…"
                    />
                  </OperationsFormField>
                </>
              ) : null}

              {activeStep === 2 ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <OperationsFormField
                      label="State"
                      htmlFor="ops-post-job-state"
                      required
                      error={errors.state}
                    >
                      <OperationsPostJobPlaceAutocomplete
                        id="ops-post-job-state"
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
                    </OperationsFormField>
                    <OperationsFormField
                      label="City"
                      htmlFor="ops-post-job-city"
                      required
                      error={errors.city}
                    >
                      <OperationsPostJobPlaceAutocomplete
                        id="ops-post-job-city"
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
                    </OperationsFormField>
                  </div>

                  <OperationsFormField label="Job Address" required error={errors.address}>
                    <textarea
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
                      className={operationsFieldTextareaClassName}
                    />
                  </OperationsFormField>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <OperationsFormField label="Salary Type" required error={errors.salaryType}>
                      <OperationsFilterSelect
                        label="Salary type"
                        hideSearch
                        value={formData.locationAndSalary.salaryType}
                        options={[
                          { value: "", label: "Select salary type" },
                          ...OPERATIONS_POST_JOB_SALARY_TYPE_OPTIONS.map((option) => ({
                            value: option.value,
                            label: option.label,
                          })),
                        ]}
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
                    </OperationsFormField>
                    <OperationsFormField
                      label="Salary Period"
                      required
                      error={errors.salaryPeriod}
                    >
                      <OperationsFilterSelect
                        label="Salary period"
                        hideSearch
                        value={formData.locationAndSalary.salaryPeriod}
                        options={[
                          { value: "", label: "Select salary period" },
                          ...OPERATIONS_POST_JOB_SALARY_PERIOD_OPTIONS.map((option) => ({
                            value: option.value,
                            label: option.label,
                          })),
                        ]}
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
                    </OperationsFormField>
                  </div>

                  {formData.locationAndSalary.salaryType === "fixed" ? (
                    <OperationsFormField label="Fixed Salary" required error={errors.incentives}>
                      <input
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
                        className={operationsFieldInputClassName}
                      />
                    </OperationsFormField>
                  ) : null}

                  {formData.locationAndSalary.salaryType === "range" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <OperationsFormField label="Minimum Salary" required error={errors.salaryMin}>
                        <input
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
                          className={operationsFieldInputClassName}
                        />
                      </OperationsFormField>
                      <OperationsFormField label="Maximum Salary" required error={errors.salaryMax}>
                        <input
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
                          className={operationsFieldInputClassName}
                        />
                      </OperationsFormField>
                    </div>
                  ) : null}

                  <OperationsFormField label="Perks">
                    <div className="flex flex-wrap gap-2">
                      {OPERATIONS_POST_JOB_PERK_OPTIONS.map((option) => (
                        <ChipToggle
                          key={option.value}
                          options={OPERATIONS_POST_JOB_PERK_OPTIONS}
                          value={option.value}
                          selected={formData.locationAndSalary.perks.includes(option.value)}
                          onToggle={(value) =>
                            updateFormData((current) => ({
                              ...current,
                              locationAndSalary: {
                                ...current.locationAndSalary,
                                perks: current.locationAndSalary.perks.includes(value)
                                  ? current.locationAndSalary.perks.filter(
                                      (perk) => perk !== value,
                                    )
                                  : [...current.locationAndSalary.perks, value],
                              },
                            }))
                          }
                        />
                      ))}
                    </div>
                  </OperationsFormField>
                </>
              ) : null}

              {activeStep === 3 ? (
                <>
                  <OperationsFormField label="Education" required error={errors.education}>
                    <div className="flex flex-wrap gap-2">
                      {OPERATIONS_POST_JOB_EDUCATION_OPTIONS.map((option) => (
                        <ChipToggle
                          key={option.value}
                          options={OPERATIONS_POST_JOB_EDUCATION_OPTIONS}
                          value={option.value}
                          selected={formData.candidateAndInterview.education.includes(
                            option.value,
                          )}
                          onToggle={(value) =>
                            updateFormData((current) => ({
                              ...current,
                              candidateAndInterview: {
                                ...current.candidateAndInterview,
                                education:
                                  current.candidateAndInterview.education.includes(value)
                                    ? current.candidateAndInterview.education.filter(
                                        (item) => item !== value,
                                      )
                                    : [...current.candidateAndInterview.education, value],
                              },
                            }))
                          }
                        />
                      ))}
                    </div>
                  </OperationsFormField>

                  <OperationsFormField
                    label="Experience"
                    required
                    error={errors.experienceRequired}
                  >
                    <OperationsFilterSelect
                      label="Experience required"
                      hideSearch
                      value={formData.candidateAndInterview.experienceRequired}
                      options={[
                        { value: "", label: "Select experience" },
                        ...OPERATIONS_POST_JOB_EXPERIENCE_OPTIONS,
                      ]}
                      onChange={(value) =>
                        updateFormData((current) => ({
                          ...current,
                          candidateAndInterview: {
                            ...current.candidateAndInterview,
                            experienceRequired:
                              value as OperationsPostJobWizardFormData["candidateAndInterview"]["experienceRequired"],
                          },
                        }))
                      }
                    />
                  </OperationsFormField>

                  <OperationsFormField label="Languages">
                    <div className="flex flex-wrap gap-2">
                      {OPERATIONS_POST_JOB_LANGUAGE_OPTIONS.map((option) => (
                        <ChipToggle
                          key={option.value}
                          options={OPERATIONS_POST_JOB_LANGUAGE_OPTIONS}
                          value={option.value}
                          selected={formData.candidateAndInterview.languages.includes(
                            option.value,
                          )}
                          onToggle={(value) =>
                            updateFormData((current) => ({
                              ...current,
                              candidateAndInterview: {
                                ...current.candidateAndInterview,
                                languages:
                                  current.candidateAndInterview.languages.includes(value)
                                    ? current.candidateAndInterview.languages.filter(
                                        (item) => item !== value,
                                      )
                                    : [...current.candidateAndInterview.languages, value],
                              },
                            }))
                          }
                        />
                      ))}
                    </div>
                  </OperationsFormField>

                  <OperationsFormField label="Gender">
                    <div className="flex flex-wrap gap-2">
                      {OPERATIONS_POST_JOB_GENDER_OPTIONS.map((option) => (
                        <ChipToggle
                          key={option.value}
                          options={OPERATIONS_POST_JOB_GENDER_OPTIONS}
                          value={option.value}
                          selected={formData.candidateAndInterview.gender.includes(
                            option.value,
                          )}
                          onToggle={(value) =>
                            updateFormData((current) => ({
                              ...current,
                              candidateAndInterview: {
                                ...current.candidateAndInterview,
                                gender: current.candidateAndInterview.gender.includes(
                                  value,
                                )
                                  ? current.candidateAndInterview.gender.filter(
                                      (item) => item !== value,
                                    )
                                  : [...current.candidateAndInterview.gender, value],
                              },
                            }))
                          }
                        />
                      ))}
                    </div>
                  </OperationsFormField>

                  <OperationsFormField label="Walk-in Interview">
                    <OperationsFilterSelect
                      label="Walk-in enabled"
                      hideSearch
                      value={formData.candidateAndInterview.walkIn}
                      options={[
                        { value: "yes", label: "Yes" },
                        { value: "no", label: "No" },
                      ]}
                      onChange={(value) =>
                        updateFormData((current) => ({
                          ...current,
                          candidateAndInterview: {
                            ...current.candidateAndInterview,
                            walkIn: value as "yes" | "no",
                          },
                        }))
                      }
                    />
                  </OperationsFormField>

                  {formData.candidateAndInterview.walkIn === "yes" ? (
                    <>
                      <OperationsFormField
                        label="Walk-in Address"
                        required
                        error={errors.walkInAddress}
                      >
                        <textarea
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
                          className={operationsFieldTextareaClassName}
                        />
                      </OperationsFormField>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <OperationsFormField label="Start Date" error={errors.walkInStartDate}>
                          <input
                            type="date"
                            value={formData.candidateAndInterview.walkInStartDate}
                            onChange={(event) =>
                              updateFormData((current) => ({
                                ...current,
                                candidateAndInterview: {
                                  ...current.candidateAndInterview,
                                  walkInStartDate: event.target.value,
                                },
                              }))
                            }
                            className={operationsFieldInputClassName}
                          />
                        </OperationsFormField>
                        <OperationsFormField label="End Date" error={errors.walkInEndDate}>
                          <input
                            type="date"
                            value={formData.candidateAndInterview.walkInEndDate}
                            onChange={(event) =>
                              updateFormData((current) => ({
                                ...current,
                                candidateAndInterview: {
                                  ...current.candidateAndInterview,
                                  walkInEndDate: event.target.value,
                                },
                              }))
                            }
                            className={operationsFieldInputClassName}
                          />
                        </OperationsFormField>
                        <OperationsFormField label="Start Time" error={errors.walkInStartTime}>
                          <OperationsFilterSelect
                            label="Walk-in start time"
                            hideSearch
                            value={formData.candidateAndInterview.walkInStartTime}
                            options={[
                              { value: "", label: "Select time" },
                              ...OPERATIONS_POST_JOB_WALK_IN_TIME_OPTIONS,
                            ]}
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
                        </OperationsFormField>
                        <OperationsFormField label="End Time" error={errors.walkInEndTime}>
                          <OperationsFilterSelect
                            label="Walk-in end time"
                            hideSearch
                            value={formData.candidateAndInterview.walkInEndTime}
                            options={[
                              { value: "", label: "Select time" },
                              ...OPERATIONS_POST_JOB_WALK_IN_TIME_OPTIONS,
                            ]}
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
                        </OperationsFormField>
                      </div>
                    </>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-3">
                    <OperationsFormField label="Contact Name" required error={errors.contactName}>
                      <input
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
                        className={operationsFieldInputClassName}
                      />
                    </OperationsFormField>
                    <OperationsFormField label="Contact Email" required error={errors.contactEmail}>
                      <input
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
                        className={operationsFieldInputClassName}
                      />
                    </OperationsFormField>
                    <OperationsFormField label="Contact Mobile" required error={errors.contactMobile}>
                      <input
                        inputMode="numeric"
                        maxLength={10}
                        value={formData.candidateAndInterview.contactMobile}
                        onChange={(event) =>
                          updateFormData((current) => ({
                            ...current,
                            candidateAndInterview: {
                              ...current.candidateAndInterview,
                              contactMobile: event.target.value.replace(/\D/g, ""),
                            },
                          }))
                        }
                        className={operationsFieldInputClassName}
                      />
                    </OperationsFormField>
                  </div>
                </>
              ) : null}
          </OperationsPostJobSectionCard>

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
