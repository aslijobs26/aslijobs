"use client";

import { Container } from "@/components/layout/Container";
import { WHATSAPP_JOIN_URL } from "@/constants/cta";
import {
  HELP_CENTER_CALL_LABEL,
  HELP_CENTER_CATEGORIES,
  HELP_CENTER_EMAIL_LABEL,
  HELP_CENTER_EMPTY_DESCRIPTION,
  HELP_CENTER_EMPTY_TITLE,
  HELP_CENTER_PAGE_TITLE,
  HELP_CENTER_SEARCH_PLACEHOLDER,
  HELP_CENTER_SUPPORT_DESCRIPTION,
  HELP_CENTER_SUPPORT_TITLE,
  HELP_CENTER_WHATSAPP_LABEL,
} from "@/constants/help-center";
import { ROUTES } from "@/constants/routes";
import { useActiveLegalSection } from "@/hooks/useActiveLegalSection";
import type { HelpCenterArticle, HelpCenterCategory } from "@/types/help-center";
import { cn } from "@/utils/cn";
import { ChevronDown, Search, SearchX } from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function filterHelpCategories(
  categories: HelpCenterCategory[],
  query: string,
): HelpCenterCategory[] {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) {
    return categories;
  }

  return categories
    .map((category) => {
      const categoryMatches =
        category.title.toLowerCase().includes(normalizedQuery) ||
        category.description.toLowerCase().includes(normalizedQuery) ||
        category.cardTitle.toLowerCase().includes(normalizedQuery) ||
        category.cardDescription.toLowerCase().includes(normalizedQuery);

      const articles = category.articles.filter((article) => {
        const haystack = `${article.question} ${article.answer}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      });

      if (categoryMatches && articles.length === 0) {
        return category;
      }

      return {
        ...category,
        articles,
      };
    })
    .filter(
      (category) =>
        category.articles.length > 0 ||
        category.title.toLowerCase().includes(normalizedQuery) ||
        category.description.toLowerCase().includes(normalizedQuery),
    );
}

function HelpAccordionItem({
  article,
  isOpen,
  onToggle,
  onKeyNavigate,
}: {
  article: HelpCenterArticle;
  isOpen: boolean;
  onToggle: () => void;
  onKeyNavigate: (direction: "next" | "prev") => void;
}) {
  const panelId = useId();
  const buttonId = `help-trigger-${article.id}`;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      onKeyNavigate("next");
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      onKeyNavigate("prev");
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border transition-[border-color,box-shadow,transform,background-color,backdrop-filter] duration-[350ms] ease-out",
        isOpen
          ? "-translate-y-0.5 border-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] bg-[linear-gradient(165deg,color-mix(in_srgb,var(--color-primary-soft)_16%,white)_0%,color-mix(in_srgb,var(--color-primary-light)_72%,transparent)_42%,color-mix(in_srgb,var(--color-surface)_78%,transparent)_100%)] shadow-[0_16px_40px_color-mix(in_srgb,var(--color-primary)_14%,transparent),0_6px_18px_rgba(26,43,60,0.06),inset_0_1px_0_color-mix(in_srgb,var(--color-surface)_70%,transparent)] backdrop-blur-[18px] backdrop-saturate-150 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_color-mix(in_srgb,var(--color-primary)_16%,transparent),0_8px_20px_rgba(26,43,60,0.07),inset_0_1px_0_color-mix(in_srgb,var(--color-surface)_75%,transparent)]"
          : "border-border-subtle bg-surface shadow-[0_4px_16px_rgba(26,43,60,0.04)] hover:-translate-y-px hover:border-primary/20 hover:shadow-[0_10px_28px_rgba(26,43,60,0.07)]",
      )}
    >
      <h3 className="m-0">
        <button
          id={buttonId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          onKeyDown={handleKeyDown}
          className="flex w-full items-start justify-between gap-4 rounded-2xl px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:px-6 sm:py-5"
        >
          <span
            className={cn(
              "text-[15px] leading-snug sm:text-base",
              isOpen
                ? "font-bold text-primary"
                : "font-semibold text-foreground",
            )}
          >
            {article.question}
          </span>
          <span
            className={cn(
              "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-hero-bg/70 text-primary transition-transform duration-[350ms] ease-out",
              isOpen && "rotate-180 bg-primary-light",
            )}
            aria-hidden="true"
          >
            <ChevronDown className="size-4" strokeWidth={2.25} />
          </span>
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-[350ms] ease-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <p className="px-5 pt-1 pb-5 text-sm leading-[1.7] text-muted sm:px-6 sm:pt-1.5 sm:pb-6 sm:text-[15px]">
            {article.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function HelpCenterPageContent() {
  const [query, setQuery] = useState("");
  const [openArticleId, setOpenArticleId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);

  const filteredCategories = useMemo(
    () => filterHelpCategories(HELP_CENTER_CATEGORIES, query),
    [query],
  );

  const sectionIds = useMemo(
    () => filteredCategories.map((category) => category.id),
    [filteredCategories],
  );

  const flatVisibleArticles = useMemo(
    () => filteredCategories.flatMap((category) => category.articles),
    [filteredCategories],
  );

  const { activeId, activateSection } = useActiveLegalSection({
    sectionIds,
    offsetPx: 140,
  });

  useEffect(() => {
    if (
      openArticleId &&
      !flatVisibleArticles.some((article) => article.id === openArticleId)
    ) {
      setOpenArticleId(null);
    }
  }, [flatVisibleArticles, openArticleId]);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) {
      return;
    }

    const exists = HELP_CENTER_CATEGORIES.some(
      (category) => category.id === hash,
    );
    if (!exists) {
      return;
    }

    window.setTimeout(() => {
      activateSection(hash);

      const target = document.getElementById(hash);
      if (!target) {
        return;
      }

      const isCompactViewport = window.matchMedia(
        "(max-width: 1023px)",
      ).matches;
      const offsetPx = isCompactViewport ? 148 : 120;
      const top = Math.max(
        0,
        target.getBoundingClientRect().top + window.scrollY - offsetPx,
      );
      window.scrollTo({ top, behavior: "smooth" });
    }, 0);
  }, [activateSection]);

  const handleToggle = (articleId: string) => {
    setOpenArticleId((current) => (current === articleId ? null : articleId));
  };

  const handleKeyNavigate = (
    articleId: string,
    direction: "next" | "prev",
  ) => {
    const index = flatVisibleArticles.findIndex(
      (article) => article.id === articleId,
    );
    if (index < 0) {
      return;
    }

    const nextIndex =
      direction === "next"
        ? Math.min(index + 1, flatVisibleArticles.length - 1)
        : Math.max(index - 1, 0);
    const nextArticle = flatVisibleArticles[nextIndex];
    if (!nextArticle) {
      return;
    }

    document.getElementById(`help-trigger-${nextArticle.id}`)?.focus();
  };

  const handleCategoryNavigate = (categoryId: string) => {
    const hadSearchQuery = Boolean(query.trim());
    if (hadSearchQuery) {
      setQuery("");
    }

    activateSection(categoryId);
    window.history.replaceState(null, "", `#${categoryId}`);

    const scrollToCategory = () => {
      const target = document.getElementById(categoryId);
      if (!target) {
        return;
      }

      const isCompactViewport = window.matchMedia(
        "(max-width: 1023px)",
      ).matches;
      // Account for site navbar + mobile category chips bar.
      const offsetPx = isCompactViewport ? 148 : 120;
      const top = Math.max(
        0,
        target.getBoundingClientRect().top + window.scrollY - offsetPx,
      );

      window.scrollTo({ top, behavior: "smooth" });
    };

    if (hadSearchQuery) {
      // Wait for all sections to remount after clearing search.
      window.setTimeout(scrollToCategory, 50);
      return;
    }

    scrollToCategory();
  };

  return (
    <main className="bg-hero-bg/40">
      <section className="border-b border-border-subtle bg-legal-hero-surface">
        <Container className="py-8 sm:py-10 lg:py-12">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link
                  href={ROUTES.HOME}
                  className="font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-border">
                &gt;
              </li>
              <li className="font-semibold text-foreground" aria-current="page">
                Help Center
              </li>
            </ol>
          </nav>

          <div className="mx-auto mt-8 max-w-3xl text-center sm:mt-10">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {HELP_CENTER_PAGE_TITLE}
            </h1>

            <label className="relative mt-8 block text-left">
              <span className="sr-only">{HELP_CENTER_SEARCH_PLACEHOLDER}</span>
              <Search
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={HELP_CENTER_SEARCH_PLACEHOLDER}
                className="h-12 w-full rounded-2xl border border-border bg-surface pr-4 pl-12 text-sm text-foreground shadow-[0_8px_24px_rgba(26,43,60,0.05)] outline-none transition-[border-color,box-shadow] placeholder:text-muted/80 hover:border-primary/25 focus:border-primary-soft focus:ring-2 focus:ring-primary-soft/20 sm:h-14 sm:text-[15px]"
              />
            </label>
          </div>
        </Container>
      </section>

      <div className="sticky top-[4.5rem] z-30 border-b border-border-subtle bg-surface/90 backdrop-blur-md lg:hidden">
        <Container className="py-3">
          <div
            ref={chipsRef}
            className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Help categories"
          >
            {HELP_CENTER_CATEGORIES.map((category) => {
              const isActive = activeId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleCategoryNavigate(category.id)}
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    isActive
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-foreground hover:border-primary/30",
                  )}
                >
                  {category.cardTitle}
                </button>
              );
            })}
          </div>
        </Container>
      </div>

      <section className="py-10 sm:py-12 lg:py-14">
        <Container>
          {filteredCategories.length === 0 ? (
            <div className="rounded-2xl border border-border-subtle bg-surface px-6 py-14 text-center shadow-[0_8px_24px_rgba(26,43,60,0.04)]">
              <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-hero-bg text-muted">
                <SearchX
                  className="size-7"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </span>
              <h2 className="mt-5 text-xl font-bold text-foreground">
                {HELP_CENTER_EMPTY_TITLE}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                {HELP_CENTER_EMPTY_DESCRIPTION}
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  searchInputRef.current?.focus();
                }}
                className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-border bg-surface px-5 text-sm font-bold text-foreground transition-colors hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[16.5rem_minmax(0,1fr)] xl:gap-12">
              <aside className="hidden lg:block">
                <nav
                  aria-label="Help categories"
                  className="sticky top-28 rounded-2xl border border-border-subtle bg-surface p-3 shadow-[0_8px_24px_rgba(26,43,60,0.04)]"
                >
                  <p className="px-3 pt-2 pb-3 text-xs font-bold tracking-wide text-muted uppercase">
                    Categories
                  </p>
                  <ul className="space-y-1">
                    {HELP_CENTER_CATEGORIES.map((category) => {
                      const isActive = activeId === category.id;
                      return (
                        <li key={category.id}>
                          <button
                            type="button"
                            onClick={() => handleCategoryNavigate(category.id)}
                            className={cn(
                              "flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                              isActive
                                ? "bg-primary-light text-primary"
                                : "text-foreground hover:bg-hero-bg",
                            )}
                          >
                            {category.title}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </aside>

              <div className="min-w-0 space-y-12 sm:space-y-14">
                {filteredCategories.map((category) => (
                  <section
                    key={category.id}
                    id={category.id}
                    aria-labelledby={`help-heading-${category.id}`}
                    className="scroll-mt-36 lg:scroll-mt-28"
                  >
                    <div className="mb-5">
                      <h2
                        id={`help-heading-${category.id}`}
                        className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]"
                      >
                        {category.title}
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-muted sm:text-[15px]">
                        {category.description}
                      </p>
                      <div
                        className="mt-4 h-px w-full bg-border-subtle"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="space-y-3">
                      {category.articles.map((article) => (
                        <HelpAccordionItem
                          key={article.id}
                          article={article}
                          isOpen={openArticleId === article.id}
                          onToggle={() => handleToggle(article.id)}
                          onKeyNavigate={(direction) =>
                            handleKeyNavigate(article.id, direction)
                          }
                        />
                      ))}
                    </div>
                  </section>
                ))}

                <aside className="overflow-hidden rounded-[1.5rem] border border-primary/15 bg-surface shadow-[0_16px_40px_rgba(26,43,60,0.07)]">
                  <div className="bg-legal-hero-surface px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      {HELP_CENTER_SUPPORT_TITLE}
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                      {HELP_CENTER_SUPPORT_DESCRIPTION}
                    </p>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <a
                        href={WHATSAPP_JOIN_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        {HELP_CENTER_WHATSAPP_LABEL}
                      </a>
                      <Link
                        href={ROUTES.CONTACT}
                        className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-surface px-6 text-sm font-bold text-foreground transition-colors hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      >
                        {HELP_CENTER_CALL_LABEL}
                      </Link>
                      <Link
                        href={ROUTES.CONTACT}
                        className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-surface px-6 text-sm font-bold text-foreground transition-colors hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      >
                        {HELP_CENTER_EMAIL_LABEL}
                      </Link>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
