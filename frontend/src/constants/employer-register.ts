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

export const EMPLOYER_REGISTER_DOCUMENT_UPLOAD_PRIMARY =
  "Upload Selected Document";

export const EMPLOYER_REGISTER_DOCUMENT_UPLOAD_HINT =
  "drag and drop your documents here, Max size 5 MB Formats: png, jpg, pdf";

export const EMPLOYER_REGISTER_DOCUMENT_HELPER_TEXT =
  "We use this document only for identity verification and it will remain secure.";

export const EMPLOYER_REGISTER_DOCUMENT_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const EMPLOYER_REGISTER_DOCUMENT_ACCEPT =
  ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

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
  { value: "individual", label: "Individual" },
] as const;

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
  { value: "gst", label: "GST" },
  {
    value: "certificate-of-incorporation",
    label: "Certificate of Incorporation (LLP or PVT/Partnership)",
  },
  {
    value: "msme-udyam-registration",
    label: "MSME / Udyam Registration",
  },
  {
    value: "shop-establishment-license",
    label: "Shop and Establishment License",
  },
  { value: "trade-license", label: "Trade License" },
  { value: "pan-card-business", label: "PAN Card (Business)" },
  {
    value: "trust-society-registration",
    label: "Trust / Society Registration",
  },
] as const;

export const EMPLOYER_REGISTER_INDUSTRY_OPTIONS: readonly EmployerRegisterSelectOption[] =
  [
    {
      value: "construction-infrastructure",
      label: "Construction & Infrastructure",
    },
    { value: "manufacturing", label: "Manufacturing" },
    {
      value: "logistics-transportation",
      label: "Logistics & Transportation",
    },
    { value: "retail-ecommerce", label: "Retail & E-commerce" },
    { value: "hospitality", label: "Hospitality" },
    { value: "healthcare", label: "Healthcare" },
    { value: "education", label: "Education" },
    { value: "security-services", label: "Security Services" },
    { value: "facility-management", label: "Facility Management" },
    { value: "it-software", label: "IT & Software" },
    { value: "telecom", label: "Telecom" },
    { value: "agriculture", label: "Agriculture" },
    {
      value: "banking-financial-services",
      label: "Banking & Financial Services",
    },
    { value: "media-entertainment", label: "Media & Entertainment" },
    { value: "beauty-wellness", label: "Beauty & Wellness" },
    {
      value: "domestic-home-services",
      label: "Domestic & Home Services",
    },
  ] as const;

export const EMPLOYER_REGISTER_BUSINESS_CATEGORIES_BY_INDUSTRY: Readonly<
  Record<string, readonly EmployerRegisterSelectOption[]>
