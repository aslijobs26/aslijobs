import type { FieldMaskStrategy } from "../team/field-access.catalog.js";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function maskPhone(value: unknown): string {
  if (value == null) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  const digits = digitsOnly(raw);
  if (digits.length <= 4) {
    return "*".repeat(Math.max(digits.length, 4));
  }
  return `${"*".repeat(Math.max(digits.length - 4, 4))}${digits.slice(-4)}`;
}

export function maskEmail(value: unknown): string {
  if (value == null) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  const at = raw.indexOf("@");
  if (at <= 0) {
    if (raw.length <= 2) return "*".repeat(raw.length);
    return `${raw.slice(0, 1)}${"*".repeat(raw.length - 1)}`;
  }
  const local = raw.slice(0, at);
  const domain = raw.slice(at + 1);
  const visible = Math.min(3, Math.max(1, local.length));
  const maskedLocal =
    local.length <= 1
      ? "*"
      : `${local.slice(0, visible)}${"*".repeat(Math.max(local.length - visible, 3))}`;
  return `${maskedLocal}@${domain}`;
}

export function maskSalary(value: unknown): string {
  if (value == null || value === "") return "";
  const raw = String(value).trim();
  const numeric = raw.replace(/[^\d.]/g, "");
  if (!numeric) {
    return "₹******";
  }
  const suffix = numeric.slice(-2);
  return `₹******${suffix}`;
}

export function maskPAN(value: unknown): string {
  if (value == null) return "";
  const raw = String(value).trim().toUpperCase();
  if (!raw) return "";
  if (raw.length < 6) {
    return `${raw.slice(0, 1)}${"*".repeat(Math.max(raw.length - 1, 4))}`;
  }
  return `${raw.slice(0, 5)}${"*".repeat(Math.max(raw.length - 6, 5))}${raw.slice(-1)}`;
}

export function maskAadhaar(value: unknown): string {
  if (value == null) return "";
  const digits = digitsOnly(String(value));
  if (!digits) return "";
  const last4 = digits.slice(-4).padStart(4, "0");
  return `XXXX XXXX ${last4}`;
}

export function maskBank(value: unknown): string {
  if (value == null) return "";
  const digits = digitsOnly(String(value));
  if (!digits) {
    const raw = String(value).trim();
    if (!raw) return "";
    return `${"*".repeat(Math.max(raw.length - 4, 4))}${raw.slice(-4)}`;
  }
  if (digits.length <= 4) {
    return "*".repeat(4);
  }
  return `${"*".repeat(Math.max(digits.length - 4, 4))}${digits.slice(-4)}`;
}

export function maskGeneric(value: unknown): string {
  if (value == null) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (raw.length <= 2) return "*".repeat(raw.length);
  return `${raw.slice(0, 1)}${"*".repeat(Math.max(raw.length - 2, 3))}${raw.slice(-1)}`;
}

export function maskByStrategy(
  strategy: FieldMaskStrategy,
  value: unknown,
): string {
  switch (strategy) {
    case "phone":
      return maskPhone(value);
    case "email":
      return maskEmail(value);
    case "salary":
      return maskSalary(value);
    case "pan":
      return maskPAN(value);
    case "aadhaar":
      return maskAadhaar(value);
    case "bank":
      return maskBank(value);
    case "generic":
      return maskGeneric(value);
    case "none":
    default:
      return value == null ? "" : String(value);
  }
}
