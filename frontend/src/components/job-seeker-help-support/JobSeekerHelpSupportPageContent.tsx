"use client";

import { SocialIcon } from "@/components/layout/footer/footer-social-icons";
import { WhatsAppIcon } from "@/components/home/hero/HeroIcons";
import { WHATSAPP_JOIN_URL } from "@/constants/cta";
import {
  filterJobSeekerHelpArticles,
  getAllJobSeekerHelpArticles,
  getFirstName,
  getJobSeekerHelpFeaturedFaqs,
  getJobSeekerHelpTopics,
  JOB_SEEKER_HELP_AI_BADGE,
  JOB_SEEKER_HELP_AI_BODY,
  JOB_SEEKER_HELP_AI_COMING_SOON,
  JOB_SEEKER_HELP_AI_CTA,
  JOB_SEEKER_HELP_AI_TITLE,
  JOB_SEEKER_HELP_CONNECT_DESCRIPTION,
  JOB_SEEKER_HELP_CONNECT_TITLE,
  JOB_SEEKER_HELP_FAQ_HEADING,
  JOB_SEEKER_HELP_SEARCH_EMPTY_DESCRIPTION,
  JOB_SEEKER_HELP_SEARCH_EMPTY_TITLE,
  JOB_SEEKER_HELP_SEARCH_PLACEHOLDER,
  JOB_SEEKER_HELP_STILL_NEED_DESCRIPTION,
  JOB_SEEKER_HELP_STILL_NEED_TITLE,
  JOB_SEEKER_HELP_SUPPORT_EMAIL,
  JOB_SEEKER_HELP_SUPPORT_HOURS,
  JOB_SEEKER_HELP_SUPPORT_PHONE,
  JOB_SEEKER_HELP_SUPPORT_SUBTITLE,
  JOB_SEEKER_HELP_SUPPORT_TITLE,
  JOB_SEEKER_HELP_TICKETS_CREATE,
  JOB_SEEKER_HELP_TICKETS_CREATE_HREF,
  JOB_SEEKER_HELP_TICKETS_EMPTY,
  JOB_SEEKER_HELP_TICKETS_SUBTITLE,
  JOB_SEEKER_HELP_TICKETS_TITLE,
  JOB_SEEKER_HELP_TICKETS_VIEW_ALL,
  JOB_SEEKER_HELP_TOPICS_HEADING,
  JOB_SEEKER_HELP_VIEW_ALL_ARTICLES_HREF,
  JOB_SEEKER_HELP_VIEW_ALL_ARTICLES_LABEL,
  JOB_SEEKER_HELP_VIEW_ALL_FAQS_HREF,
  JOB_SEEKER_HELP_VIEW_ALL_FAQS_LABEL,
} from "@/constants/job-seeker-help-support";
import { SOCIAL_LINKS } from "@/constants/social";
import { useJobSeekerProfile } from "@/hooks/useJobSeekerProfile";
import type { HelpCenterArticle } from "@/types/help-center";
import type {
  JobSeekerHelpTopic,
  JobSeekerHelpTopicIconKey,
} from "@/types/job-seeker-help-support";
import { cn } from "@/utils/cn";
import {
  BadgeCheck,
  Briefcase,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Headset,
  Search,
  SearchX,
  ShieldCheck,
  Ticket,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  useId,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type SVGProps,
} from "react";

function SupportChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        fill="currentColor"
        d="M12 3c-4.7 0-8.5 3.36-8.5 7.5 0 2.16 1.05 4.1 2.72 5.45-.15.95-.58 2.05-1.42 3.1a.6.6 0 0 0 .54.95c1.95-.1 3.45-.85 4.45-1.55.7.18 1.44.3 2.21.3 4.7 0 8.5-3.36 8.5-7.5S16.7 3 12 3Z"
      />
      <circle cx="8.5" cy="10.5" r="1.15" fill="#fff" />
      <circle cx="12" cy="10.5" r="1.15" fill="#fff" />
      <circle cx="15.5" cy="10.5" r="1.15" fill="#fff" />
    </svg>
  );
}

function SupportEmailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        fill="currentColor"
        d="M3.75 7.25A2.5 2.5 0 0 1 6.25 4.75h11.5a2.5 2.5 0 0 1 2.5 2.5v9.5a2.5 2.5 0 0 1-2.5 2.5H6.25a2.5 2.5 0 0 1-2.5-2.5v-9.5Z"
      />
      <path
        fill="#fff"
        d="M5.9 7.85c.2-.28.55-.4.88-.3L12 9.1l5.22-1.55c.33-.1.68.02.88.3.14.2.15.46.02.67L12.7 14.7a1.1 1.1 0 0 1-1.4 0L5.88 8.52a.6.6 0 0 1 .02-.67Z"
      />
    </svg>
  );
}

function SupportPhoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        fill="currentColor"
        d="M8.1 3.85c.5-.5 1.32-.42 1.7.18l1.05 1.7c.32.52.16 1.2-.36 1.55l-.78.52a.45.45 0 0 0-.14.6 8.8 8.8 0 0 0 4.2 4.2c.24.12.53.06.66-.14l.52-.78c.35-.52 1.03-.68 1.55-.36l1.7 1.05c.6.38.68 1.2.18 1.7l-.95.95c-.52.52-1.28.78-2.04.6-2.1-.5-4.15-1.8-5.95-3.6-1.8-1.8-3.1-3.85-3.6-5.95-.18-.76.08-1.52.6-2.04l.95-.95Z"
      />
    </svg>
  );
}

const topics = getJobSeekerHelpTopics();
const featuredFaqs = getJobSeekerHelpFeaturedFaqs();
const allArticles = getAllJobSeekerHelpArticles();

const topicIconStyles: Record<
  JobSeekerHelpTopicIconKey,
  { surface: string; cardHover: string }
> = {
  account: {
    surface:
      "bg-resource-guide-icon-surface text-resource-guide-icon group-hover:bg-resource-guide-icon group-hover:text-surface",
    cardHover: "hover:border-resource-guide-icon/55",
  },
  jobs: {
    surface:
      "bg-benefit-verified-surface text-benefit-verified-icon group-hover:bg-benefit-verified-icon group-hover:text-surface",
    cardHover: "hover:border-benefit-verified-icon/55",
  },
  interviews: {
    surface:
      "bg-resource-resume-icon-surface text-resource-resume-icon group-hover:bg-resource-resume-icon group-hover:text-surface",
    cardHover: "hover:border-resource-resume-icon/55",
  },
  payments: {
    surface:
      "bg-benefit-voice-surface text-benefit-voice-icon group-hover:bg-benefit-voice-icon group-hover:text-surface",
    cardHover: "hover:border-benefit-voice-icon/55",
  },
  safety: {
    surface:
      "bg-primary-light text-primary group-hover:bg-primary group-hover:text-surface",
    cardHover: "hover:border-primary/55",
  },
};

function TopicIcon({ icon }: { icon: JobSeekerHelpTopicIconKey }): ReactNode {
  const className = "size-5";
  switch (icon) {
    case "account":
      return <UserRound className={className} strokeWidth={2} aria-hidden />;
    case "jobs":
      return <Briefcase className={className} strokeWidth={2} aria-hidden />;
    case "interviews":
      return <Headset className={className} strokeWidth={2} aria-hidden />;
    case "payments":
      return (
        <CircleDollarSign className={className} strokeWidth={2} aria-hidden />
      );
    case "safety":
      return <ShieldCheck className={className} strokeWidth={2} aria-hidden />;
  }
}

function FaqAccordionItem({
  article,
  isOpen,
  onToggle,
}: {
  article: HelpCenterArticle;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();
  const buttonId = useId();

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
        >
          <span className="min-w-0 text-xs font-semibold text-foreground sm:text-sm">
            {article.question}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted transition-transform",
              isOpen && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!isOpen}
        className="border-t border-border-subtle bg-job-card-selected-surface px-4 py-3"
      >
        <p className="text-xs leading-relaxed text-muted sm:text-sm">
          {article.answer}
        </p>
      </div>
    </div>
  );
}

function SupportActionRow({
  href,
  icon,
  title,
  description,
  external,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="flex items-center gap-3 px-3.5 py-3.5 transition-colors hover:bg-hero-bg/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 sm:px-4"
    >
      <span className="inline-flex size-7 shrink-0 items-center justify-center text-resource-guide-icon [&_svg]:size-[1.45rem]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold leading-snug text-foreground">
          {title}
        </span>
        <span className="mt-0.5 block text-[11px] leading-snug text-muted sm:text-xs">
          {description}
        </span>
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-foreground/50"
        strokeWidth={2.4}
        aria-hidden
      />
    </a>
  );
}

