import avatar1 from "@/assets/employer-register/avatar-1.png";
import avatar2 from "@/assets/employer-register/avatar-2.png";
import avatar3 from "@/assets/employer-register/avatar-3.png";
import type {
  EmployerRegisterAccountType,
  EmployerRegisterFormData,
  EmployerRegisterTestimonial,
} from "@/types/employer-register";

export const EMPLOYER_REGISTER_HEADING = "Create an Employer Account";

export const EMPLOYER_REGISTER_LOGIN_PROMPT = "Already have an account?";

export const EMPLOYER_REGISTER_SUBMIT_LABEL = "Create Account";

export const EMPLOYER_REGISTER_CONTINUE_LABEL = "Continue";

export const EMPLOYER_REGISTER_ACCOUNT_TYPE_LABEL = "Account Type";

export const EMPLOYER_REGISTER_SEND_OTP_LABEL = "Send OTP";

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

export const EMPLOYER_REGISTER_INITIAL_FORM_DATA: EmployerRegisterFormData = {
  companyName: "",
  firstName: "",
  lastName: "",
  whatsappNumber: "",
  emailAddress: "",
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
