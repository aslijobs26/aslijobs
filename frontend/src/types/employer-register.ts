import type { StaticImageData } from "next/image";

export type EmployerRegisterFormData = {
  companyName: string;
  firstName: string;
  lastName: string;
  whatsappNumber: string;
  emailAddress: string;
};

export type EmployerRegisterTestimonial = {
  id: string;
  quote: string;
  name: string;
  designation: string;
  avatar: StaticImageData;
  avatarAlt: string;
};
