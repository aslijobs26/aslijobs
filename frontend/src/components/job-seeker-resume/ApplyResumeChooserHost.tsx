"use client";

import {
  closeApplyResumeChooser,
  registerApplyResumeChooser,
  type ApplyResumeChooserRequest,
} from "@/utils/apply-resume-chooser";
import type { ApplicationResumeSource } from "@/types/job-seeker-resume";
import { FileText, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export function ApplyResumeChooserHost() {
  const [request, setRequest] = useState<ApplyResumeChooserRequest | null>(
    null,
  );
  const [selected, setSelected] = useState<ApplicationResumeSource>("generated");

  useEffect(() => {
    registerApplyResumeChooser((next) => {
      setRequest(next);
      if (next) {
        setSelected(next.defaultSource);
      }
    });
    return () => {
      registerApplyResumeChooser(null);
    };
  }, []);

  if (!request) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-foreground/40 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          request.onCancel();
          closeApplyResumeChooser();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-resume-chooser-title"
        className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface p-5 shadow-xl sm:p-6"
      >
        <h2
          id="apply-resume-chooser-title"
          className="text-lg font-bold text-foreground"
        >
          Apply for {request.jobTitle}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Choose which resume to submit with this application.
        </p>

        <fieldset className="mt-5 space-y-2">
          <legend className="sr-only">Choose resume</legend>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-subtle px-3 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary-light/40">
            <input
              type="radio"
              name="apply-resume-source"
              className="mt-1 size-4 accent-[var(--color-primary)]"
              checked={selected === "generated"}
              onChange={() => setSelected("generated")}
            />
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="size-4 text-primary" aria-hidden="true" />
                AsliJobs Resume
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                Generated from your profile
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-subtle px-3 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary-light/40">
            <input
              type="radio"
              name="apply-resume-source"
              className="mt-1 size-4 accent-[var(--color-primary)]"
              checked={selected === "uploaded"}
              onChange={() => setSelected("uploaded")}
            />
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileText
                  className="size-4 text-resource-salary-icon"
                  aria-hidden="true"
                />
                My Uploaded Resume
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted">
                {request.uploadedResume.fileName}
              </span>
            </span>
          </label>
        </fieldset>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-subtle px-4 text-sm font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            onClick={() => {
              request.onCancel();
              closeApplyResumeChooser();
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            onClick={() => {
              const confirm = request.onConfirm;
              closeApplyResumeChooser();
              confirm(selected);
            }}
          >
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
}
