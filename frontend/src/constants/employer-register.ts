import avatar1 from "@/assets/employer-register/avatar-1.png";
import avatar2 from "@/assets/employer-register/avatar-2.png";
import avatar3 from "@/assets/employer-register/avatar-3.png";
import type {
  EmployerRegisterAccountType,
  EmployerRegisterBusinessDocumentType,
  EmployerRegisterCompanyProfileData,
  EmployerRegisterDocumentType,
  EmployerRegisterFormData,
  EmployerRegisterSelectOption,
  EmployerRegisterTestimonial,
} from "@/types/employer-register";

export const EMPLOYER_REGISTER_HEADING = "Create an Employer Account";

export const EMPLOYER_REGISTER_COMPANY_PROFILE_HEADING =
  "Complete Your Company Profile";

export const EMPLOYER_REGISTER_CONSULTANCY_PROFILE_HEADING =
  "Complete Your Consultancy Profile";

export const EMPLOYER_REGISTER_LOGIN_PROMPT = "Already have an account?";

export const EMPLOYER_REGISTER_SUBMIT_LABEL = "Create Account";

export const EMPLOYER_REGISTER_CONTINUE_LABEL = "Continue";

export const EMPLOYER_REGISTER_ACCOUNT_TYPE_LABEL = "Account Type";

export const EMPLOYER_REGISTER_SEND_OTP_LABEL = "Send OTP";

export const EMPLOYER_REGISTER_DOCUMENT_VERIFICATION_TITLE =
  "Document Verification";

export const EMPLOYER_REGISTER_DOCUMENT_VERIFICATION_SUBTITLE =
  "Upload one valid Government ID for identity verification.";

export const EMPLOYER_REGISTER_BUSINESS_VERIFICATION_TITLE =
  "Company/Business Verification*";

