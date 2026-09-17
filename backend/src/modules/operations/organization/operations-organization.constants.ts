import type { OperationsOrgUnitType } from "./operations-org-unit.model.js";

/** Valid child types for each org unit type. */
export const ORG_UNIT_CHILD_TYPES: Record<
  OperationsOrgUnitType,
  OperationsOrgUnitType[]
> = {
  global: ["country"],
  country: ["region", "state", "city", "office"],
  region: ["state", "city", "office"],
  state: ["city", "office"],
  city: ["office"],
  office: [],
};

/** India region seed used only to structure the hierarchy (not fake metrics). */
export const INDIA_REGION_SEED: Array<{
  name: string;
  slug: string;
  states: string[];
}> = [
  {
    name: "South India",
    slug: "south-india",
    states: [
      "Andhra Pradesh",
      "Karnataka",
      "Kerala",
      "Puducherry",
      "Tamil Nadu",
      "Telangana",
      "Andaman and Nicobar Islands",
      "Lakshadweep",
    ],
  },
  {
    name: "West India",
    slug: "west-india",
    states: [
      "Goa",
      "Gujarat",
      "Maharashtra",
      "Dadra and Nagar Haveli and Daman and Diu",
    ],
  },
  {
    name: "North India",
    slug: "north-india",
    states: [
      "Chandigarh",
      "Delhi",
      "Haryana",
      "Himachal Pradesh",
      "Jammu and Kashmir",
      "Ladakh",
      "Punjab",
      "Rajasthan",
      "Uttar Pradesh",
      "Uttarakhand",
    ],
  },
  {
    name: "East India",
    slug: "east-india",
    states: [
      "Bihar",
      "Jharkhand",
      "Odisha",
      "West Bengal",
      "Sikkim",
    ],
  },
  {
    name: "Central India",
    slug: "central-india",
    states: ["Chhattisgarh", "Madhya Pradesh"],
  },
  {
    name: "Northeast India",
    slug: "northeast-india",
    states: [
      "Arunachal Pradesh",
      "Assam",
      "Manipur",
      "Meghalaya",
      "Mizoram",
      "Nagaland",
      "Tripura",
    ],
  },
];

export const ORG_ROOT_SLUG = "asli-global";
export const ORG_INDIA_SLUG = "india";
