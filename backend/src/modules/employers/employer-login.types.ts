export type EmployerLoginSendOtpInput = {
  whatsappNumber: string;
};

export type EmployerLoginVerifyOtpInput = {
  whatsappNumber: string;
  otp: string;
};