export type EmployerRegisterCompanyStrengthOption = EmployerRegisterSelectOption & {
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

export function getCompanyStrengthRange(value: string): {
  minimumEmployees: number;
  maximumEmployees: number;
} | null {
  const option = EMPLOYER_REGISTER_COMPANY_STRENGTH_OPTIONS.find(
    (item) => item.value === value,
  );

  if (!option) {
    return null;
  }

  return {
    minimumEmployees: option.minimumEmployees,
    maximumEmployees: option.maximumEmployees,
  };
}

export function getCompanyStrengthValueFromRange(
  minimumEmployees: number | null | undefined,
  maximumEmployees: number | null | undefined,
): string {
  if (
    typeof minimumEmployees !== "number" ||
    typeof maximumEmployees !== "number"
  ) {
    return "";
  }

  const exact = EMPLOYER_REGISTER_COMPANY_STRENGTH_OPTIONS.find(
    (item) =>
      item.minimumEmployees === minimumEmployees &&
      item.maximumEmployees === maximumEmployees,
  );

  return exact?.value ?? "";
}

export const EMPLOYER_REGISTER_DOCUMENT_UPLOAD_PRIMARY =
  "Upload Selected Document";

export const EMPLOYER_REGISTER_DOCUMENT_UPLOAD_HINT =
  "drag and drop your documents here, Max size 5 MB Formats: png, jpg, pdf";

export const EMPLOYER_REGISTER_DOCUMENT_HELPER_TEXT =
  "We use this document only for identity verification and it will remain secure.";

export const EMPLOYER_REGISTER_DOCUMENT_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const EMPLOYER_REGISTER_DOCUMENT_ACCEPT =
  ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";

export const EMPLOYER_REGISTER_IMAGE_ACCEPT =
  ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp";

export const EMPLOYER_REGISTER_IMAGE_UPLOAD_HINT =
  "PNG, JPG, JPEG or WEBP (max 5MB)";

export const EMPLOYER_REGISTER_OTP_LENGTH = 4;

export const EMPLOYER_REGISTER_WHATSAPP_DIGIT_COUNT = 10;

export const EMPLOYER_REGISTER_OTP_HEADING = "Verify WhatsApp Number";

export const EMPLOYER_REGISTER_OTP_DESCRIPTION =
  "We've sent a 4-digit verification code to your WhatsApp.";

export const EMPLOYER_REGISTER_OTP_VERIFY_LABEL = "Verify OTP";

export const EMPLOYER_REGISTER_OTP_SUCCESS_LABEL = "WhatsApp Number Verified";

export const EMPLOYER_REGISTER_DEFAULT_ACCOUNT_TYPE: EmployerRegisterAccountType =
  "company";

export const EMPLOYER_REGISTER_ACCOUNT_TYPE_OPTIONS: ReadonlyArray<{
  value: EmployerRegisterAccountType;
  label: string;
}> = [
  { value: "company", label: "Company/Business" },
  { value: "consultancy", label: "Consultancy" },
  { value: "individual", label: "Individual" },
] as const;

export function isBusinessEmployerAccountType(
  accountType: EmployerRegisterAccountType,
): accountType is "company" | "consultancy" {
  return accountType === "company" || accountType === "consultancy";
}

export const EMPLOYER_REGISTER_DOCUMENT_TYPE_OPTIONS: ReadonlyArray<{
  value: EmployerRegisterDocumentType;
  label: string;
}> = [
  { value: "aadhaar", label: "Aadhaar Card" },
  { value: "pan", label: "PAN Card" },
  { value: "driving-licence", label: "Driving Licence" },
  { value: "voter-id", label: "Voter ID" },
] as const;

export const EMPLOYER_REGISTER_BUSINESS_DOCUMENT_OPTIONS: ReadonlyArray<{
  value: EmployerRegisterBusinessDocumentType;
  label: string;
}> = [
  { value: "gst-certificate", label: "GST Certificate" },
  {
    value: "certificate-of-incorporation",
    label: "Certificate of Incorporation",
  },
  {
    value: "llp-registration-certificate",
    label: "LLP Registration Certificate",
  },
  {
    value: "msme-udyam-registration",
    label: "MSME / Udyam Registration",
  },
  {
    value: "shop-establishment-license",
    label: "Shop & Establishment License",
  },
  { value: "trade-license", label: "Trade License" },
  { value: "pan-card-business", label: "PAN Card (Business)" },
  {
    value: "trust-society-registration",
    label: "Trust / Society Registration",
  },
  { value: "partnership-deed", label: "Partnership Deed" },
  { value: "fssai-license", label: "FSSAI License" },
  {
    value: "other-government-registration",
    label: "Other Government Registration",
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

export const EMPLOYER_REGISTER_PINCODE_OPTIONS: readonly EmployerRegisterSelectOption[] =
  [
    { value: "500033", label: "500033" },
    { value: "500081", label: "500081" },
    { value: "500084", label: "500084" },
    { value: "560001", label: "560001" },
    { value: "400001", label: "400001" },
    { value: "110001", label: "110001" },
  ] as const;

export const EMPLOYER_REGISTER_CITY_OPTIONS: readonly EmployerRegisterSelectOption[] =
  [
    { value: "hyderabad", label: "Hyderabad" },
    { value: "bengaluru", label: "Bengaluru" },
    { value: "mumbai", label: "Mumbai" },
    { value: "delhi", label: "Delhi" },
    { value: "chennai", label: "Chennai" },
    { value: "pune", label: "Pune" },
  ] as const;

export const EMPLOYER_REGISTER_STATE_OPTIONS: readonly EmployerRegisterSelectOption[] =
  [
    { value: "telangana", label: "Telangana" },
    { value: "karnataka", label: "Karnataka" },
    { value: "maharashtra", label: "Maharashtra" },
    { value: "delhi", label: "Delhi" },
    { value: "tamil-nadu", label: "Tamil Nadu" },
  ] as const;

export const EMPLOYER_REGISTER_PINCODE_LOCATION_MAP: Record<
  string,
  { city: string; state: string }
> = {
  "500033": { city: "Hyderabad", state: "Telangana" },
  "500081": { city: "Hyderabad", state: "Telangana" },
  "500084": { city: "Hyderabad", state: "Telangana" },
  "560001": { city: "Bengaluru", state: "Karnataka" },
  "400001": { city: "Mumbai", state: "Maharashtra" },
  "110001": { city: "Delhi", state: "Delhi" },
};

export const EMPLOYER_REGISTER_INITIAL_FORM_DATA: EmployerRegisterFormData = {
  companyName: "",
  establishmentName: "",
  firstName: "",
  lastName: "",
  whatsappNumber: "",
  emailAddress: "",
};

export const EMPLOYER_REGISTER_INITIAL_COMPANY_PROFILE_DATA: EmployerRegisterCompanyProfileData =
  {
    companyName: "",
    industry: "",
    businessCategory: "",
    companyStrength: "",
    minimumEmployees: "",
    maximumEmployees: "",
    companyAddress: "",
    pincode: "",
    city: "",
    state: "",
    verificationDocument: "",
  };

export const EMPLOYER_REGISTER_TESTIMONIAL_AUTOPLAY_MS = 4000;

export const EMPLOYER_REGISTER_TESTIMONIAL_TRANSITION_MS = 400;

export const EMPLOYER_REGISTER_TESTIMONIALS: readonly EmployerRegisterTestimonial[] =
  [
    {
      id: "sneha-patel",
      quote:
        "The hiring process became much faster. Verified candidates, multilingual support, and instant communication saved our team valuable time.",
      name: "Sneha Patel",
      designation: "Operations Head",
      avatar: avatar3,
      avatarAlt: "Portrait of Sneha Patel",
    },
    {
      id: "priya-reddy",
      quote:
        "Finding reliable site workers used to take weeks. With AsliJobs, we hired verified candidates quickly, saving both time and effort.",
      name: "Priya Reddy",
      designation: "Talent Acquisition Lead",
      avatar: avatar1,
      avatarAlt: "Portrait of Priya Reddy",
    },
    {
      id: "rahul-sharma",
      quote:
        "Posting jobs on AsliJobs was incredibly simple. We started receiving quality applications on WhatsApp within just a few hours.",
      name: "Rahul Sharma",
      designation: "HR Manager",
      avatar: avatar2,
      avatarAlt: "Portrait of Rahul Sharma",
    },
  ] as const;

export function isValidEmployerWhatsappNumber(value: string) {
  return (
    value.replace(/\D/g, "").length === EMPLOYER_REGISTER_WHATSAPP_DIGIT_COUNT
  );
}
