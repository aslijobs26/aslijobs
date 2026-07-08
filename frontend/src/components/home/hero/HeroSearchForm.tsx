"use client";

import {
  HERO_CATEGORY_OPTIONS,
  HERO_CITY_OPTIONS,
  HERO_SEARCH_DEFAULTS,
  HERO_STATE_OPTIONS,
} from "@/constants/hero";
import { ROUTES } from "@/constants/routes";
import type { HeroSearchFormValues } from "@/types/hero";
import { cn } from "@/utils/cn";
import { Briefcase, ChevronDown, MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

type SearchFieldProps = {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
};

function SearchField({ id, label, children, className }: SearchFieldProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm font-bold text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

const controlClassName =
  "relative flex h-12 w-full items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20";

const inputClassName =
  "min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted";

const selectClassName =
  "min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-7 text-sm text-foreground outline-none";

type SelectControlProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  options: readonly { value: string; label: string }[];
};

function SelectControl({
  id,
  value,
  onChange,
  icon,
  options,
}: SelectControlProps) {
  return (
    <div className={controlClassName}>
      {icon}
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={selectClassName}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3.5 size-4 shrink-0 text-foreground/70"
        strokeWidth={2}
        aria-hidden="true"
      />
    </div>
  );
}

export function HeroSearchForm() {
  const router = useRouter();
  const [values, setValues] = useState<HeroSearchFormValues>({
    ...HERO_SEARCH_DEFAULTS,
  });

  const handleChange = (field: keyof HeroSearchFormValues, value: string) => {
    setValues((current) => {
      const next = { ...current, [field]: value };
      if (field === "state") {
        next.city = "";
      }
      return next;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (values.query.trim()) params.set("q", values.query.trim());
    if (values.state) params.set("state", values.state);
    if (values.city) params.set("city", values.city);
    if (values.category) params.set("category", values.category);

    const queryString = params.toString();
    router.push(
      queryString ? `${ROUTES.FIND_JOBS}?${queryString}` : ROUTES.FIND_JOBS,
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-lg sm:p-6 lg:rounded-3xl lg:p-8"
      aria-label="Job search"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end lg:gap-4 xl:gap-5">
        <SearchField
          id="hero-search-query"
          label="Search Job, Role or Keyword"
          className="sm:col-span-2 lg:col-span-1"
        >
          <div className={controlClassName}>
            <Search
              className="size-[18px] shrink-0 text-muted"
              strokeWidth={2}
              aria-hidden="true"
            />
            <input
              id="hero-search-query"
              type="search"
              value={values.query}
              onChange={(event) => handleChange("query", event.target.value)}
              placeholder="e.g. Driver, Delivery Boy, Electrician"
              className={inputClassName}
              autoComplete="off"
            />
          </div>
        </SearchField>

        <SearchField id="hero-search-state" label="Select State">
          <SelectControl
            id="hero-search-state"
            value={values.state}
            onChange={(value) => handleChange("state", value)}
            icon={
              <MapPin
                className="size-[18px] shrink-0 text-pin-state"
                strokeWidth={2}
                aria-hidden="true"
              />
            }
            options={HERO_STATE_OPTIONS}
          />
        </SearchField>

        <SearchField id="hero-search-city" label="Select City">
          <SelectControl
            id="hero-search-city"
            value={values.city}
            onChange={(value) => handleChange("city", value)}
            icon={
              <MapPin
                className="size-[18px] shrink-0 text-foreground"
                strokeWidth={2}
                aria-hidden="true"
              />
            }
            options={HERO_CITY_OPTIONS}
          />
        </SearchField>

        <SearchField id="hero-search-category" label="Job Category">
          <SelectControl
            id="hero-search-category"
            value={values.category}
            onChange={(value) => handleChange("category", value)}
            icon={
              <Briefcase
                className="size-[18px] shrink-0 text-foreground"
                strokeWidth={2}
                aria-hidden="true"
              />
            }
            options={HERO_CATEGORY_OPTIONS}
          />
        </SearchField>

        <div className="sm:col-span-2 lg:col-span-1 lg:flex lg:justify-end">
          <button
            type="submit"
            className="inline-flex h-12 w-full min-w-[148px] items-center justify-center gap-2.5 rounded-xl bg-primary px-8 text-sm font-bold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:bg-primary-hover lg:w-auto"
          >
            <Search className="size-[18px]" strokeWidth={2.5} aria-hidden="true" />
            Search Jobs
          </button>
        </div>
      </div>
    </form>
  );
}
