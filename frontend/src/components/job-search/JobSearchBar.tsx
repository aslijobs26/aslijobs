"use client";

import { PlaceAutocomplete } from "@/components/place-autocomplete/PlaceAutocomplete";
import type { JobSearchUrlState } from "@/types/job-search";
import {
  resolveIndiaStateLabel,
} from "@/services/nominatim-location.service";
import { toJobSearchLocationSlug } from "@/utils/job-search-url";
import { RotateCcw, Search } from "lucide-react";
import { useState, type FormEvent } from "react";

type JobSearchBarProps = {
  state: JobSearchUrlState;
  locationLabel: string;
  onSearch: (next: {
    q: string;
    state: string;
    cities: string[];
    locationLabel: string;
  }) => void;
  onClearAll: () => void;
};

const controlClassName =
  "relative flex h-12 w-full items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20";

const inputClassName =
  "min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted";

function buildLocationLabel(cityInput: string, stateInput: string): string {
  if (cityInput && stateInput) {
    return `${cityInput}, ${stateInput}`;
  }
  return cityInput || stateInput || "";
}

function resolveDisplayState(stateSlug: string): string {
  if (!stateSlug) {
    return "";
  }
  return resolveIndiaStateLabel(stateSlug);
}

export function JobSearchBar({
  state,
  locationLabel,
  onSearch,
  onClearAll,
}: JobSearchBarProps) {
  const initialStateLabel = resolveDisplayState(state.state);
  const initialCityLabel =
    state.cities.length === 1 ? state.cities[0] ?? "" : "";

  const [keyword, setKeyword] = useState(state.q);
  const [stateInput, setStateInput] = useState(initialStateLabel);
  const [cityInput, setCityInput] = useState(initialCityLabel);
  const [selectedState, setSelectedState] = useState(state.state);
  const [selectedCity, setSelectedCity] = useState(
    state.cities.length === 1 ? state.cities[0] ?? "" : "",
  );
  const citiesKey = state.cities.join(",");
  const [syncedKey, setSyncedKey] = useState(
    () => `${state.q}|${state.state}|${citiesKey}|${locationLabel}`,
  );

  const nextKey = `${state.q}|${state.state}|${citiesKey}|${locationLabel}`;
  if (nextKey !== syncedKey) {
    setSyncedKey(nextKey);
    setKeyword(state.q);
    setSelectedState(state.state);
    setSelectedCity(state.cities.length === 1 ? state.cities[0] ?? "" : "");
    setStateInput(resolveDisplayState(state.state));
    setCityInput(state.cities.length === 1 ? state.cities[0] ?? "" : "");
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextState = selectedState
      ? toJobSearchLocationSlug(selectedState) || selectedState
      : "";
    const nextCity = selectedCity
      ? toJobSearchLocationSlug(selectedCity) || selectedCity
      : "";

    onSearch({
      q: keyword.trim(),
      state: nextState,
      cities: nextCity ? [nextCity] : [],
      locationLabel: buildLocationLabel(cityInput, stateInput),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5"
      aria-label="Refine job search"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-start lg:gap-3">
        <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
          <label
            htmlFor="job-search-keyword"
            className="text-sm font-semibold text-foreground"
          >
            What job are you looking for?
          </label>
          <div className={controlClassName}>
            <Search
              className="size-[18px] shrink-0 text-muted"
              strokeWidth={2}
              aria-hidden="true"
            />
            <input
              id="job-search-keyword"
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="e.g. Driver, Delivery Boy, Sales Executive"
              className={inputClassName}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <label
            htmlFor="job-search-state"
            className="text-sm font-semibold text-foreground"
          >
            Select State
          </label>
          <PlaceAutocomplete
            id="job-search-state"
            mode="state"
            value={stateInput}
            placeholder="e.g. Telangana"
            iconClassName="text-pin-state"
            onChange={(value) => {
              setStateInput(value);
              setSelectedState("");
              setSelectedCity("");
              setCityInput("");
            }}
            onSelect={(suggestion) => {
              setStateInput(suggestion.label);
              setSelectedState(
                toJobSearchLocationSlug(suggestion.state) || suggestion.state,
              );
              setSelectedCity("");
              setCityInput("");
            }}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <label
            htmlFor="job-search-city"
            className="text-sm font-semibold text-foreground"
          >
            Select City
          </label>
          <PlaceAutocomplete
            id="job-search-city"
            mode="city"
            value={cityInput}
            selectedState={
              selectedState ? resolveDisplayState(selectedState) : stateInput
            }
            disabled={!selectedState && !stateInput.trim()}
            placeholder={
              selectedState || stateInput.trim()
                ? "e.g. Hyderabad"
                : "Select a state first"
            }
            onChange={(value) => {
              setCityInput(value);
              setSelectedCity("");
            }}
            onSelect={(suggestion) => {
              setCityInput(suggestion.label);
              setSelectedCity(
                toJobSearchLocationSlug(suggestion.city) || suggestion.city,
              );
              if (suggestion.state) {
                setSelectedState(
                  toJobSearchLocationSlug(suggestion.state) || suggestion.state,
                );
                setStateInput(suggestion.state);
              }
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
          <span
            className="hidden text-sm font-semibold lg:inline"
            aria-hidden="true"
          >
            &nbsp;
          </span>
          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:min-w-[148px]"
          >
            <Search className="size-[18px]" strokeWidth={2.5} aria-hidden="true" />
            Search Jobs
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <RotateCcw className="size-3.5" strokeWidth={2} aria-hidden="true" />
            Clear all
          </button>
        </div>
      </div>
    </form>
  );
}
