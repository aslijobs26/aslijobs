import type { OperationsPostJobOption } from "./operations-post-job";

export type OperationsPostJobSelectOption = OperationsPostJobOption;
type EmployerRegisterSelectOption = OperationsPostJobSelectOption;
type EmployerRegisterCompanyStrengthOption = EmployerRegisterSelectOption & {
  minimumEmployees: number;
  maximumEmployees: number;
};

export const EMPLOYER_REGISTER_COMPANY_STRENGTH_OPTIONS: readonly EmployerRegisterCompanyStrengthOption[] =
  [
    { value: "1-10", label: "1-10", minimumEmployees: 1, maximumEmployees: 10 },
    { value: "11-50", label: "11-50", minimumEmployees: 11, maximumEmployees: 50 },
    {
      value: "51-200",
      label: "51-200",
      minimumEmployees: 51,
      maximumEmployees: 200,
    },
    {
      value: "201-500",
      label: "201-500",
      minimumEmployees: 201,
      maximumEmployees: 500,
    },
    {
      value: "501-1000",
      label: "501-1000",
      minimumEmployees: 501,
      maximumEmployees: 1000,
    },
    {
      value: "1000+",
      label: "1000+",
      minimumEmployees: 1001,
      maximumEmployees: 100000,
    },
  ] as const;

export const EMPLOYER_REGISTER_INDUSTRY_OPTIONS: readonly EmployerRegisterSelectOption[] =
  [
    {
      value: "construction-infrastructure",
      label: "Construction & Infrastructure",
    },
    { value: "manufacturing-factory", label: "Manufacturing & Factory" },
    { value: "logistics-supply-chain", label: "Logistics & Supply Chain" },
    { value: "retail-stores", label: "Retail & Stores" },
    {
      value: "hospitality-food-service",
      label: "Hospitality & Food Service",
    },
    { value: "healthcare-support", label: "Healthcare Support" },
    { value: "facility-management", label: "Facility Management" },
    { value: "agriculture-allied", label: "Agriculture & Allied" },
    { value: "domestic-services", label: "Domestic Services" },
    { value: "beauty-wellness", label: "Beauty & Wellness" },
    { value: "automobile-services", label: "Automobile Services" },
    {
      value: "telecom-field-services",
      label: "Telecom & Field Services",
    },
    { value: "mining-energy", label: "Mining & Energy" },
    { value: "marine-ports", label: "Marine & Ports" },
    { value: "education-support", label: "Education Support" },
    {
      value: "events-entertainment",
      label: "Events & Entertainment",
    },
    {
      value: "government-contract-services",
      label: "Government Contract Services",
    },
    { value: "factory-manufacturing", label: "Factory & Manufacturing" },
    { value: "warehouse-logistics", label: "Warehouse & Logistics" },
    { value: "drivers", label: "Drivers" },
    { value: "hospitality", label: "Hospitality" },
    { value: "retail", label: "Retail" },
    { value: "security", label: "Security" },
    { value: "housekeeping-facility", label: "Housekeeping & Facility" },
    { value: "automobile", label: "Automobile" },
    { value: "telecom-field", label: "Telecom & Field" },
    { value: "agriculture", label: "Agriculture" },
    { value: "cleaning-sanitation", label: "Cleaning & Sanitation" },
    { value: "events", label: "Events" },
    {
      value: "miscellaneous-skilled-trades",
      label: "Miscellaneous Skilled Trades",
    },
  ] as const;

export const EMPLOYER_REGISTER_BUSINESS_CATEGORIES_BY_INDUSTRY: Readonly<
  Record<string, readonly EmployerRegisterSelectOption[]>
