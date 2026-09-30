"use client";

import { FieldError } from "@/components/auth/FieldError";
import { RequiredFieldLabel } from "@/components/auth/RequiredFieldLabel";
import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import { useAuthMessageTranslator } from "@/components/employer-register/useAuthMessageTranslator";
import { JobSeekerJobRoleAutocomplete } from "@/components/job-seeker-register/JobSeekerJobRoleAutocomplete";
import { JobSeekerPreferredLocationAutocomplete } from "@/components/job-seeker-register/JobSeekerPreferredLocationAutocomplete";
import { PostJobDatePicker } from "@/components/post-job/PostJobDatePicker";
import {
  JOB_SEEKER_GENDER_OPTIONS,
  JOB_SEEKER_JOB_TYPE_OPTIONS,
  JOB_SEEKER_REGISTER_DOB_PLACEHOLDER,
  JOB_SEEKER_REGISTER_SALARY_PERIOD_OPTIONS,
  JOB_SEEKER_WORK_MODE_OPTIONS,
} from "@/constants/job-seeker-register";
import { useTranslate } from "@/i18n/translate";
import type { AuthFieldErrors } from "@/utils/auth-field-errors";
import {
  GENDER_LABEL_KEYS,
  JOB_TYPE_LABEL_KEYS,
  SALARY_PERIOD_LABEL_KEYS,
  WORK_MODE_LABEL_KEYS,
  localizeOptions,
} from "./job-seeker-register-option-labels";

export type JobSeekerPreferencesValues = {
  dateOfBirth: string;
  gender: string;
  jobRole: string;
  jobType: string;
  workMode: string;
  preferredJobLocation: string;
  expectedSalary: string;
  expectedSalaryPeriod: string;
};

type JobSeekerRegisterPreferencesStepProps = {
  values: JobSeekerPreferencesValues;
  fieldErrors?: AuthFieldErrors;
  disabled?: boolean;
  onChange: (patch: Partial<JobSeekerPreferencesValues>) => void;
};

function getLocalTodayIso() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

