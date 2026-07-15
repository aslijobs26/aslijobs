import type { EmployerRegisterFormData } from "@/types/employer-register";

export const EMPLOYER_REGISTER_HEADING = "Create an Employer Account";

export const EMPLOYER_REGISTER_LOGIN_PROMPT = "Already have an account?";

export const EMPLOYER_REGISTER_SUBMIT_LABEL = "Create Account";

export const EMPLOYER_REGISTER_INITIAL_FORM_DATA: EmployerRegisterFormData = {
  companyName: "",
  firstName: "",
  lastName: "",
  whatsappNumber: "",
  emailAddress: "",
};

export const EMPLOYER_REGISTER_TESTIMONIAL = {
  activeDotIndex: 1,
  totalDots: 3,
} as const;