> = {
  "construction-infrastructure": [
    { value: "building-construction", label: "Building Construction" },
    { value: "roads-highways", label: "Roads & Highways" },
    { value: "interior-works", label: "Interior Works" },
    { value: "plumbing-sanitation", label: "Plumbing & Sanitation" },
    { value: "electrical-contracting", label: "Electrical Contracting" },
    { value: "hvac", label: "HVAC" },
    { value: "painting-waterproofing", label: "Painting & Waterproofing" },
    { value: "welding-fabrication", label: "Welding & Fabrication" },
    { value: "scaffolding", label: "Scaffolding" },
    { value: "civil-maintenance", label: "Civil Maintenance" },
  ],
  "manufacturing-factory": [
    {
      value: "automobile-manufacturing",
      label: "Automobile Manufacturing",
    },
    { value: "textile-garments", label: "Textile & Garments" },
    { value: "food-processing", label: "Food Processing" },
    { value: "plastic-products", label: "Plastic Products" },
    { value: "electronics-assembly", label: "Electronics Assembly" },
    { value: "steel-metal", label: "Steel & Metal" },
    { value: "furniture-manufacturing", label: "Furniture Manufacturing" },
    { value: "packaging", label: "Packaging" },
    { value: "chemical-plants", label: "Chemical Plants" },
    { value: "fmcg-manufacturing", label: "FMCG Manufacturing" },
  ],
  "logistics-supply-chain": [
    { value: "warehousing", label: "Warehousing" },
    { value: "courier-delivery", label: "Courier & Delivery" },
    { value: "transportation", label: "Transportation" },
    { value: "freight-cargo", label: "Freight & Cargo" },
    { value: "cold-storage", label: "Cold Storage" },
    { value: "inventory-operations", label: "Inventory Operations" },
    { value: "last-mile-delivery", label: "Last-mile Delivery" },
  ],
  "retail-stores": [
    { value: "supermarkets", label: "Supermarkets" },
    { value: "kirana-stores", label: "Kirana Stores" },
    { value: "fashion-retail", label: "Fashion Retail" },
    { value: "electronics-stores", label: "Electronics Stores" },
    { value: "hardware-stores", label: "Hardware Stores" },
    { value: "mobile-shops", label: "Mobile Shops" },
    { value: "wholesale-markets", label: "Wholesale Markets" },
  ],
  "hospitality-food-service": [
    { value: "hotels", label: "Hotels" },
    { value: "restaurants", label: "Restaurants" },
    { value: "cafes", label: "Cafés" },
    { value: "catering", label: "Catering" },
    { value: "cloud-kitchens", label: "Cloud Kitchens" },
    { value: "bakeries", label: "Bakeries" },
    { value: "fast-food-chains", label: "Fast Food Chains" },
  ],
  "healthcare-support": [
    { value: "hospitals", label: "Hospitals" },
    { value: "clinics", label: "Clinics" },
    { value: "diagnostic-centers", label: "Diagnostic Centers" },
    { value: "home-healthcare", label: "Home Healthcare" },
    { value: "ambulance-services", label: "Ambulance Services" },
    { value: "pharmacy-support", label: "Pharmacy Support" },
    { value: "nursing-assistant", label: "Nursing Assistant" },
    { value: "ward-boy", label: "Ward Boy" },
    { value: "ward-girl", label: "Ward Girl" },
    { value: "hospital-attendant", label: "Hospital Attendant" },
    { value: "patient-care-assistant", label: "Patient Care Assistant" },
    { value: "ambulance-helper", label: "Ambulance Helper" },
    { value: "lab-assistant", label: "Lab Assistant" },
    { value: "pharmacy-assistant", label: "Pharmacy Assistant" },
    { value: "housekeeping-staff", label: "Housekeeping Staff" },
  ],
  "facility-management": [
    { value: "housekeeping", label: "Housekeeping" },
    { value: "security-services", label: "Security Services" },
    { value: "pest-control", label: "Pest Control" },
    { value: "gardening", label: "Gardening" },
    { value: "building-maintenance", label: "Building Maintenance" },
    { value: "waste-management", label: "Waste Management" },
  ],
  "agriculture-allied": [
    { value: "farming", label: "Farming" },
    { value: "dairy", label: "Dairy" },
    { value: "poultry", label: "Poultry" },
    { value: "fisheries", label: "Fisheries" },
    { value: "horticulture", label: "Horticulture" },
    { value: "food-collection", label: "Food Collection" },
  ],
  "domestic-services": [
    { value: "housekeeping", label: "Housekeeping" },
    { value: "cooking", label: "Cooking" },
    { value: "babysitting", label: "Babysitting" },
    { value: "elder-care", label: "Elder Care" },
    { value: "driver-services", label: "Driver Services" },
    { value: "maid-services", label: "Maid Services" },
    { value: "maid", label: "Maid" },
    { value: "cook", label: "Cook" },
    { value: "babysitter", label: "Babysitter" },
    { value: "caregiver", label: "Caregiver" },
    { value: "elder-care-assistant", label: "Elder Care Assistant" },
    { value: "domestic-driver", label: "Domestic Driver" },
  ],
  "beauty-wellness": [
    { value: "salons", label: "Salons" },
    { value: "spa", label: "Spa" },
    { value: "barber-shops", label: "Barber Shops" },
    { value: "beauty-clinics", label: "Beauty Clinics" },
    { value: "wellness-centers", label: "Wellness Centers" },
    { value: "barber", label: "Barber" },
    { value: "hair-stylist", label: "Hair Stylist" },
    { value: "beautician", label: "Beautician" },
    { value: "makeup-artist", label: "Makeup Artist" },
    { value: "spa-therapist", label: "Spa Therapist" },
    { value: "nail-technician", label: "Nail Technician" },
    { value: "salon-assistant", label: "Salon Assistant" },
  ],
  "automobile-services": [
    { value: "workshops", label: "Workshops" },
    { value: "service-centers", label: "Service Centers" },
    { value: "tyre-shops", label: "Tyre Shops" },
    { value: "car-wash", label: "Car Wash" },
    { value: "fuel-stations", label: "Fuel Stations" },
  ],
  "telecom-field-services": [
    { value: "fiber-installation", label: "Fiber Installation" },
    {
      value: "mobile-tower-maintenance",
      label: "Mobile Tower Maintenance",
    },
    { value: "broadband-services", label: "Broadband Services" },
    {
      value: "field-technician-services",
      label: "Field Technician Services",
    },
  ],
  "mining-energy": [
    { value: "mining", label: "Mining" },
    { value: "oil-gas", label: "Oil & Gas" },
    { value: "solar-installation", label: "Solar Installation" },
    { value: "wind-energy", label: "Wind Energy" },
    { value: "power-distribution", label: "Power Distribution" },
  ],
  "marine-ports": [
    { value: "ports", label: "Ports" },
    { value: "shipyards", label: "Shipyards" },
    { value: "fishing-harbors", label: "Fishing Harbors" },
    { value: "cargo-handling", label: "Cargo Handling" },
  ],
  "education-support": [
    { value: "school-transport", label: "School Transport" },
    { value: "hostel-services", label: "Hostel Services" },
    { value: "campus-maintenance", label: "Campus Maintenance" },
    { value: "cafeteria", label: "Cafeteria" },
  ],
  "events-entertainment": [
    { value: "event-management", label: "Event Management" },
    { value: "stage-setup", label: "Stage Setup" },
    { value: "lighting", label: "Lighting" },
    { value: "sound", label: "Sound" },
    { value: "decoration", label: "Decoration" },
  ],
  "government-contract-services": [
    { value: "municipal-services", label: "Municipal Services" },
    { value: "public-utilities", label: "Public Utilities" },
    { value: "sanitation", label: "Sanitation" },
    {
      value: "infrastructure-maintenance",
      label: "Infrastructure Maintenance",
    },
  ],
  "factory-manufacturing": [
    { value: "factory-worker", label: "Factory Worker" },
    { value: "machine-operator", label: "Machine Operator" },
    { value: "cnc-operator", label: "CNC Operator" },
    { value: "assembly-operator", label: "Assembly Operator" },
    { value: "production-associate", label: "Production Associate" },
    { value: "packing-staff", label: "Packing Staff" },
    { value: "quality-inspector", label: "Quality Inspector" },
    { value: "loading-worker", label: "Loading Worker" },
    { value: "material-handler", label: "Material Handler" },
    { value: "foundry-worker", label: "Foundry Worker" },
    { value: "press-machine-operator", label: "Press Machine Operator" },
    { value: "lathe-operator", label: "Lathe Operator" },
    { value: "forklift-operator", label: "Forklift Operator" },
  ],
  "warehouse-logistics": [
    { value: "warehouse-associate", label: "Warehouse Associate" },
    { value: "picker", label: "Picker" },
    { value: "packer", label: "Packer" },
    { value: "loader", label: "Loader" },
    { value: "unloader", label: "Unloader" },
    { value: "inventory-assistant", label: "Inventory Assistant" },
    { value: "forklift-driver", label: "Forklift Driver" },
    { value: "delivery-associate", label: "Delivery Associate" },
    { value: "courier-executive", label: "Courier Executive" },
    { value: "van-helper", label: "Van Helper" },
    { value: "dispatch-executive", label: "Dispatch Executive" },
    { value: "cargo-handler", label: "Cargo Handler" },
  ],
  drivers: [
    { value: "car-driver", label: "Car Driver" },
    { value: "taxi-driver", label: "Taxi Driver" },
    { value: "auto-driver", label: "Auto Driver" },
    { value: "bus-driver", label: "Bus Driver" },
    { value: "truck-driver", label: "Truck Driver" },
    { value: "dumper-driver", label: "Dumper Driver" },
    { value: "tractor-driver", label: "Tractor Driver" },
    { value: "delivery-driver", label: "Delivery Driver" },
    { value: "ambulance-driver", label: "Ambulance Driver" },
    { value: "crane-operator", label: "Crane Operator" },
    { value: "jcb-operator", label: "JCB Operator" },
    { value: "excavator-operator", label: "Excavator Operator" },
  ],
  hospitality: [
    { value: "waiter", label: "Waiter" },
    { value: "steward", label: "Steward" },
    { value: "kitchen-helper", label: "Kitchen Helper" },
    { value: "cook", label: "Cook" },
    { value: "commis", label: "Commis" },
    { value: "chef-assistant", label: "Chef Assistant" },
    { value: "housekeeping-staff", label: "Housekeeping Staff" },
    { value: "dishwasher", label: "Dishwasher" },
    { value: "cleaner", label: "Cleaner" },
    { value: "bartender", label: "Bartender" },
    { value: "bakery-assistant", label: "Bakery Assistant" },
  ],
  retail: [
    { value: "sales-associate", label: "Sales Associate" },
    { value: "cashier", label: "Cashier" },
    { value: "store-helper", label: "Store Helper" },
    { value: "shelf-stacker", label: "Shelf Stacker" },
    { value: "store-keeper", label: "Store Keeper" },
    { value: "billing-executive", label: "Billing Executive" },
    { value: "merchandiser", label: "Merchandiser" },
    { value: "inventory-staff", label: "Inventory Staff" },
  ],
  security: [
    { value: "security-guard", label: "Security Guard" },
    { value: "bouncer", label: "Bouncer" },
    { value: "cctv-operator", label: "CCTV Operator" },
    { value: "gate-security", label: "Gate Security" },
    { value: "fire-safety-assistant", label: "Fire Safety Assistant" },
  ],
  "housekeeping-facility": [
    { value: "housekeeper", label: "Housekeeper" },
    { value: "office-cleaner", label: "Office Cleaner" },
    { value: "janitor", label: "Janitor" },
    { value: "gardener", label: "Gardener" },
    {
      value: "pest-control-technician",
      label: "Pest Control Technician",
    },
    {
      value: "waste-collection-worker",
      label: "Waste Collection Worker",
    },
    { value: "maintenance-helper", label: "Maintenance Helper" },
  ],
  automobile: [
    { value: "mechanic", label: "Mechanic" },
    { value: "two-wheeler-mechanic", label: "Two-Wheeler Mechanic" },
    { value: "car-mechanic", label: "Car Mechanic" },
    { value: "diesel-mechanic", label: "Diesel Mechanic" },
    { value: "tyre-technician", label: "Tyre Technician" },
    { value: "service-advisor", label: "Service Advisor" },
    { value: "car-washer", label: "Car Washer" },
    { value: "denting-technician", label: "Denting Technician" },
    { value: "painting-technician", label: "Painting Technician" },
  ],
  "telecom-field": [
    { value: "field-technician", label: "Field Technician" },
    { value: "broadband-installer", label: "Broadband Installer" },
    { value: "fiber-technician", label: "Fiber Technician" },
    { value: "tower-technician", label: "Tower Technician" },
    { value: "cable-installer", label: "Cable Installer" },
    { value: "meter-reader", label: "Meter Reader" },
  ],
  agriculture: [
    { value: "farm-worker", label: "Farm Worker" },
    { value: "dairy-worker", label: "Dairy Worker" },
    { value: "poultry-worker", label: "Poultry Worker" },
    { value: "fisherman", label: "Fisherman" },
    { value: "tractor-operator", label: "Tractor Operator" },
    { value: "irrigation-worker", label: "Irrigation Worker" },
  ],
  "cleaning-sanitation": [
    { value: "garbage-collector", label: "Garbage Collector" },
    { value: "drainage-worker", label: "Drainage Worker" },
    { value: "sanitation-worker", label: "Sanitation Worker" },
    { value: "street-sweeper", label: "Street Sweeper" },
    { value: "toilet-cleaner", label: "Toilet Cleaner" },
  ],
  events: [
    { value: "stage-worker", label: "Stage Worker" },
    { value: "decoration-staff", label: "Decoration Staff" },
    { value: "lighting-technician", label: "Lighting Technician" },
    { value: "sound-technician", label: "Sound Technician" },
    { value: "event-helper", label: "Event Helper" },
  ],
  "miscellaneous-skilled-trades": [
    { value: "tailor", label: "Tailor" },
    { value: "embroidery-worker", label: "Embroidery Worker" },
    { value: "cobbler", label: "Cobbler" },
    { value: "goldsmith-assistant", label: "Goldsmith Assistant" },
    {
      value: "printing-machine-operator",
      label: "Printing Machine Operator",
    },
    { value: "laundry-worker", label: "Laundry Worker" },
    { value: "ironing-staff", label: "Ironing Staff" },
    {
      value: "photo-studio-assistant",
      label: "Photo Studio Assistant",
    },
  ],
};

export function getEmployerRegisterBusinessCategoryOptions(
  industry: string,
): readonly EmployerRegisterSelectOption[] {
  if (!industry) {
    return [];
  }

  return EMPLOYER_REGISTER_BUSINESS_CATEGORIES_BY_INDUSTRY[industry] ?? [];
}

const BUSINESS_CATEGORY_LABEL_BY_VALUE = new Map<string, string>(
  Object.values(EMPLOYER_REGISTER_BUSINESS_CATEGORIES_BY_INDUSTRY)
    .flat()
    .map((option) => [option.value, option.label] as const),
);

/** Maps registration/job category slugs to the labels shown in registration. */
export function formatBusinessCategoryLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return (
    BUSINESS_CATEGORY_LABEL_BY_VALUE.get(trimmed) ??
    trimmed
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}
