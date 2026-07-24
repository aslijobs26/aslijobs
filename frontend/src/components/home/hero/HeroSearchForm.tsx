"use client";

import { HeroPlaceAutocomplete } from "@/components/home/hero/HeroPlaceAutocomplete";
import { HERO_SEARCH_DEFAULTS } from "@/constants/hero";
import { ROUTES } from "@/constants/routes";
import type { HeroSearchFormValues } from "@/types/hero";
import { cn } from "@/utils/cn";
import { Search } from "lucide-react";
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

export function HeroSearchForm() {
  const router = useRouter();
  const [values, setValues] = useState<HeroSearchFormValues>({
    ...HERO_SEARCH_DEFAULTS,
  });
  const [stateInput, setStateInput] = useState("");
  const [cityInput, setCityInput] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (values.query.trim()) params.set("q", values.query.trim());
    if (values.state) params.set("state", values.state);
    if (values.city) params.set("city", values.city);

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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end lg:gap-4 xl:gap-5">
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
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  query: event.target.value,
                }))
              }
              placeholder="e.g. Driver, Delivery Boy, Electrician"
              className={inputClassName}
              autoComplete="off"
            />
          </div>
        </SearchField>

        <SearchField id="hero-search-state" label="Select State">
          <HeroPlaceAutocomplete
            id="hero-search-state"
            mode="state"
            value={stateInput}
            placeholder="e.g. Telangana"
            iconClassName="text-pin-state"
            onChange={(value) => {
              setStateInput(value);
              setValues((current) => ({
                ...current,
                state: "",
                city: "",
              }));
              setCityInput("");
            }}
            onSelect={(suggestion) => {
              setStateInput(suggestion.label);
              setCityInput("");
              setValues((current) => ({
                ...current,
                state: suggestion.state,
                city: "",
              }));
            }}
          />
        </SearchField>

        <SearchField id="hero-search-city" label="Select City">
          <HeroPlaceAutocomplete
            id="hero-search-city"
            mode="city"
            value={cityInput}
            selectedState={values.state}
            disabled={!values.state}
            placeholder={
              values.state ? "e.g. Hyderabad" : "Select a state first"
            }
            onChange={(value) => {
              setCityInput(value);
              setValues((current) => ({
                ...current,
                city: "",
              }));
            }}
            onSelect={(suggestion) => {
              setCityInput(suggestion.label);
              setValues((current) => ({
                ...current,
                city: suggestion.city,
                state: suggestion.state || current.state,
              }));
            }}
          />
        </SearchField>

        <div className="sm:col-span-2 lg:col-span-1 lg:flex lg:justify-end">
          <button
            type="submit"
            className="inline-flex h-12 w-full min-w-[148px] items-center justify-center gap-2.5 rounded-xl bg-primary-soft px-8 text-sm font-bold text-white transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:bg-primary-soft-hover lg:w-auto"
          >
            <Search className="size-[18px]" strokeWidth={2.5} aria-hidden="true" />
            Search Jobs
          </button>
        </div>
      </div>
    </form>
  );
}
