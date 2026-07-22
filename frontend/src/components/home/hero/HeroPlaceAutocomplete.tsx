"use client";

import {
  PlaceAutocomplete,
  type PlaceAutocompleteProps,
} from "@/components/place-autocomplete/PlaceAutocomplete";

export type { PlaceSuggestion } from "@/types/nominatim-location";

type HeroPlaceAutocompleteProps = Omit<
  PlaceAutocompleteProps,
  "showIcon" | "controlClassName" | "inputClassName"
> & {
  iconClassName?: string;
};

/** Landing-page styled wrapper around the shared Photon place autocomplete. */
export function HeroPlaceAutocomplete(props: HeroPlaceAutocompleteProps) {
  return <PlaceAutocomplete {...props} showIcon />;
}
