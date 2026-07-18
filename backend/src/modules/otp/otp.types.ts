export type OtpDeliveryPurpose = "registration" | "login";

export type OtpDeliveryPayload = {
  phoneNumber: string;
  otp: string;
  expiresAt: Date;
  purpose?: OtpDeliveryPurpose;
  employerName?: string;
};

export interface OtpProvider {
  readonly name: string;
  sendOtp(payload: OtpDeliveryPayload): Promise<void>;
}

