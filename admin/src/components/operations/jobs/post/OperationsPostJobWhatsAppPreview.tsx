import { useState } from "react";
import { Check, ChevronDown, ChevronLeft } from "lucide-react";

import waChatBg from "../../../../assets/wa-chat-bg.png";
import waStatusTime from "../../../../assets/wa-status-time.png";
import waIconWifi from "../../../../assets/wa-icon-wifi.png";
import waIconSignal from "../../../../assets/wa-icon-signal.png";
import waIconBattery from "../../../../assets/wa-icon-battery.png";
import waIconVideo from "../../../../assets/wa-icon-video.png";
import waIconPhone from "../../../../assets/wa-icon-phone.png";
import waIconMenu from "../../../../assets/wa-icon-menu.png";
import waInputBar from "../../../../assets/wa-input-bar.png";
import waAvatar from "../../../../assets/wa-aslijobs-avatar.png";

import {
  buildOperationsWhatsAppPreview,
} from "../../../../utils/build-operations-whatsapp-preview";
import type {
  OperationsEmployerOption,
  OperationsPostJobWizardFormData,
} from "../../../../types/operations-post-job";
import { cn } from "../../../../utils/cn";

const PREVIEW_LANGUAGE_OPTIONS = [
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi" },
  { value: "telugu", label: "Telugu" },
  { value: "tamil", label: "Tamil" },
  { value: "kannada", label: "Kannada" },
  { value: "malayalam", label: "Malayalam" },
] as const;

type PreviewLanguage = (typeof PREVIEW_LANGUAGE_OPTIONS)[number]["value"];

interface Props {
  formData: OperationsPostJobWizardFormData;
  selectedEmployer: OperationsEmployerOption | null;
  employerAssigned: boolean;
}