> = {
  "construction-infrastructure": [
    { value: "builder-developer", label: "Builder / Developer" },
    { value: "civil-contractor", label: "Civil Contractor" },
    { value: "interior-design", label: "Interior Design" },
    { value: "architecture-firm", label: "Architecture Firm" },
    { value: "construction-company", label: "Construction Company" },
    {
      value: "road-highway-contractor",
      label: "Road & Highway Contractor",
    },
    { value: "electrical-contractor", label: "Electrical Contractor" },
    { value: "plumbing-contractor", label: "Plumbing Contractor" },
    { value: "hvac-contractor", label: "HVAC Contractor" },
    { value: "painting-contractor", label: "Painting Contractor" },
    { value: "fabrication-contractor", label: "Fabrication Contractor" },
    { value: "real-estate-developer", label: "Real Estate Developer" },
  ],
  manufacturing: [
    {
      value: "automobile-manufacturing",
      label: "Automobile Manufacturing",
    },
    { value: "textile-manufacturing", label: "Textile Manufacturing" },
    { value: "food-processing", label: "Food Processing" },
    {
      value: "pharmaceutical-manufacturing",
      label: "Pharmaceutical Manufacturing",
    },
    {
      value: "electronics-manufacturing",
      label: "Electronics Manufacturing",
    },
    { value: "chemical-manufacturing", label: "Chemical Manufacturing" },
    { value: "plastic-manufacturing", label: "Plastic Manufacturing" },
    {
      value: "steel-metal-fabrication",
      label: "Steel & Metal Fabrication",
    },
    { value: "furniture-manufacturing", label: "Furniture Manufacturing" },
    { value: "packaging-industry", label: "Packaging Industry" },
  ],
  "logistics-transportation": [
    { value: "courier-company", label: "Courier Company" },
    { value: "warehouse", label: "Warehouse" },
    { value: "supply-chain-company", label: "Supply Chain Company" },
    { value: "truck-fleet-operator", label: "Truck Fleet Operator" },
    { value: "transport-company", label: "Transport Company" },
    { value: "delivery-service", label: "Delivery Service" },
    { value: "ecommerce-logistics", label: "E-commerce Logistics" },
    { value: "freight-forwarding", label: "Freight Forwarding" },
  ],
  "retail-ecommerce": [
    { value: "supermarket", label: "Supermarket" },
    { value: "grocery-store", label: "Grocery Store" },
    { value: "clothing-store", label: "Clothing Store" },
    { value: "electronics-store", label: "Electronics Store" },
    { value: "furniture-store", label: "Furniture Store" },
    { value: "mobile-store", label: "Mobile Store" },
    { value: "jewellery-store", label: "Jewellery Store" },
    { value: "ecommerce-seller", label: "E-commerce Seller" },
    { value: "wholesale-dealer", label: "Wholesale Dealer" },
  ],
  hospitality: [
    { value: "hotel", label: "Hotel" },
    { value: "restaurant", label: "Restaurant" },
    { value: "cafe", label: "Café" },
    { value: "resort", label: "Resort" },
    { value: "catering-service", label: "Catering Service" },
    { value: "bakery", label: "Bakery" },
    { value: "fast-food-outlet", label: "Fast Food Outlet" },
    { value: "cloud-kitchen", label: "Cloud Kitchen" },
  ],
  healthcare: [
    { value: "hospital", label: "Hospital" },
    { value: "clinic", label: "Clinic" },
    { value: "diagnostic-centre", label: "Diagnostic Centre" },
    { value: "pharmacy", label: "Pharmacy" },
    { value: "nursing-home", label: "Nursing Home" },
    { value: "dental-clinic", label: "Dental Clinic" },
    { value: "home-healthcare", label: "Home Healthcare" },
    { value: "medical-laboratory", label: "Medical Laboratory" },
  ],
  education: [
    { value: "school", label: "School" },
    { value: "college", label: "College" },
    { value: "university", label: "University" },
    { value: "coaching-institute", label: "Coaching Institute" },
    { value: "training-institute", label: "Training Institute" },
    {
      value: "skill-development-centre",
      label: "Skill Development Centre",
    },
  ],
  "security-services": [
    { value: "security-agency", label: "Security Agency" },
    { value: "event-security", label: "Event Security" },
    { value: "industrial-security", label: "Industrial Security" },
    { value: "facility-security", label: "Facility Security" },
  ],
  "facility-management": [
    { value: "housekeeping", label: "Housekeeping" },
    { value: "pest-control", label: "Pest Control" },
    { value: "cleaning-services", label: "Cleaning Services" },
    { value: "waste-management", label: "Waste Management" },
    { value: "maintenance-services", label: "Maintenance Services" },
  ],
  "it-software": [
    { value: "software-company", label: "Software Company" },
    { value: "it-services", label: "IT Services" },
    { value: "web-development", label: "Web Development" },
    {
      value: "mobile-app-development",
      label: "Mobile App Development",
    },
    { value: "ai-company", label: "AI Company" },
    { value: "saas-company", label: "SaaS Company" },
    { value: "digital-agency", label: "Digital Agency" },
  ],
  telecom: [
    {
      value: "internet-service-provider",
      label: "Internet Service Provider",
    },
    { value: "telecom-operator", label: "Telecom Operator" },
    { value: "network-installation", label: "Network Installation" },
    { value: "cable-services", label: "Cable Services" },
  ],
  agriculture: [
    { value: "dairy-farm", label: "Dairy Farm" },
    { value: "poultry-farm", label: "Poultry Farm" },
    { value: "fisheries", label: "Fisheries" },
    { value: "organic-farming", label: "Organic Farming" },
    { value: "food-processing-unit", label: "Food Processing Unit" },
    {
      value: "agri-equipment-dealer",
      label: "Agri Equipment Dealer",
    },
  ],
  "banking-financial-services": [
    { value: "bank", label: "Bank" },
    { value: "nbfc", label: "NBFC" },
    { value: "insurance-company", label: "Insurance Company" },
    { value: "fintech", label: "FinTech" },
    { value: "microfinance", label: "Microfinance" },
    { value: "investment-firm", label: "Investment Firm" },
  ],
  "media-entertainment": [
    { value: "advertising-agency", label: "Advertising Agency" },
    { value: "production-house", label: "Production House" },
    { value: "event-management", label: "Event Management" },
    { value: "printing-press", label: "Printing Press" },
    { value: "news-media", label: "News & Media" },
    { value: "photography-studio", label: "Photography Studio" },
  ],
  "beauty-wellness": [
    { value: "salon", label: "Salon" },
    { value: "spa", label: "Spa" },
    { value: "gym", label: "Gym" },
    { value: "fitness-centre", label: "Fitness Centre" },
    { value: "beauty-clinic", label: "Beauty Clinic" },
    { value: "wellness-centre", label: "Wellness Centre" },
  ],
  "domestic-home-services": [
    { value: "maid-agency", label: "Maid Agency" },
    { value: "driver-services", label: "Driver Services" },
    { value: "cook-services", label: "Cook Services" },
    { value: "home-repair", label: "Home Repair" },
    { value: "appliance-repair", label: "Appliance Repair" },
    { value: "electrician-services", label: "Electrician Services" },
    { value: "plumbing-services", label: "Plumbing Services" },
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
  "500033": { city: "hyderabad", state: "telangana" },
  "500081": { city: "hyderabad", state: "telangana" },
  "500084": { city: "hyderabad", state: "telangana" },
  "560001": { city: "bengaluru", state: "karnataka" },
  "400001": { city: "mumbai", state: "maharashtra" },
  "110001": { city: "delhi", state: "delhi" },
};

export const EMPLOYER_REGISTER_INITIAL_FORM_DATA: EmployerRegisterFormData = {
  companyName: "",
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
    companyAddress: "",
    pincode: "",
    city: "",
    state: "",
    whatsappNumber: "",
    emailAddress: "",
    verificationDocument: "",
  };

export const EMPLOYER_REGISTER_TESTIMONIAL_AUTOPLAY_MS = 4000;

export const EMPLOYER_REGISTER_TESTIMONIAL_TRANSITION_MS = 400;

export const EMPLOYER_REGISTER_TESTIMONIALS: readonly EmployerRegisterTestimonial[] =
  [
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
    {
      id: "sneha-patel",
      quote:
        "The hiring process became much faster. Verified candidates, multilingual support, and instant communication saved our team valuable time.",
      name: "Sneha Patel",
      designation: "Operations Head",
      avatar: avatar3,
      avatarAlt: "Portrait of Sneha Patel",
    },
  ] as const;

export function isValidEmployerWhatsappNumber(value: string) {
  return (
    value.replace(/\D/g, "").length === EMPLOYER_REGISTER_WHATSAPP_DIGIT_COUNT
  );
}
