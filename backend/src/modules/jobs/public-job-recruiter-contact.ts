import { maskEmail, maskGeneric, maskPhone } from "../rbac/field-masking.js";

export type PublicRecruiterContact = {
  contactPersonName: string | null;
  contactEmail: string | null;
  contactMobile: string | null;
  applyWhatsAppNumber: string | null;
};

function presentText(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

/**
 * Guests see masked recruiter contact. A signed-in job seeker or employer
 * receives the saved values.
 */
export function presentPublicRecruiterContact(
  contact: PublicRecruiterContact,
  reveal: boolean,
): PublicRecruiterContact {
  const name = presentText(contact.contactPersonName);
  const email = presentText(contact.contactEmail);
  const mobile = presentText(contact.contactMobile);
  const whatsapp = presentText(contact.applyWhatsAppNumber);

  if (reveal) {
    return {
      contactPersonName: name,
      contactEmail: email,
      contactMobile: mobile,
      applyWhatsAppNumber: whatsapp,
    };
  }

  return {
    contactPersonName: name ? maskGeneric(name) : null,
    contactEmail: email ? maskEmail(email) : null,
    contactMobile: mobile ? maskPhone(mobile) : null,
    applyWhatsAppNumber: whatsapp ? maskPhone(whatsapp) : null,
  };
}
