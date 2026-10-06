export type OperationsEmployerAccountType =
  | "individual"
  | "company"
  | "consultancy";

export const OPERATIONS_EMPLOYER_ACCOUNT_TYPE_OPTIONS: ReadonlyArray<{
  value: OperationsEmployerAccountType;
  label: string;
}> = [
  { value: "individual", label: "Individual" },
  { value: "company", label: "Company" },
  { value: "consultancy", label: "Consultancy" },
] as const;

export const OPERATIONS_EMPLOYER_WHATSAPP_DIGIT_COUNT = 10;
export const OPERATIONS_EMPLOYER_OTP_LENGTH = 6;

export const OPERATIONS_EMPLOYER_COMPANY_STRENGTH_OPTIONS = [
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
  const option = OPERATIONS_EMPLOYER_COMPANY_STRENGTH_OPTIONS.find(
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

export function isValidOperationsWhatsappNumber(value: string): boolean {
  return /^[6-9]\d{9}$/.test(value.replace(/\D/g, ""));
}

export function isValidOptionalEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export type AddEmployerFormState = {
  accountType: OperationsEmployerAccountType | "";
  companyName: string;
  establishmentName: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  whatsappNumber: string;
  industry: string;
  businessCategory: string;
  companyStrength: string;
  minimumEmployees: string;
  maximumEmployees: string;
  companyAddress: string;
  pincode: string;
  city: string;
  state: string;
};

export const EMPTY_ADD_EMPLOYER_FORM: AddEmployerFormState = {
  accountType: "",
  companyName: "",
  establishmentName: "",
  firstName: "",
  lastName: "",
  emailAddress: "",
  whatsappNumber: "",
  industry: "",
  businessCategory: "",
  companyStrength: "",
  minimumEmployees: "",
  maximumEmployees: "",
  companyAddress: "",
  pincode: "",
  city: "",
  state: "",
};

export function isolateAddEmployerForm(
  accountType: OperationsEmployerAccountType | "",
  form: AddEmployerFormState,
): AddEmployerFormState {
  if (!accountType) {
    return {
      ...EMPTY_ADD_EMPLOYER_FORM,
      firstName: form.firstName,
      lastName: form.lastName,
      emailAddress: form.emailAddress,
      whatsappNumber: form.whatsappNumber,
    };
  }

  const next: AddEmployerFormState = {
    ...EMPTY_ADD_EMPLOYER_FORM,
    accountType,
    firstName: form.firstName,
    lastName: form.lastName,
    emailAddress: form.emailAddress,
    whatsappNumber: form.whatsappNumber,
  };

  if (accountType === "individual") {
    next.establishmentName = form.establishmentName;
    return next;
  }

  next.companyName = form.companyName;
  next.companyAddress = form.companyAddress;
  next.pincode = form.pincode;
  next.city = form.city;
  next.state = form.state;

  if (accountType === "company") {
    next.industry = form.industry;
    next.businessCategory = form.businessCategory;
    next.companyStrength = form.companyStrength;
    next.minimumEmployees = form.minimumEmployees;
    next.maximumEmployees = form.maximumEmployees;
  }

  return next;
}

export function validateAddEmployerForm(
  form: AddEmployerFormState,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.accountType) {
    errors.accountType = "Select an employer category.";
    return errors;
  }

  if (!form.firstName.trim()) {
    errors.firstName = "First name is required.";
  }
  if (!form.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }
  if (!isValidOptionalEmail(form.emailAddress)) {
    errors.emailAddress = "Enter a valid email address.";
  }
  if (!isValidOperationsWhatsappNumber(form.whatsappNumber)) {
    errors.whatsappNumber = form.whatsappNumber.trim()
      ? "Enter a valid WhatsApp number."
      : "WhatsApp number is required.";
  }

  if (form.accountType === "individual") {
    if (!form.establishmentName.trim()) {
      errors.establishmentName = "Establishment Name is required.";
    }
    return errors;
  }

  if (!form.companyName.trim()) {
    errors.companyName =
      form.accountType === "consultancy"
        ? "Consultancy Name is required."
        : "Company / Business Name is required.";
  }
  if (!form.companyAddress.trim()) {
    errors.companyAddress = "Company address is required.";
  }
  if (!form.pincode.trim()) {
    errors.pincode = "Pincode is required.";
  }
  if (!form.city.trim()) {
    errors.city = "City is required.";
  }
  if (!form.state.trim()) {
    errors.state = "State is required.";
  }

  if (form.accountType !== "company") {
    return errors;
  }

  if (!form.industry.trim()) {
    errors.industry = "Industry is required.";
  }
  if (!form.businessCategory.trim()) {
    errors.businessCategory = "Business category is required.";
  }

  const min = form.minimumEmployees.trim()
    ? Number.parseInt(form.minimumEmployees, 10)
    : NaN;
  const max = form.maximumEmployees.trim()
    ? Number.parseInt(form.maximumEmployees, 10)
    : NaN;

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    errors.minimumEmployees = "Company strength is required.";
  } else if (max < min) {
    errors.maximumEmployees =
      "Maximum employees must be greater than or equal to minimum employees";
  }

  return errors;
}

export function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
