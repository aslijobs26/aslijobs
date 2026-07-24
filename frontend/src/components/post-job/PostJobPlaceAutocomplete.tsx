"use client";

import {
  PlaceAutocomplete,
  type PlaceAutocompleteProps,
} from "@/components/place-autocomplete/PlaceAutocomplete";
import { cn } from "@/utils/cn";

type PostJobPlaceAutocompleteProps = Omit<
  PlaceAutocompleteProps,
  "showIcon" | "controlClassName" | "inputClassName" | "iconClassName"
> & {
  hasError?: boolean;
};

/**
 * Post-job State/City autocomplete — same Photon behaviour as Landing Page,
 * styled to match post-job form inputs.
 */
export function PostJobPlaceAutocomplete({
  hasError = false,
  ...props
}: PostJobPlaceAutocompleteProps) {
  return (
    <PlaceAutocomplete
      {...props}
      showIcon={false}
      controlClassName={cn(
        "relative flex h-12 w-full items-center rounded-md border border-border bg-surface px-3.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
        hasError &&
          "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20",
      )}
      inputClassName="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}
