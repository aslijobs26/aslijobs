"use client";

import {
  PlaceAutocomplete,
  type PlaceAutocompleteProps,
} from "@/components/place-autocomplete/PlaceAutocomplete";

const FORM_CONTROL_CLASS_NAME = "employer-register-place-autocomplete-control";

const FORM_INPUT_CLASS_NAME =
  "min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-60";

type EmployerRegisterPlaceAutocompleteProps = Omit<
  PlaceAutocompleteProps,
  "showIcon" | "controlClassName" | "inputClassName" | "iconClassName"
>;

/**
 * Company Profile State/City autocomplete — same Photon behaviour as Landing Page,
 * styled to match employer-register form inputs.
 */
export function EmployerRegisterPlaceAutocomplete(
  props: EmployerRegisterPlaceAutocompleteProps,
) {
  return (
    <PlaceAutocomplete
      {...props}
      showIcon={false}
      controlClassName={FORM_CONTROL_CLASS_NAME}
      inputClassName={FORM_INPUT_CLASS_NAME}
    />
  );
}
