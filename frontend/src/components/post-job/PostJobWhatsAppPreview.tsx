"use client";

import asliJobsAvatar from "@/assets/logos/Frame 130.png";
import whatsappChatBg from "@/assets/post-job-whatsapp-chat-bg.png";
import whatsappInputBar from "@/assets/post-job-whatsapp-input.png";
import whatsappIconBattery from "@/assets/post-job-wa/icon-group-2.png";
import whatsappIconMenu from "@/assets/post-job-wa/icon-menu.png";
import whatsappIconPhone from "@/assets/post-job-wa/icon-vector-b.png";
import whatsappIconSignal from "@/assets/post-job-wa/icon-group-1.png";
import whatsappIconVideo from "@/assets/post-job-wa/icon-video.png";
import whatsappIconWifi from "@/assets/post-job-wa/icon-vector-a.png";
import whatsappStatusTime from "@/assets/post-job-wa/status-time.png";
import {
  POST_JOB_PREVIEW_LANGUAGE_OPTIONS,
  type PostJobPreviewLanguageId,
} from "@/constants/post-job";
import type { PostJobWizardFormData } from "@/types/post-job";
import { buildWhatsAppPreviewContent } from "@/utils/build-whatsapp-preview";
import { cn } from "@/utils/cn";
import { Check, ChevronDown, ChevronLeft } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type PostJobWhatsAppPreviewProps = {
  formData: PostJobWizardFormData;
};

export function PostJobWhatsAppPreview({
  formData,
}: PostJobWhatsAppPreviewProps) {
  const [language, setLanguage] =
    useState<PostJobPreviewLanguageId>("english");
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const preview = buildWhatsAppPreviewContent(formData);
  const selectedLanguageLabel =
    POST_JOB_PREVIEW_LANGUAGE_OPTIONS.find((option) => option.value === language)
      ?.label ?? "English";

  return (
    <aside
      aria-label="WhatsApp message preview"
      className="flex h-full min-h-full w-full flex-col rounded-2xl bg-[#EEFFFB] p-4 sm:p-5"
    >
      <div className="mb-4">
        <h2 className="text-base font-bold text-foreground sm:text-lg">
          WhatsApp Message Preview
        </h2>
        <p className="mt-1 text-xs leading-snug text-muted sm:text-sm">
          This is how your job will appear to candidates on WhatsApp
        </p>
      </div>

      <div className="relative mb-4">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isLanguageOpen}
          onClick={() => setIsLanguageOpen((open) => !open)}
          className="flex h-11 w-full items-center justify-between gap-3 rounded-lg bg-primary-soft px-4 text-sm font-semibold text-surface transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
            {POST_JOB_PREVIEW_LANGUAGE_OPTIONS.map((option) => {
              const selected = option.value === language;

              return (
                <li key={option.value} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-primary-light",
                      selected
                        ? "font-semibold text-primary-soft"
                        : "text-foreground",
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

      <div className="mx-auto w-full max-w-[22rem]">
        <div className="overflow-hidden rounded-[1.75rem] border border-border bg-surface shadow-md">
          <div className="border-b border-border-subtle bg-surface">
            <div className="flex items-center justify-between px-3.5 pb-0.5 pt-2">
              <Image
                src={whatsappStatusTime}
                alt=""
                width={29}
                height={9}
                className="h-2.5 w-auto object-contain"
                aria-hidden="true"
              />
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <Image
                  src={whatsappIconWifi}
                  alt=""
                  width={20}
                  height={14}
                  className="h-3 w-auto object-contain"
                />
                <Image
                  src={whatsappIconSignal}
                  alt=""
                  width={20}
                  height={15}
                  className="h-3 w-auto object-contain"
                />
                <Image
                  src={whatsappIconBattery}
                  alt=""
                  width={7}
                  height={14}
                  className="h-3.5 w-auto object-contain"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-2 pb-2.5 pt-1">
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <ChevronLeft
                  className="size-5 shrink-0 text-foreground"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <Image
                  src={asliJobsAvatar}
                  alt=""
                  width={108}
                  height={107}
                  className="size-8 shrink-0 rounded-full object-cover"
                  aria-hidden="true"
                />
                <p className="truncate text-[0.9375rem] font-semibold leading-none text-foreground">
                  Aslijobs
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3.5 pr-1" aria-hidden="true">
                <Image
                  src={whatsappIconVideo}
                  alt=""
                  width={24}
                  height={24}
                  className="size-[1.125rem] object-contain"
                />
                <Image
                  src={whatsappIconPhone}
                  alt=""
                  width={15}
                  height={15}
                  className="size-[1.05rem] object-contain"
                />
                <Image
                  src={whatsappIconMenu}
                  alt=""
                  width={25}
                  height={25}
                  className="size-[1.125rem] object-contain"
                />
              </div>
            </div>
          </div>

          <div className="relative flex min-h-[30.5rem] flex-col overflow-hidden">
            <Image
              src={whatsappChatBg}
              alt=""
              fill
              sizes="351px"
              className="object-cover object-center"
              aria-hidden="true"
              priority={false}
            />

            <div className="relative z-10 flex flex-1 flex-col px-3 pb-2 pt-3">
              <article className="max-w-[92%] rounded-xl rounded-tl-sm bg-surface px-3.5 py-3 shadow-sm">
                <p className="text-sm font-semibold text-foreground">
                  <span aria-hidden="true">📢 </span>
                  New Job Alert
                </p>
                <p className="mt-2 text-base font-bold text-foreground">
                  {preview.jobTitle}
                </p>

                <dl className="mt-3 space-y-1.5 text-[0.8125rem] leading-snug text-foreground">
                  {preview.rows.map((row) => (
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
                  <span className="text-employer-button underline underline-offset-2">
                    https://aslijobs.com/jobs
                  </span>
                </p>
              </article>
            </div>

            <div className="relative z-10 mt-auto bg-surface px-1.5 pb-1.5 pt-1">
              <Image
                src={whatsappInputBar}
                alt=""
                width={640}
                height={96}
                className="h-auto w-full object-contain object-bottom"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