export function JobSeekerHelpSupportPageContent() {
  const profileQuery = useJobSeekerProfile();
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

  const firstName = getFirstName(profileQuery.data?.fullName);

  const searchResults = useMemo(
    () => filterJobSeekerHelpArticles(allArticles, searchQuery),
    [searchQuery],
  );

  const activeTopic: JobSeekerHelpTopic | null = useMemo(
    () => topics.find((topic) => topic.id === activeTopicId) ?? null,
    [activeTopicId],
  );

  const isSearching = searchQuery.trim().length > 0;
  const whatsappExternal = WHATSAPP_JOIN_URL.startsWith("http");
  const phoneHref = `tel:${JOB_SEEKER_HELP_SUPPORT_PHONE.replace(/\s+/g, "")}`;

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setSearchQuery("");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_19rem] xl:gap-8">
        <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
          <header className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-2xl lg:text-[1.75rem]">
                {JOB_SEEKER_HELP_SUPPORT_TITLE}
              </h1>
              <BadgeCheck
                className="size-4 shrink-0 text-primary-soft sm:size-6"
                strokeWidth={2}
                aria-hidden
              />
              <span className="sr-only">Verified support</span>
            </div>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted sm:text-[15px]">
              {JOB_SEEKER_HELP_SUPPORT_SUBTITLE}
            </p>
          </header>

          <div className="relative">
            <label htmlFor="job-seeker-help-search" className="sr-only">
              Search help
            </label>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted sm:size-[18px]"
              strokeWidth={2}
              aria-hidden
            />
            <input
              id="job-seeker-help-search"
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setActiveTopicId(null);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={JOB_SEEKER_HELP_SEARCH_PLACEHOLDER}
              className="h-11 w-full min-w-0 rounded-2xl border border-border bg-surface py-2 pr-4 pl-11 text-xs text-foreground shadow-sm outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 sm:h-12 sm:text-sm"
              autoComplete="off"
            />
          </div>

          {isSearching ? (
            <section
              aria-labelledby="help-search-results-heading"
              className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
            >
              <h2
                id="help-search-results-heading"
                className="text-base font-bold text-foreground"
              >
                Search results
              </h2>
              {searchResults.length === 0 ? (
                <div className="mt-4 flex flex-col items-center gap-2 py-8 text-center">
                  <SearchX className="size-8 text-muted" aria-hidden />
                  <p className="text-sm font-semibold text-foreground">
                    {JOB_SEEKER_HELP_SEARCH_EMPTY_TITLE}
                  </p>
                  <p className="text-sm text-muted">
                    {JOB_SEEKER_HELP_SEARCH_EMPTY_DESCRIPTION}
                  </p>
                </div>
              ) : (
                <ul className="mt-4 space-y-2">
                  {searchResults.map((article) => (
                    <li key={article.id}>
                      <details className="group rounded-xl border border-border-subtle bg-hero-bg open:bg-surface">
                        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                          <span className="flex items-center justify-between gap-2">
                            {article.question}
                            <ChevronDown
                              className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180"
                              aria-hidden
                            />
                          </span>
                        </summary>
                        <p className="border-t border-border-subtle bg-job-card-selected-surface px-4 py-3 text-sm leading-relaxed text-muted">
                          {article.answer}
                        </p>
                      </details>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          <section aria-labelledby="popular-topics-heading" className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 sm:mb-4">
              <h2
                id="popular-topics-heading"
                className="text-base font-bold text-foreground sm:text-lg"
              >
                {JOB_SEEKER_HELP_TOPICS_HEADING}
              </h2>
              <Link
                href={JOB_SEEKER_HELP_VIEW_ALL_ARTICLES_HREF}
                className="shrink-0 text-xs font-semibold text-employer-button transition-colors hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-sm"
              >
                {JOB_SEEKER_HELP_VIEW_ALL_ARTICLES_LABEL}
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-5">
              {topics.map((topic) => {
                const styles = topicIconStyles[topic.icon];
                const isActive = activeTopicId === topic.id;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() =>
                      setActiveTopicId((current) =>
                        current === topic.id ? null : topic.id,
                      )
                    }
                    aria-pressed={isActive}
                    className={cn(
                      "group flex h-full min-w-0 flex-col items-center rounded-2xl border bg-surface px-2.5 py-3 text-center shadow-sm transition-[border-color,box-shadow,background-color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none sm:px-3 sm:py-3.5",
                      isActive
                        ? "border-primary bg-hero-bg/50 shadow-md"
                        : cn(
                            "border-border hover:bg-hero-bg/40 hover:shadow-md",
                            styles.cardHover,
                          ),
                    )}
                  >
                    <span
                      className={cn(
                        "mb-2 inline-flex size-10 items-center justify-center rounded-full transition-[transform,background-color,color] duration-200 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:mb-2.5 sm:size-11",
                        styles.surface,
                        isActive && "scale-105",
                      )}
                    >
                      <TopicIcon icon={topic.icon} />
                    </span>
                    <span className="text-[11px] font-bold leading-snug text-foreground sm:text-xs md:text-[13px]">
                      {topic.title}
                    </span>
                    <span className="mt-1 line-clamp-2 text-[10px] leading-snug text-muted sm:text-[11px]">
                      {topic.description}
                    </span>
                    <span className="mt-auto pt-2 text-[10px] font-semibold text-primary-soft transition-colors duration-200 group-hover:text-primary sm:pt-2.5 sm:text-[11px]">
                      {topic.articleCount}{" "}
                      {topic.articleCount === 1 ? "Article" : "Articles"}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeTopic ? (
              <div className="mt-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-foreground">
                    {activeTopic.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTopicId(null)}
                    className="text-xs font-semibold text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    Close
                  </button>
                </div>
                <ul className="space-y-2">
                  {activeTopic.articles.map((article) => (
                    <li key={article.id}>
                      <details className="group rounded-xl border border-border-subtle">
                        <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                          <span className="flex items-center justify-between gap-2">
                            {article.question}
                            <ChevronDown
                              className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180"
                              aria-hidden
                            />
                          </span>
                        </summary>
                        <p className="border-t border-border-subtle bg-job-card-selected-surface px-3 py-2.5 text-sm leading-relaxed text-muted">
                          {article.answer}
                        </p>
                      </details>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <div className="grid grid-cols-1 items-start gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(16.5rem,1fr)] lg:gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,1fr)] xl:gap-6">
            <section aria-labelledby="faq-heading" className="min-w-0">
              <h2
                id="faq-heading"
                className="mb-3 text-base font-bold text-foreground sm:mb-4 sm:text-lg"
              >
                {JOB_SEEKER_HELP_FAQ_HEADING}
              </h2>
              <div className="space-y-2 sm:space-y-2.5">
                {featuredFaqs.map((article) => (
                  <FaqAccordionItem
                    key={article.id}
                    article={article}
                    isOpen={openFaqId === article.id}
                    onToggle={() =>
                      setOpenFaqId((current) =>
                        current === article.id ? null : article.id,
                      )
                    }
                  />
                ))}
              </div>
              <div className="mt-3 sm:mt-4">
                <Link
                  href={JOB_SEEKER_HELP_VIEW_ALL_FAQS_HREF}
                  className="text-xs font-semibold text-employer-button transition-colors hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-sm"
                >
                  {JOB_SEEKER_HELP_VIEW_ALL_FAQS_LABEL}
                </Link>
              </div>
            </section>

            <section
              aria-labelledby="still-need-help-heading"
              className="relative min-w-0 overflow-hidden rounded-2xl border border-border bg-resource-guide-surface"
            >
              <div className="relative px-4 pt-5 pb-4 sm:px-5 sm:pt-6 sm:pb-5">
                <div className="relative min-h-[6.75rem] sm:min-h-[7.5rem]">
                  <div className="relative z-10 max-w-[52%] pt-4 pr-1 sm:pt-5">
                    <h2
                      id="still-need-help-heading"
                      className="text-base font-bold leading-tight tracking-tight text-foreground sm:text-lg"
                    >
                      {JOB_SEEKER_HELP_STILL_NEED_TITLE}
                    </h2>
                    <p className="mt-1 text-[11px] leading-snug text-muted sm:text-xs">
                      {JOB_SEEKER_HELP_STILL_NEED_DESCRIPTION}
                    </p>
                  </div>

                  {/* eslint-disable-next-line @next/next/no-img-element -- static support illustration PNG */}
                  <img
                    src="/images/help-support-agent.png?v=3"
                    alt=""
                    width={260}
                    height={173}
                    className="pointer-events-none absolute right-0 bottom-0 z-0 h-[8.75rem] w-auto max-w-[56%] -mb-3.5 object-contain object-bottom sm:h-[9.75rem] sm:-mb-4"
                  />
                </div>

                <div className="relative z-10 overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-sm">
                  <div className="divide-y divide-border-subtle">
                    <SupportActionRow
                      href={WHATSAPP_JOIN_URL}
                      external={whatsappExternal}
                      icon={<SupportChatIcon className="size-full" />}
                      title="Chat with Support"
                      description="Get instant help"
                    />
                    <SupportActionRow
                      href={`mailto:${JOB_SEEKER_HELP_SUPPORT_EMAIL}`}
                      icon={<SupportEmailIcon className="size-full" />}
                      title="Email Support"
                      description={JOB_SEEKER_HELP_SUPPORT_EMAIL}
                    />
                    <SupportActionRow
                      href={phoneHref}
                      icon={<SupportPhoneIcon className="size-full" />}
                      title="Call Support"
                      description={
                        <>
                          <span className="block">
                            {JOB_SEEKER_HELP_SUPPORT_PHONE}
                          </span>
                          <span className="block">
                            {JOB_SEEKER_HELP_SUPPORT_HOURS}
                          </span>
                        </>
                      }
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          <section
            aria-labelledby="ai-help-heading"
            className="rounded-2xl border border-border bg-surface p-3.5 shadow-sm sm:p-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="ai-help-heading"
                className="text-sm font-bold text-foreground sm:text-base"
              >
                {JOB_SEEKER_HELP_AI_TITLE}
              </h2>
              <span className="rounded-full bg-benefit-verified-surface px-2 py-0.5 text-[10px] font-bold tracking-wide text-benefit-verified-icon uppercase">
                {JOB_SEEKER_HELP_AI_BADGE}
              </span>
            </div>

            <div className="mt-3 flex gap-2.5 sm:mt-4 sm:gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- static Asli AI PNG asset */}
              <img
                src="/images/asli-ai-reminders-bot.png?v=2"
                alt=""
                width={48}
                height={48}
                className="size-10 shrink-0 bg-transparent object-contain sm:size-12"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium leading-snug text-foreground sm:text-sm sm:font-semibold sm:leading-relaxed lg:text-xs lg:font-medium lg:leading-snug">
                  Hi {firstName}! {JOB_SEEKER_HELP_AI_BODY}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled
              aria-disabled="true"
              title={JOB_SEEKER_HELP_AI_COMING_SOON}
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border-2 border-primary-soft/50 bg-surface px-3 text-xs font-semibold text-primary-soft opacity-80 sm:mt-4 sm:h-11 sm:px-4 sm:text-sm"
            >
              <WhatsAppIcon className="text-base text-primary-soft" />
              {JOB_SEEKER_HELP_AI_CTA}
              <span className="sr-only"> — {JOB_SEEKER_HELP_AI_COMING_SOON}</span>
            </button>
            <p className="mt-2 text-center text-[11px] font-medium text-muted sm:text-xs">
              {JOB_SEEKER_HELP_AI_COMING_SOON}
            </p>
          </section>

          <section
            aria-labelledby="support-tickets-heading"
            className="rounded-2xl border border-border bg-surface p-3.5 shadow-sm sm:p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <h2
                id="support-tickets-heading"
                className="text-sm font-bold text-foreground sm:text-base"
              >
                {JOB_SEEKER_HELP_TICKETS_TITLE}
              </h2>
              <Link
                href={JOB_SEEKER_HELP_TICKETS_CREATE_HREF}
                className="shrink-0 text-[11px] font-semibold text-employer-button transition-colors hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-xs"
              >
                {JOB_SEEKER_HELP_TICKETS_VIEW_ALL}
              </Link>
            </div>
            <p className="mt-1 text-[11px] font-semibold text-muted sm:text-xs">
              {JOB_SEEKER_HELP_TICKETS_SUBTITLE}
            </p>

            <div className="mt-3 flex flex-col items-center gap-2 rounded-xl bg-hero-bg px-3 py-5 text-center sm:mt-4 sm:px-4 sm:py-6">
              <Ticket className="size-6 text-muted sm:size-7" aria-hidden />
              <p className="text-xs text-muted sm:text-sm">
                {JOB_SEEKER_HELP_TICKETS_EMPTY}
              </p>
            </div>

            <Link
              href={JOB_SEEKER_HELP_TICKETS_CREATE_HREF}
              className="mt-3 inline-flex text-xs font-semibold text-employer-button transition-colors hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:mt-4 sm:text-sm"
            >
              {JOB_SEEKER_HELP_TICKETS_CREATE}
            </Link>
          </section>

          <section
            aria-labelledby="connect-heading"
            className="rounded-2xl border border-border bg-surface p-3.5 shadow-sm sm:p-5"
          >
            <h2
              id="connect-heading"
              className="text-sm font-bold text-foreground sm:text-base"
            >
              {JOB_SEEKER_HELP_CONNECT_TITLE}
            </h2>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              {JOB_SEEKER_HELP_CONNECT_DESCRIPTION}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 sm:mt-4 sm:gap-2.5">
              {SOCIAL_LINKS.map((link) => {
                const isExternal = link.href.startsWith("http");
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    aria-label={link.label}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full text-surface transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:size-10",
                      link.id === "facebook" && "bg-social-facebook",
                      link.id === "instagram" && "bg-social-instagram",
                      link.id === "linkedin" && "bg-social-linkedin",
                      link.id === "youtube" && "bg-social-youtube",
                    )}
                  >
                    <SocialIcon platform={link.id} className="size-4" />
                  </a>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
