"use client";

import { Container } from "@/components/layout/Container";
import { WHATSAPP_JOIN_URL } from "@/constants/cta";
import {
  FAQ_CATEGORIES,
  FAQ_EMPTY_DESCRIPTION,
  FAQ_EMPTY_TITLE,
  FAQ_HELP_CONTACT_LABEL,
  FAQ_HELP_DESCRIPTION,
  FAQ_HELP_TITLE,
  FAQ_HELP_WHATSAPP_LABEL,
  FAQ_PAGE_SUBTITLE,
  FAQ_PAGE_TITLE,
  FAQ_SEARCH_PLACEHOLDER,
} from "@/constants/faqs";
import { ROUTES } from "@/constants/routes";
import type { FaqCategory, FaqItem } from "@/types/faqs";
import { cn } from "@/utils/cn";
import { ChevronDown, Search, SearchX } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function filterFaqCategories(
  categories: FaqCategory[],
  query: string,
): FaqCategory[] {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) {
    return categories;
  }

  return categories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => {
        const haystack = `${item.question} ${item.answer}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      }),
    }))
    .filter((category) => category.items.length > 0);
}

function FaqAccordionItem({
  item,
  isOpen,
  onToggle,
  onKeyNavigate,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
  onKeyNavigate: (direction: "next" | "prev") => void;
}) {
  const panelId = useId();
  const buttonId = `faq-trigger-${item.id}`;

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
            {item.question}
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
          <p className="px-5 pt-1 pb-5 text-sm leading-relaxed text-muted sm:px-6 sm:pt-1.5 sm:pb-6 sm:text-[15px]">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FaqsPageContent() {
  const [query, setQuery] = useState("");
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredCategories = useMemo(
    () => filterFaqCategories(FAQ_CATEGORIES, query),
    [query],
  );

  const flatVisibleItems = useMemo(
    () => filteredCategories.flatMap((category) => category.items),
    [filteredCategories],
  );

  useEffect(() => {
    if (
      openItemId &&
      !flatVisibleItems.some((item) => item.id === openItemId)
    ) {
      setOpenItemId(null);
    }
  }, [flatVisibleItems, openItemId]);

  const handleToggle = (itemId: string) => {
    setOpenItemId((current) => (current === itemId ? null : itemId));
  };

  const handleKeyNavigate = (itemId: string, direction: "next" | "prev") => {
    const index = flatVisibleItems.findIndex((item) => item.id === itemId);
    if (index < 0) {
      return;
    }

    const nextIndex =
      direction === "next"
        ? Math.min(index + 1, flatVisibleItems.length - 1)
        : Math.max(index - 1, 0);
    const nextItem = flatVisibleItems[nextIndex];
    if (!nextItem) {
      return;
    }

    document.getElementById(`faq-trigger-${nextItem.id}`)?.focus();
  };

  const helpDescriptionLines = FAQ_HELP_DESCRIPTION.split("\n");

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
                FAQs
              </li>
            </ol>
          </nav>

          <div className="mx-auto mt-8 max-w-3xl text-center sm:mt-10">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {FAQ_PAGE_TITLE}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base lg:text-lg">
              {FAQ_PAGE_SUBTITLE}
            </p>

            <label className="relative mt-8 block text-left">
              <span className="sr-only">{FAQ_SEARCH_PLACEHOLDER}</span>
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
                placeholder={FAQ_SEARCH_PLACEHOLDER}
                className="h-12 w-full rounded-2xl border border-border bg-surface pr-4 pl-12 text-sm text-foreground shadow-[0_8px_24px_rgba(26,43,60,0.05)] outline-none transition-[border-color,box-shadow] placeholder:text-muted/80 hover:border-primary/25 focus:border-primary-soft focus:ring-2 focus:ring-primary-soft/20 sm:h-14 sm:text-[15px]"
              />
            </label>
          </div>
        </Container>
      </section>

      <section className="py-10 sm:py-12 lg:py-16">
        <Container className="max-w-4xl">
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
                {FAQ_EMPTY_TITLE}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                {FAQ_EMPTY_DESCRIPTION}
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
            <div className="space-y-10 sm:space-y-12">
              {filteredCategories.map((category) => (
                <section
                  key={category.id}
                  aria-labelledby={`faq-${category.id}`}
                >
                  <div className="mb-4 flex items-center gap-3 sm:mb-5">
                    <h2
                      id={`faq-${category.id}`}
                      className="text-lg font-bold tracking-tight text-foreground sm:text-xl"
                    >
                      {category.title}
                    </h2>
                    <div
                      className="h-px flex-1 bg-border-subtle"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="space-y-3">
                    {category.items.map((item) => (
                      <FaqAccordionItem
                        key={item.id}
                        item={item}
                        isOpen={openItemId === item.id}
                        onToggle={() => handleToggle(item.id)}
                        onKeyNavigate={(direction) =>
                          handleKeyNavigate(item.id, direction)
                        }
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          <aside className="mt-12 overflow-hidden rounded-[1.5rem] border border-primary/15 bg-surface shadow-[0_16px_40px_rgba(26,43,60,0.07)] sm:mt-16">
            <div className="bg-legal-hero-surface px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {FAQ_HELP_TITLE}
              </h2>
              <div className="mt-3 space-y-1 text-sm leading-relaxed text-muted sm:text-base">
                {helpDescriptionLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={ROUTES.CONTACT}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {FAQ_HELP_CONTACT_LABEL}
                </Link>
                <a
                  href={WHATSAPP_JOIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-surface px-6 text-sm font-bold text-foreground transition-colors hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  {FAQ_HELP_WHATSAPP_LABEL}
                </a>
              </div>
            </div>
          </aside>
        </Container>
      </section>
    </main>
  );
}
