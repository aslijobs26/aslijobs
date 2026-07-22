const ABSOLUTE_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const RELATIVE_DIVISIONS: ReadonlyArray<{
  amount: number;
  unit: Intl.RelativeTimeFormatUnit;
}> = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

/** Official / commonly used Indian state & UT short codes. */
const INDIAN_STATE_ABBREVIATIONS: Readonly<Record<string, string>> = {
  "andaman and nicobar islands": "AN",
  "andhra pradesh": "AP",
  "arunachal pradesh": "AR",
  assam: "AS",
  bihar: "BR",
  chandigarh: "CH",
  chhattisgarh: "CG",
  "dadra and nagar haveli and daman and diu": "DH",
  "dadra and nagar haveli": "DN",
  "daman and diu": "DD",
  delhi: "DL",
  "nct of delhi": "DL",
  goa: "GA",
  gujarat: "GJ",
  haryana: "HR",
  "himachal pradesh": "HP",
  "jammu and kashmir": "JK",
  jharkhand: "JH",
  karnataka: "KA",
  kerala: "KL",
  ladakh: "LA",
  lakshadweep: "LD",
  "madhya pradesh": "MP",
  maharashtra: "MH",
  manipur: "MN",
  meghalaya: "ML",
  mizoram: "MZ",
  nagaland: "NL",
  odisha: "OD",
  orissa: "OD",
  puducherry: "PY",
  pondicherry: "PY",
  punjab: "PB",
  rajasthan: "RJ",
  sikkim: "SK",
  "tamil nadu": "TN",
  telangana: "TS",
  tripura: "TR",
  "uttar pradesh": "UP",
  uttarakhand: "UK",
  uttaranchal: "UK",
  "west bengal": "WB",
};

function normalizeStateKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

export function getIndianStateAbbreviation(state: string): string {
  const trimmed = state.trim();
  if (!trimmed) {
    return "";
  }

  const abbreviation = INDIAN_STATE_ABBREVIATIONS[normalizeStateKey(trimmed)];
  return abbreviation ?? trimmed;
}

export function formatEmployerJobCount(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function getEmployerJobPostedAt(job: {
  publishedAt?: string | null;
  createdAt: string;
}): string {
  return job.publishedAt ?? job.createdAt;
}

export function formatEmployerJobPostedAbsolute(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return ABSOLUTE_DATE_FORMATTER.format(date);
}

export function formatEmployerJobPostedRelative(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  let duration = (date.getTime() - Date.now()) / 1000;

  for (const division of RELATIVE_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return RELATIVE_FORMATTER.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return "";
}

function resolveEmployerJobLocationParts(
  cityName: string,
  stateName: string,
  city: string,
  state: string,
): { cityLabel: string; stateLabel: string } {
  return {
    cityLabel: cityName.trim() || city.trim(),
    stateLabel: stateName.trim() || state.trim(),
  };
}

export function formatEmployerJobLocationFull(
  cityName: string,
  stateName: string,
  city: string,
  state: string,
): string {
  const { cityLabel, stateLabel } = resolveEmployerJobLocationParts(
    cityName,
    stateName,
    city,
    state,
  );

  if (cityLabel && stateLabel) {
    return `${cityLabel}, ${stateLabel}`;
  }

  return cityLabel || stateLabel || "—";
}

export function formatEmployerJobLocation(
  cityName: string,
  stateName: string,
  city: string,
  state: string,
): string {
  const { cityLabel, stateLabel } = resolveEmployerJobLocationParts(
    cityName,
    stateName,
    city,
    state,
  );
  const stateShort = stateLabel
    ? getIndianStateAbbreviation(stateLabel)
    : getIndianStateAbbreviation(state);

  if (cityLabel && stateShort) {
    return `${cityLabel}, ${stateShort}`;
  }

  return cityLabel || stateShort || "—";
}
