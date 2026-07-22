export type PlaceSuggestionKind = "state" | "city";

export type PlaceSuggestion = {
  id: string;
  label: string;
  kind: PlaceSuggestionKind;
  state: string;
  city: string;
};

/** @deprecated Use PlaceSuggestion */
export type LocationSuggestion = PlaceSuggestion;
