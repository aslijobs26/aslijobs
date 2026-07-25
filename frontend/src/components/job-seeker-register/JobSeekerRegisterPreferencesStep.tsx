"use client";

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
  disabled = false,
  onChange,
}: JobSeekerRegisterPreferencesStepProps) {
  return (
    <>
      <div className="employer-register-form-row">
        <div className="employer-register-form-stack">
          <label
            htmlFor="job-seeker-register-dob"
            className="employer-register-form-label"
          >
            {JOB_SEEKER_REGISTER_DOB_LABEL}
          </label>
          <PostJobDatePicker
            id="job-seeker-register-dob"
            value={values.dateOfBirth}
            placeholder={JOB_SEEKER_REGISTER_DOB_PLACEHOLDER}
            maxDate={getLocalTodayIso()}
            compact
            onChange={(value) => onChange({ dateOfBirth: value })}
            aria-label="Date of birth"
          />
        </div>

        <EmployerRegisterSearchableSelect
          id="job-seeker-register-gender"
          label={JOB_SEEKER_REGISTER_GENDER_LABEL}
          value={values.gender}
          placeholder={JOB_SEEKER_REGISTER_GENDER_PLACEHOLDER}
          options={JOB_SEEKER_GENDER_OPTIONS}
          onChange={(value) => onChange({ gender: value })}
          required
          disabled={disabled}
        />
      </div>

      <JobSeekerJobRoleAutocomplete
        id="job-seeker-register-job-role"
        label={JOB_SEEKER_REGISTER_JOB_ROLE_LABEL}
        value={values.jobRole}
        placeholder={JOB_SEEKER_REGISTER_JOB_ROLE_PLACEHOLDER}
        disabled={disabled}
        onChange={(value) => onChange({ jobRole: value })}
      />

      <div className="employer-register-form-row">
        <EmployerRegisterSearchableSelect
          id="job-seeker-register-job-type"
          label={JOB_SEEKER_REGISTER_JOB_TYPE_LABEL}
          value={values.jobType}
          placeholder={JOB_SEEKER_REGISTER_JOB_TYPE_PLACEHOLDER}
          options={JOB_SEEKER_JOB_TYPE_OPTIONS}
          onChange={(value) => onChange({ jobType: value })}
          required
          disabled={disabled}
        />

        <EmployerRegisterSearchableSelect
          id="job-seeker-register-work-mode"
          label={JOB_SEEKER_REGISTER_WORK_MODE_LABEL}
          value={values.workMode}
          placeholder={JOB_SEEKER_REGISTER_WORK_MODE_PLACEHOLDER}
          options={JOB_SEEKER_WORK_MODE_OPTIONS}
          onChange={(value) => onChange({ workMode: value })}
          required
          disabled={disabled}
        />
      </div>

      <JobSeekerPreferredLocationAutocomplete
        id="job-seeker-register-preferred-location"
        label={JOB_SEEKER_REGISTER_PREFERRED_LOCATION_LABEL}
        value={values.preferredJobLocation}
        placeholder={JOB_SEEKER_REGISTER_PREFERRED_LOCATION_PLACEHOLDER}
        disabled={disabled}
        onChange={(value) => onChange({ preferredJobLocation: value })}
      />

      <div className="employer-register-form-stack">
        <label
          htmlFor="job-seeker-register-expected-salary"
          className="employer-register-form-label"
        >
          {JOB_SEEKER_REGISTER_EXPECTED_SALARY_LABEL}
        </label>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
          <input
            id="job-seeker-register-expected-salary"
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
            disabled={disabled}
          />
          <div className="w-full sm:w-[11.5rem]">
            <EmployerRegisterSearchableSelect
              id="job-seeker-register-salary-period"
              label="Salary period"
              value={values.expectedSalaryPeriod}
              placeholder="Select period"
              options={JOB_SEEKER_REGISTER_SALARY_PERIOD_OPTIONS}
              onChange={(value) => onChange({ expectedSalaryPeriod: value })}
              hideLabel
              hideSearch
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </>
  );
}
