"use client";

import { FieldError } from "@/components/auth/FieldError";
import { RequiredFieldLabel } from "@/components/auth/RequiredFieldLabel";
import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import { JobSeekerJobRoleAutocomplete } from "@/components/job-seeker-register/JobSeekerJobRoleAutocomplete";
import { JobSeekerPreferredLocationAutocomplete } from "@/components/job-seeker-register/JobSeekerPreferredLocationAutocomplete";
import { PostJobDatePicker } from "@/components/post-job/PostJobDatePicker";
import {
  JOB_SEEKER_GENDER_OPTIONS,
  JOB_SEEKER_JOB_TYPE_OPTIONS,
  JOB_SEEKER_REGISTER_DOB_LABEL,
  JOB_SEEKER_REGISTER_DOB_PLACEHOLDER,
  JOB_SEEKER_REGISTER_EXPECTED_SALARY_LABEL,
  JOB_SEEKER_REGISTER_EXPECTED_SALARY_PLACEHOLDER,
  JOB_SEEKER_REGISTER_GENDER_LABEL,
  JOB_SEEKER_REGISTER_GENDER_PLACEHOLDER,
  JOB_SEEKER_REGISTER_JOB_ROLE_LABEL,
  JOB_SEEKER_REGISTER_JOB_ROLE_PLACEHOLDER,
  JOB_SEEKER_REGISTER_JOB_TYPE_LABEL,
  JOB_SEEKER_REGISTER_JOB_TYPE_PLACEHOLDER,
  JOB_SEEKER_REGISTER_PREFERRED_LOCATION_LABEL,
  JOB_SEEKER_REGISTER_PREFERRED_LOCATION_PLACEHOLDER,
  JOB_SEEKER_REGISTER_SALARY_PERIOD_OPTIONS,
  JOB_SEEKER_REGISTER_WORK_MODE_LABEL,
  JOB_SEEKER_REGISTER_WORK_MODE_PLACEHOLDER,
  JOB_SEEKER_WORK_MODE_OPTIONS,
} from "@/constants/job-seeker-register";
import type { AuthFieldErrors } from "@/utils/auth-field-errors";

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
            {JOB_SEEKER_REGISTER_DOB_LABEL}
          </RequiredFieldLabel>
          <PostJobDatePicker
            id="job-seeker-register-dob"
            name="dateOfBirth"
            value={values.dateOfBirth}
            placeholder={JOB_SEEKER_REGISTER_DOB_PLACEHOLDER}
            maxDate={getLocalTodayIso()}
            compact
            onChange={(value) => onChange({ dateOfBirth: value })}
            aria-label="Date of birth"
            aria-required
            aria-invalid={Boolean(fieldErrors.dateOfBirth)}
            aria-describedby={
              fieldErrors.dateOfBirth ? dobErrorId : undefined
            }
          />
          <FieldError id={dobErrorId} message={fieldErrors.dateOfBirth} />
        </div>

        <div className="employer-register-form-stack">
          <EmployerRegisterSearchableSelect
            id="job-seeker-register-gender"
            name="gender"
            label={JOB_SEEKER_REGISTER_GENDER_LABEL}
            value={values.gender}
            placeholder={JOB_SEEKER_REGISTER_GENDER_PLACEHOLDER}
            options={JOB_SEEKER_GENDER_OPTIONS}
            onChange={(value) => onChange({ gender: value })}
            required
            disabled={disabled}
            aria-invalid={Boolean(fieldErrors.gender)}
            aria-describedby={fieldErrors.gender ? genderErrorId : undefined}
          />
          <FieldError id={genderErrorId} message={fieldErrors.gender} />
        </div>
      </div>

      <JobSeekerJobRoleAutocomplete
        id="job-seeker-register-job-role"
        label={JOB_SEEKER_REGISTER_JOB_ROLE_LABEL}
        value={values.jobRole}
        placeholder={JOB_SEEKER_REGISTER_JOB_ROLE_PLACEHOLDER}
        disabled={disabled}
        error={fieldErrors.jobRole}
        onChange={(value) => onChange({ jobRole: value })}
      />

      <div className="employer-register-form-row">
        <div className="employer-register-form-stack">
          <EmployerRegisterSearchableSelect
            id="job-seeker-register-job-type"
            name="jobType"
            label={JOB_SEEKER_REGISTER_JOB_TYPE_LABEL}
            value={values.jobType}
            placeholder={JOB_SEEKER_REGISTER_JOB_TYPE_PLACEHOLDER}
            options={JOB_SEEKER_JOB_TYPE_OPTIONS}
            onChange={(value) => onChange({ jobType: value })}
            required
            disabled={disabled}
            aria-invalid={Boolean(fieldErrors.jobType)}
            aria-describedby={fieldErrors.jobType ? jobTypeErrorId : undefined}
          />
          <FieldError id={jobTypeErrorId} message={fieldErrors.jobType} />
        </div>

        <div className="employer-register-form-stack">
          <EmployerRegisterSearchableSelect
            id="job-seeker-register-work-mode"
            name="workMode"
            label={JOB_SEEKER_REGISTER_WORK_MODE_LABEL}
            value={values.workMode}
            placeholder={JOB_SEEKER_REGISTER_WORK_MODE_PLACEHOLDER}
            options={JOB_SEEKER_WORK_MODE_OPTIONS}
            onChange={(value) => onChange({ workMode: value })}
            required
            disabled={disabled}
            aria-invalid={Boolean(fieldErrors.workMode)}
            aria-describedby={
              fieldErrors.workMode ? workModeErrorId : undefined
            }
          />
          <FieldError id={workModeErrorId} message={fieldErrors.workMode} />
        </div>
      </div>

      <JobSeekerPreferredLocationAutocomplete
        id="job-seeker-register-preferred-location"
        label={JOB_SEEKER_REGISTER_PREFERRED_LOCATION_LABEL}
        value={values.preferredJobLocation}
        placeholder={JOB_SEEKER_REGISTER_PREFERRED_LOCATION_PLACEHOLDER}
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
          {JOB_SEEKER_REGISTER_EXPECTED_SALARY_LABEL}
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
            placeholder={JOB_SEEKER_REGISTER_EXPECTED_SALARY_PLACEHOLDER}
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
              label="Salary period"
              value={values.expectedSalaryPeriod}
              placeholder="Select period"
              options={JOB_SEEKER_REGISTER_SALARY_PERIOD_OPTIONS}
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
        <FieldError id={salaryErrorId} message={fieldErrors.expectedSalary} />
        <FieldError
          id={periodErrorId}
          message={fieldErrors.expectedSalaryPeriod}
        />
      </div>
    </>
  );
}