export function OperationsPostJobWhatsAppPreview({
  formData,
  selectedEmployer,
  employerAssigned,
}: Props) {
  const [language, setLanguage] = useState<PreviewLanguage>("english");
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const companyName =
    selectedEmployer?.displayName ||
    selectedEmployer?.companyName ||
    formData.jobInformation.companyDetails.trim();

  const preview = buildOperationsWhatsAppPreview(formData, companyName);

  const selectedLanguageLabel =
    PREVIEW_LANGUAGE_OPTIONS.find((o) => o.value === language)?.label ?? "English";

  return (
    <aside
      aria-label="WhatsApp message preview"
      className="flex min-w-0 flex-col xl:sticky xl:top-2"
    >
      <div className="rounded-xl border border-border-subtle bg-surface shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2.5 sm:px-4">
          <h2 className="text-sm font-semibold text-foreground">WhatsApp Preview</h2>
          <span className="ml-auto inline-flex rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Preview
          </span>
        </div>

        <div className="flex flex-col gap-3 p-3 sm:p-4">
          <p className="text-xs leading-snug text-muted">
            This is how your job will appear to candidates on WhatsApp
          </p>

          {/* Language selector */}
          <div className="relative">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isLanguageOpen}
              onClick={() => setIsLanguageOpen((open) => !open)}
              className="flex h-10 w-full items-center justify-between gap-3 rounded-lg bg-primary-soft px-4 text-sm font-semibold text-surface transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Check className="size-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                <span className="truncate">{selectedLanguageLabel}</span>
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 transition-transform",
                  isLanguageOpen && "rotate-180",
                )}
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>

            {isLanguageOpen ? (
              <ul
                role="listbox"
                aria-label="Preview language"
                className="absolute inset-x-0 z-20 mt-1 overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-lg"
              >
                {PREVIEW_LANGUAGE_OPTIONS.map((option) => {
                  const selected = option.value === language;
                  return (
                    <li key={option.value} role="option" aria-selected={selected}>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-primary-light",
                          selected ? "font-semibold text-primary-soft" : "text-foreground",
                        )}
                        onClick={() => {
                          setLanguage(option.value);
                          setIsLanguageOpen(false);
                        }}
                      >
                        <span>{option.label}</span>
                        {selected ? (
                          <Check
                            className="size-4 shrink-0 text-primary-soft"
                            strokeWidth={2.5}
                            aria-hidden="true"
                          />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          {/* Phone mockup */}
          <div className="mx-auto w-full max-w-[22rem]">
            <div className="overflow-hidden rounded-[1.75rem] border border-border bg-surface shadow-md">
              {/* Status bar + nav bar */}
              <div className="border-b border-border-subtle bg-surface">
                <div className="flex items-center justify-between px-3.5 pb-0.5 pt-2">
                  <img
                    src={waStatusTime}
                    alt=""
                    aria-hidden="true"
                    className="h-2.5 w-auto object-contain"
                  />
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    <img src={waIconWifi} alt="" className="h-3 w-auto object-contain" />
                    <img src={waIconSignal} alt="" className="h-3 w-auto object-contain" />
                    <img src={waIconBattery} alt="" className="h-3.5 w-auto object-contain" />
                  </div>
                </div>

                <div className="flex items-center gap-2 px-2 pb-2.5 pt-1">
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <ChevronLeft
                      className="size-5 shrink-0 text-foreground"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <img
                      src={waAvatar}
                      alt=""
                      aria-hidden="true"
                      className="size-8 shrink-0 rounded-full object-cover"
                    />
                    <p className="truncate text-[0.9375rem] font-semibold leading-none text-foreground">
                      Aslijobs
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3.5 pr-1" aria-hidden="true">
                    <img src={waIconVideo} alt="" className="size-[1.125rem] object-contain" />
                    <img src={waIconPhone} alt="" className="size-[1.05rem] object-contain" />
                    <img src={waIconMenu} alt="" className="size-[1.125rem] object-contain" />
                  </div>
                </div>
              </div>

              {/* Chat area */}
              <div
                className="relative flex min-h-[30.5rem] flex-col overflow-hidden"
                style={{
                  backgroundImage: `url(${waChatBg})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="relative z-10 flex flex-1 flex-col px-3 pb-2 pt-3">
                  <article className="max-w-[92%] rounded-xl rounded-tl-sm bg-surface px-3.5 py-3 shadow-sm">
                    <p className="text-sm font-semibold text-foreground">
                      <span aria-hidden="true">📢 </span>New Job Alert
                    </p>
                    <p className="mt-2 text-base font-bold text-foreground">
                      {preview.jobTitle}
                    </p>

                    <dl className="mt-3 space-y-1.5 text-[0.8125rem] leading-snug text-foreground">
                      {preview.rows
                        .filter((row) => row.value)
                        .map((row) => (
                          <div key={row.label} className="flex gap-1">
                            <dt className="shrink-0 font-semibold">{row.label}:</dt>
                            <dd className="min-w-0 break-words text-foreground/90">
                              {row.value}
                            </dd>
                          </div>
                        ))}
                    </dl>

                    <p className="mt-3 text-[0.8125rem] leading-snug text-foreground">
                      Apply now on AsliJobs
                      <br />
                      <span className="text-primary underline underline-offset-2">
                        https://aslijobs.com/jobs
                      </span>
                    </p>
                  </article>
                </div>

                {/* Input bar */}
                <div className="relative z-10 mt-auto bg-surface px-1.5 pb-1.5 pt-1">
                  <img
                    src={waInputBar}
                    alt=""
                    aria-hidden="true"
                    className="h-auto w-full object-contain object-bottom"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Employer assignment status */}
          <div
            className="rounded-lg border border-warning/25 bg-warning/10 px-3 py-2.5 text-[11px] leading-relaxed text-foreground"
            role="status"
          >
            {employerAssigned
              ? "Employer assigned. Complete all required fields and publish when ready."
              : "Job will remain in Draft until you assign an employer and publish it."}
          </div>
        </div>
      </div>
    </aside>
  );
}
