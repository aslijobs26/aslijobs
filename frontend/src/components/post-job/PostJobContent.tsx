"use client";

import {
  POST_JOB_INITIAL_STEP,
  POST_JOB_INITIAL_WIZARD_DATA,
} from "@/constants/post-job";
import type {
  CandidateInterviewFormData,
  LocationAndSalaryFormData,
  PostJobActiveStep,
  PostJobFormData,
  PostJobWizardFormData,
} from "@/types/post-job";
import { useEffect, useRef, useState, type RefObject } from "react";
import { CandidateInterviewForm } from "./CandidateInterviewForm";
import { JobInformationForm } from "./JobInformationForm";
import { LocationSalaryForm } from "./LocationSalaryForm";
import { PostJobStepper } from "./PostJobStepper";
import {
  postJobContentShellClassName,
  postJobFormColumnClassName,
  postJobLayoutGridClassName,
} from "./post-job-form-styles";

function PostJobActiveSection({
  activeStep,
  formData,
  onJobInformationChange,
  onLocationSalaryChange,
  onCandidateInterviewChange,
  onStepChange,
  scrollContainerRef,
}: {
  activeStep: PostJobActiveStep;
  formData: PostJobWizardFormData;
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
  onStepChange: (step: PostJobActiveStep) => void;
  scrollContainerRef: RefObject<HTMLFormElement | null>;
}) {
  if (activeStep === 1) {
    return (
      <JobInformationForm
        formData={formData.jobInformation}
        onFieldChange={onJobInformationChange}
        onContinue={() => onStepChange(2)}
        scrollContainerRef={scrollContainerRef}
      />
    );
  }

  if (activeStep === 2) {
    return (
      <LocationSalaryForm
        formData={formData.locationAndSalary}
        onFieldChange={onLocationSalaryChange}
        onBack={() => onStepChange(1)}
        onContinue={() => onStepChange(3)}
        scrollContainerRef={scrollContainerRef}
      />
    );
  }

  return (
    <CandidateInterviewForm
      formData={formData.candidateAndInterview}
      onFieldChange={onCandidateInterviewChange}
      onBack={() => onStepChange(2)}
      scrollContainerRef={scrollContainerRef}
    />
  );
}

export function PostJobContent() {
  const [activeStep, setActiveStep] =
    useState<PostJobActiveStep>(POST_JOB_INITIAL_STEP);
  const [formData, setFormData] = useState<PostJobWizardFormData>(
    POST_JOB_INITIAL_WIZARD_DATA,
  );
  const formScrollRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeStep]);

  const updateJobInformation = <K extends keyof PostJobFormData>(
    field: K,
    value: PostJobFormData[K],
  ) => {
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
    setFormData((current) => ({
      ...current,
      candidateAndInterview: {
        ...current.candidateAndInterview,
        [field]: value,
      },
    }));
  };

  return (
    <div className={postJobContentShellClassName}>
      <div className={postJobLayoutGridClassName}>
        <PostJobStepper activeStep={activeStep} onStepChange={setActiveStep} />

        <div className={postJobFormColumnClassName}>
          <PostJobActiveSection
            activeStep={activeStep}
            formData={formData}
            onJobInformationChange={updateJobInformation}
            onLocationSalaryChange={updateLocationAndSalary}
            onCandidateInterviewChange={updateCandidateAndInterview}
            onStepChange={setActiveStep}
            scrollContainerRef={formScrollRef}
          />
        </div>
      </div>
    </div>
  );
}