export function JobSeekerRegisterPreferencesStep({
  values,
  fieldErrors = {},
  disabled = false,
  onChange,
}: JobSeekerRegisterPreferencesStepProps) {
  const t = useTranslate();
  const translateMessage = useAuthMessageTranslator();
  const genderOptions = localizeOptions(
    JOB_SEEKER_GENDER_OPTIONS,
    GENDER_LABEL_KEYS,
    t,
  );
  const jobTypeOptions = localizeOptions(
    JOB_SEEKER_JOB_TYPE_OPTIONS,
    JOB_TYPE_LABEL_KEYS,
    t,
  );
  const workModeOptions = localizeOptions(
    JOB_SEEKER_WORK_MODE_OPTIONS,
    WORK_MODE_LABEL_KEYS,
    t,
  );
  const salaryPeriodOptions = localizeOptions(
    JOB_SEEKER_REGISTER_SALARY_PERIOD_OPTIONS,
    SALARY_PERIOD_LABEL_KEYS,
    t,
  );
  const dobErrorId = "job-seeker-register-dob-error";
  const genderErrorId = "job-seeker-register-gender-error";
  const jobTypeErrorId = "job-seeker-register-job-type-error";
  const workModeErrorId = "job-seeker-register-work-mode-error";
  const salaryErrorId = "job-seeker-register-expected-salary-error";
  const periodErrorId = "job-seeker-register-salary-period-error";

  return (
    <>
      <div className="employer-register-form-row">
        <div className="employer-register-form-stack">
          <RequiredFieldLabel
            htmlFor="job-seeker-register-dob"
            required
            className="employer-register-form-label"
          >
            {t("auth.jobSeekerRegister.dobLabel")}
          </RequiredFieldLabel>
          <PostJobDatePicker
            id="job-seeker-register-dob"
            name="dateOfBirth"
            value={values.dateOfBirth}
            placeholder={JOB_SEEKER_REGISTER_DOB_PLACEHOLDER}
            maxDate={getLocalTodayIso()}
            compact
            onChange={(value) => onChange({ dateOfBirth: value })}
            aria-label={t("auth.jobSeekerRegister.dobAria")}
            aria-required
            aria-invalid={Boolean(fieldErrors.dateOfBirth)}
            aria-describedby={
              fieldErrors.dateOfBirth ? dobErrorId : undefined
            }
          />
          <FieldError
            id={dobErrorId}
            message={translateMessage(fieldErrors.dateOfBirth)}
          />
        </div>

        <div className="employer-register-form-stack">
          <EmployerRegisterSearchableSelect
            id="job-seeker-register-gender"
            name="gender"
            label={t("auth.jobSeekerRegister.genderLabel")}
            value={values.gender}
            placeholder={t("auth.jobSeekerRegister.genderPlaceholder")}
            options={genderOptions}
            onChange={(value) => onChange({ gender: value })}
            required
            disabled={disabled}
            aria-invalid={Boolean(fieldErrors.gender)}
            aria-describedby={fieldErrors.gender ? genderErrorId : undefined}
          />
          <FieldError
            id={genderErrorId}
            message={translateMessage(fieldErrors.gender)}
          />
        </div>
      </div>

      <JobSeekerJobRoleAutocomplete
        id="job-seeker-register-job-role"
        label={t("auth.jobSeekerRegister.jobRoleLabel")}
        value={values.jobRole}
        placeholder={t("auth.jobSeekerRegister.jobRolePlaceholder")}
        disabled={disabled}
        error={fieldErrors.jobRole}
        onChange={(value) => onChange({ jobRole: value })}
      />

      <div className="employer-register-form-row">
        <div className="employer-register-form-stack">
          <EmployerRegisterSearchableSelect
            id="job-seeker-register-job-type"
            name="jobType"
            label={t("auth.jobSeekerRegister.jobTypeLabel")}
            value={values.jobType}
            placeholder={t("auth.jobSeekerRegister.jobTypePlaceholder")}
            options={jobTypeOptions}
            onChange={(value) => onChange({ jobType: value })}
            required
            disabled={disabled}
            aria-invalid={Boolean(fieldErrors.jobType)}
            aria-describedby={fieldErrors.jobType ? jobTypeErrorId : undefined}
          />
          <FieldError
            id={jobTypeErrorId}
            message={translateMessage(fieldErrors.jobType)}
          />
        </div>

        <div className="employer-register-form-stack">
          <EmployerRegisterSearchableSelect
            id="job-seeker-register-work-mode"
            name="workMode"
            label={t("auth.jobSeekerRegister.workModeLabel")}
            value={values.workMode}
            placeholder={t("auth.jobSeekerRegister.workModePlaceholder")}
            options={workModeOptions}
            onChange={(value) => onChange({ workMode: value })}
            required
            disabled={disabled}
            aria-invalid={Boolean(fieldErrors.workMode)}
            aria-describedby={
              fieldErrors.workMode ? workModeErrorId : undefined
            }
          />
          <FieldError
            id={workModeErrorId}
            message={translateMessage(fieldErrors.workMode)}
          />
        </div>
      </div>

      <JobSeekerPreferredLocationAutocomplete
        id="job-seeker-register-preferred-location"
        label={t("auth.jobSeekerRegister.preferredLocationLabel")}
        value={values.preferredJobLocation}
        placeholder={t("auth.jobSeekerRegister.preferredLocationPlaceholder")}
        disabled={disabled}
        error={fieldErrors.preferredJobLocation}
        onChange={(value) => onChange({ preferredJobLocation: value })}
      />

      <div className="employer-register-form-stack">
        <RequiredFieldLabel
          htmlFor="job-seeker-register-expected-salary"
          required
          className="employer-register-form-label"
        >
          {t("auth.jobSeekerRegister.expectedSalaryLabel")}
        </RequiredFieldLabel>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
          <input
            id="job-seeker-register-expected-salary"
            name="expectedSalary"
            type="text"
            inputMode="numeric"
            value={values.expectedSalary}
            onChange={(event) =>
              onChange({
                expectedSalary: event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 8),
              })
            }
            placeholder={t("auth.jobSeekerRegister.expectedSalaryPlaceholder")}
            className="employer-register-form-input min-w-0 flex-1"
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.expectedSalary) || undefined}
            aria-describedby={
              fieldErrors.expectedSalary ? salaryErrorId : undefined
            }
            disabled={disabled}
          />
          <div className="w-full sm:w-[11.5rem]">
            <EmployerRegisterSearchableSelect
              id="job-seeker-register-salary-period"
              name="expectedSalaryPeriod"
              label={t("auth.jobSeekerRegister.salaryPeriodLabel")}
              value={values.expectedSalaryPeriod}
              placeholder={t("auth.jobSeekerRegister.salaryPeriodPlaceholder")}
              options={salaryPeriodOptions}
              onChange={(value) => onChange({ expectedSalaryPeriod: value })}
              required
              hideLabel
              hideSearch
              disabled={disabled}
              aria-invalid={Boolean(fieldErrors.expectedSalaryPeriod)}
              aria-describedby={
                fieldErrors.expectedSalaryPeriod ? periodErrorId : undefined
              }
            />
          </div>
        </div>
        <FieldError
          id={salaryErrorId}
          message={translateMessage(fieldErrors.expectedSalary)}
        />
        <FieldError
          id={periodErrorId}
          message={translateMessage(fieldErrors.expectedSalaryPeriod)}
        />
      </div>
    </>
  );
}
