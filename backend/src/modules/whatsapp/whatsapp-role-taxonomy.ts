/**
 * Equivalent groups may map to the one live title that exists.
 * Ambiguous groups map only when a single catalog title is present;
 * two or more matches stay unresolved so the bot can ask.
 */
export type RoleTaxonomyGroup = {
  id: string;
  mode: "equivalent" | "ambiguous";
  forms: string[];
  titles: string[];
};

export const ROLE_TAXONOMY: RoleTaxonomyGroup[] = [
  {
    id: "cnc",
    mode: "equivalent",
    forms: ["cnc operator", "cnc oprator", "cnc operater", "cnc machine operator"],
    titles: ["CNC Machine Operator", "CNC Operator"],
  },
  {
    id: "delivery",
    mode: "equivalent",
    forms: ["delivery boy", "delivery agent", "delivery executive", "delivery boye"],
    titles: ["Delivery Executive", "Delivery Boy"],
  },
  {
    id: "security",
    mode: "equivalent",
    forms: ["security guard", "security officer", "security gaurd"],
    titles: ["Security Officer", "Security Guard"],
  },
  {
    id: "electrician",
    mode: "equivalent",
    forms: ["electrician", "electrical technician", "electrian", "electrcian"],
    titles: ["Electrical Technician", "Electrician"],
  },
  {
    id: "housekeeping",
    mode: "equivalent",
    forms: ["housekeeping", "house keeping", "housekeeping staff"],
    titles: ["Housekeeping Staff", "Housekeeping"],
  },
  {
    id: "helper",
    mode: "ambiguous",
    forms: ["helper", "general helper", "office helper"],
    titles: ["General Helper", "Helper", "Office Helper"],
  },
  {
    id: "sales-informal",
    mode: "equivalent",
    forms: ["sales boy", "sales girl", "salesgirl", "salesman"],
    titles: ["Sales Executive", "Sales Boy"],
  },
  {
    id: "driver",
    mode: "ambiguous",
    forms: ["driver", "drivers", "commercial driver"],
    titles: ["Commercial Driver", "Car Driver", "Driver"],
  },
  {
    id: "computer-operator",
    mode: "ambiguous",
    forms: ["computer operator", "data entry operator"],
    titles: ["Data Entry Operator", "Computer Operator"],
  },
];

export function taxonomyGroupFor(phrase: string): RoleTaxonomyGroup | undefined {
  const folded = phrase.toLowerCase();
  let best: RoleTaxonomyGroup | undefined;
  let bestLen = 0;
  for (const group of ROLE_TAXONOMY) {
    for (const form of group.forms) {
      if (form.length > bestLen && folded.includes(form)) {
        best = group;
        bestLen = form.length;
      }
    }
  }
  return best;
}
