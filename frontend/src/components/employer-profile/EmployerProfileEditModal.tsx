"use client";

import { EmployerProfileDialog } from "@/components/employer-profile/EmployerProfileDialog";
import { EmployerImageUploadField } from "@/components/employer-register/EmployerImageUploadField";
import { EmployerRegisterPlaceAutocomplete } from "@/components/employer-register/EmployerRegisterPlaceAutocomplete";
import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import {
  EMPLOYER_REGISTER_COMPANY_STRENGTH_OPTIONS,
  EMPLOYER_REGISTER_INDUSTRY_OPTIONS,
  EMPLOYER_REGISTER_PINCODE_LOCATION_MAP,
  EMPLOYER_REGISTER_PINCODE_OPTIONS,
  getCompanyStrengthRange,
  getCompanyStrengthValueFromRange,
  getEmployerRegisterBusinessCategoryOptions,
  isBusinessEmployerAccountType,
} from "@/constants/employer-register";
import type {
  EmployerProfilePublic,
  UpdateEmployerProfileInput,
} from "@/services/employer-profile.service";
import type { EmployerRegisterImagePreview } from "@/types/employer-register";
import { resolveMediaUrl } from "@/utils/resolve-media-url";
import { useMemo, useState, type FormEvent } from "react";

export type EmployerProfileEditSection =
  | "company"
  | "about"
  | "contact"
  | "social";

type EmployerProfileEditModalProps = {
  section: EmployerProfileEditSection;
  profile: EmployerProfilePublic;
  isSaving: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSave: (input: UpdateEmployerProfileInput) => Promise<void>;
};

type ProfileDraft = {
  companyName: string;
  establishmentName: string;
  industry: string;
  businessCategory: string;
  companyStrength: string;
  minimumEmployees: string;
  maximumEmployees: string;
  companyDescription: string;
  website: string;
  foundedYear: string;
  companyType: string;
  gstNumber: string;
  panNumber: string;
  registrationNumber: string;
  companyAddress: string;
  pincode: string;
  city: string;
  state: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  contactDesignation: string;
  alternatePhone: string;
  aboutUs: string;
  benefits: string;
  vision: string;
  mission: string;
  values: string;
  linkedinUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
};

const BUSINESS_SECTION_COPY: Record<
  EmployerProfileEditSection,
  { title: string; description: string }
> = {
  company: {
    title: "Edit company information",
    description: "Update your company identity, legal details and location.",
  },
  about: {
    title: "Edit about company",
    description: "Share your benefits and company direction.",
  },
  contact: {
    title: "Edit contact information",
    description: "Keep the primary employer contact details current.",
  },
  social: {
    title: "Edit social links",
    description: "Add complete http or https links for your company channels.",
  },
};

const INDIVIDUAL_SECTION_COPY: Record<
  EmployerProfileEditSection,
  { title: string; description: string }
> = {
  company: {
    title: "Edit professional information",
    description: "Update your professional name, summary and profile photo.",
  },
  about: {
    title: "Edit about me",
    description: "Share your experience, achievements and professional goals.",
  },
  contact: {
    title: "Edit contact information",
    description: "Keep your contact details current.",
  },
  social: {
    title: "Edit professional links",
    description: "Add complete http or https links for your professional profile.",
  },
};

const inputClassName =
  "mt-1.5 min-h-11 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";
const textareaClassName = `${inputClassName} min-h-24 resize-y py-2.5`;

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  readOnly = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "url" | "number" | "tel";
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <label htmlFor={id} className="block min-w-0">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClassName} ${readOnly ? "cursor-not-allowed bg-hero-bg text-muted" : ""}`}
      />
    </label>
  );
}

function TextareaField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <textarea
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={textareaClassName}
      />
    </label>
  );
}

function createDraft(profile: EmployerProfilePublic): ProfileDraft {
  return {
    companyName: profile.companyName ?? "",
    establishmentName: profile.establishmentName ?? "",
    industry: profile.industry ?? "",
    businessCategory: profile.businessCategory ?? "",
    companyStrength: getCompanyStrengthValueFromRange(
      profile.minimumEmployees,
      profile.maximumEmployees,
    ),
    minimumEmployees:
      profile.minimumEmployees === null
        ? ""
        : String(profile.minimumEmployees),
    maximumEmployees:
      profile.maximumEmployees === null
        ? ""
        : String(profile.maximumEmployees),
    companyDescription: profile.companyDescription ?? "",
    website: profile.website ?? "",
    foundedYear: profile.foundedYear ? String(profile.foundedYear) : "",
    companyType: profile.companyType ?? "",
    gstNumber: profile.gstNumber ?? "",
    panNumber: profile.panNumber ?? "",
    registrationNumber: profile.registrationNumber ?? "",
    companyAddress: profile.companyAddress ?? "",
    pincode: profile.pincode ?? "",
    city: profile.city ?? "",
    state: profile.state ?? "",
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    emailAddress: profile.emailAddress ?? "",
    contactDesignation: profile.contactDesignation ?? "",
    alternatePhone: profile.alternatePhone ?? "",
    aboutUs: profile.aboutUs ?? "",
    benefits: profile.benefits ?? "",
    vision: profile.vision ?? "",
    mission: profile.mission ?? "",
    values: profile.values ?? "",
    linkedinUrl: profile.socialLinks?.linkedin ?? "",
    facebookUrl: profile.socialLinks?.facebook ?? "",
    instagramUrl: profile.socialLinks?.instagram ?? "",
    twitterUrl: profile.socialLinks?.twitter ?? "",
    youtubeUrl: profile.socialLinks?.youtube ?? "",
  };
}

export function EmployerProfileEditModal({
  section,
  profile,
  isSaving,
  errorMessage,
  onClose,
  onSave,
}: EmployerProfileEditModalProps) {
  const [draft, setDraft] = useState<ProfileDraft>(() => createDraft(profile));
  const [logoPreview, setLogoPreview] =
    useState<EmployerRegisterImagePreview | null>(null);
  const [photoPreview, setPhotoPreview] =
    useState<EmployerRegisterImagePreview | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removePhoto, setRemovePhoto] = useState(false);
  const isBusiness = isBusinessEmployerAccountType(profile.accountType);
  const isConsultancy = profile.accountType === "consultancy";
  const businessCategoryOptions = useMemo(
    () => getEmployerRegisterBusinessCategoryOptions(draft.industry),
    [draft.industry],
  );
  const copy = (isBusiness
    ? BUSINESS_SECTION_COPY
    : INDIVIDUAL_SECTION_COPY)[section];

  const updateDraft = <Key extends keyof ProfileDraft>(
    key: Key,
    value: ProfileDraft[Key],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (section === "company") {
      if (!isBusiness) {
        const establishmentName = draft.establishmentName.trim();
        const website = draft.website.trim();
        await onSave({
          ...(establishmentName ? { establishmentName } : {}),
          ...(draft.industry ? { industry: draft.industry } : {}),
          companyDescription: draft.companyDescription.trim(),
          ...(website ? { website } : {}),
          profilePhotoFile: photoPreview?.file,
          removeProfilePhoto:
            removePhoto && !photoPreview?.file ? true : undefined,
        });
        return;
      }
      const strength = getCompanyStrengthRange(draft.companyStrength);
      const minimumEmployees = isConsultancy
        ? Number.parseInt(draft.minimumEmployees, 10)
        : strength?.minimumEmployees;
      const maximumEmployees = isConsultancy
        ? Number.parseInt(draft.maximumEmployees, 10)
        : strength?.maximumEmployees;
      await onSave({
        companyName: draft.companyName.trim(),
        industry: draft.industry,
        businessCategory: draft.businessCategory,
        companyDescription: draft.companyDescription.trim(),
        website: draft.website.trim(),
        foundedYear: draft.foundedYear
          ? Number.parseInt(draft.foundedYear, 10)
          : null,
        companyType: draft.companyType.trim(),
        gstNumber: draft.gstNumber.trim(),
        panNumber: draft.panNumber.trim(),
        registrationNumber: draft.registrationNumber.trim(),
        companyAddress: draft.companyAddress.trim(),
        pincode: draft.pincode.trim(),
        city: draft.city.trim(),
        state: draft.state.trim(),
        minimumEmployees: Number.isFinite(minimumEmployees)
          ? minimumEmployees
          : undefined,
        maximumEmployees: Number.isFinite(maximumEmployees)
          ? maximumEmployees
          : undefined,
        companyLogoFile: logoPreview?.file,
        removeCompanyLogo:
          removeLogo && !logoPreview?.file ? true : undefined,
      });
      return;
    }

    if (section === "about") {
      await onSave({
        aboutUs: draft.aboutUs.trim(),
        benefits: draft.benefits.trim(),
        vision: draft.vision.trim(),
        mission: draft.mission.trim(),
        values: draft.values.trim(),
      });
      return;
    }

    if (section === "contact") {
      await onSave({
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        emailAddress: draft.emailAddress.trim(),
        contactDesignation: draft.contactDesignation.trim(),
        alternatePhone: draft.alternatePhone.trim(),
        companyAddress: draft.companyAddress.trim(),
        pincode: draft.pincode.trim(),
        city: draft.city.trim(),
        state: draft.state.trim(),
      });
      return;
    }

    await onSave({
      linkedinUrl: draft.linkedinUrl.trim(),
      facebookUrl: draft.facebookUrl.trim(),
      instagramUrl: draft.instagramUrl.trim(),
      twitterUrl: draft.twitterUrl.trim(),
      youtubeUrl: draft.youtubeUrl.trim(),
      website: draft.website.trim(),
    });
  };

  const existingLogoUrl =
    !removeLogo && profile.companyLogo?.url
      ? resolveMediaUrl(profile.companyLogo.url)
      : null;
  const existingPhotoUrl =
    !removePhoto && profile.profilePhoto?.url
      ? resolveMediaUrl(profile.profilePhoto.url)
      : null;

  return (
    <EmployerProfileDialog
      title={copy.title}
      description={copy.description}
      onClose={onClose}
      wide={section === "company" || section === "about"}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-subtle px-4 text-sm font-semibold text-muted hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="employer-profile-edit-form"
            disabled={isSaving}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      }
    >
      <form
        id="employer-profile-edit-form"
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-5"
      >
        {section === "company" && !isBusiness ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="profile-establishment-name"
                label="Professional name"
                value={draft.establishmentName}
                onChange={(value) => updateDraft("establishmentName", value)}
                placeholder="Enter the name shown to candidates"
              />
              <EmployerRegisterSearchableSelect
                id="profile-individual-industry"
                label="Industry"
                value={draft.industry}
                placeholder="Select industry"
                options={EMPLOYER_REGISTER_INDUSTRY_OPTIONS}
                onChange={(value) => updateDraft("industry", value)}
              />
            </div>
            <TextareaField
              id="profile-individual-summary"
              label="Professional summary"
              value={draft.companyDescription}
              onChange={(value) => updateDraft("companyDescription", value)}
              placeholder="Describe your recruiting experience and areas of expertise."
            />
            <Field
              id="profile-individual-website"
              label="Personal website / portfolio"
              type="url"
              value={draft.website}
              onChange={(value) => updateDraft("website", value)}
              placeholder="https://"
            />
            <EmployerImageUploadField
              label="Profile photo"
              optional
              preview={photoPreview}
              existingImageUrl={existingPhotoUrl}
              onPreviewChange={(preview) => {
                setPhotoPreview(preview);
                if (preview) {
                  setRemovePhoto(false);
                }
              }}
              onRemoveExisting={() => setRemovePhoto(true)}
            />
          </>
        ) : null}

        {section === "company" && isBusiness ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="profile-company-name"
                label="Company name"
                value={draft.companyName}
                onChange={(value) => updateDraft("companyName", value)}
              />
              <EmployerRegisterSearchableSelect
                id="profile-company-industry"
                label="Industry"
                value={draft.industry}
                placeholder="Select industry"
                options={EMPLOYER_REGISTER_INDUSTRY_OPTIONS}
                onChange={(value) => {
                  setDraft((current) => ({
                    ...current,
                    industry: value,
                    businessCategory: "",
                  }));
                }}
              />
              <EmployerRegisterSearchableSelect
                id="profile-company-category"
                label="Business category"
                value={draft.businessCategory}
                disabled={!draft.industry}
                placeholder="Select category"
                options={businessCategoryOptions}
                onChange={(value) => updateDraft("businessCategory", value)}
              />
              {isConsultancy ? (
                <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                  <Field
                    id="profile-company-minimum-employees"
                    label="Employees from"
                    type="number"
                    value={draft.minimumEmployees}
                    onChange={(value) =>
                      updateDraft("minimumEmployees", value)
                    }
                  />
                  <Field
                    id="profile-company-maximum-employees"
                    label="Employees to"
                    type="number"
                    value={draft.maximumEmployees}
                    onChange={(value) =>
                      updateDraft("maximumEmployees", value)
                    }
                  />
                </div>
              ) : (
                <EmployerRegisterSearchableSelect
                  id="profile-company-strength"
                  label="Company size"
                  value={draft.companyStrength}
                  placeholder="Select company size"
                  options={EMPLOYER_REGISTER_COMPANY_STRENGTH_OPTIONS}
                  onChange={(value) => updateDraft("companyStrength", value)}
                />
              )}
            </div>

            <TextareaField
              id="profile-company-description"
              label="Company description"
              value={draft.companyDescription}
              onChange={(value) => updateDraft("companyDescription", value)}
              placeholder="Describe your company and what it does."
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                id="profile-company-website"
                label="Website"
                type="url"
                value={draft.website}
                onChange={(value) => updateDraft("website", value)}
                placeholder="https://"
              />
              <Field
                id="profile-company-founded"
                label="Founded year"
                type="number"
                value={draft.foundedYear}
                onChange={(value) => updateDraft("foundedYear", value)}
              />
              <Field
                id="profile-company-type"
                label="Company type"
                value={draft.companyType}
                onChange={(value) => updateDraft("companyType", value)}
                placeholder="Private limited, LLP…"
              />
              <Field
                id="profile-company-gst"
                label="GST number"
                value={draft.gstNumber}
                onChange={(value) => updateDraft("gstNumber", value)}
              />
              <Field
                id="profile-company-pan"
                label="PAN number"
                value={draft.panNumber}
                onChange={(value) => updateDraft("panNumber", value)}
              />
              <Field
                id="profile-company-registration"
                label="Registration number"
                value={draft.registrationNumber}
                onChange={(value) => updateDraft("registrationNumber", value)}
              />
            </div>

            <TextareaField
              id="profile-company-address"
              label="Company address"
              value={draft.companyAddress}
              onChange={(value) => updateDraft("companyAddress", value)}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="profile-company-state"
                  className="text-xs font-semibold text-muted"
                >
                  State
                </label>
                <div className="mt-1.5">
                  <EmployerRegisterPlaceAutocomplete
                    id="profile-company-state"
                    mode="state"
                    value={draft.state}
                    placeholder="Search state"
                    onChange={(value) => {
                      setDraft((current) => ({
                        ...current,
                        state: value,
                        city: "",
                      }));
                    }}
                    onSelect={(suggestion) => {
                      setDraft((current) => ({
                        ...current,
                        state: suggestion.state,
                        city: "",
                      }));
                    }}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="profile-company-city"
                  className="text-xs font-semibold text-muted"
                >
                  City
                </label>
                <div className="mt-1.5">
                  <EmployerRegisterPlaceAutocomplete
                    id="profile-company-city"
                    mode="city"
                    value={draft.city}
                    selectedState={draft.state}
                    disabled={!draft.state.trim()}
                    placeholder="Search city"
                    onChange={(value) => updateDraft("city", value)}
                    onSelect={(suggestion) =>
                      updateDraft("city", suggestion.city)
                    }
                  />
                </div>
              </div>
              <EmployerRegisterSearchableSelect
                id="profile-company-pincode"
                label="Pincode"
                value={draft.pincode}
                allowCustom
                initialVisibleCount={5}
                placeholder="Select pincode"
                options={EMPLOYER_REGISTER_PINCODE_OPTIONS}
                onChange={(value) => {
                  const location =
                    EMPLOYER_REGISTER_PINCODE_LOCATION_MAP[value];
                  setDraft((current) => ({
                    ...current,
                    pincode: value,
                    city: location?.city ?? current.city,
                    state: location?.state ?? current.state,
                  }));
                }}
              />
            </div>

            {isBusiness ? (
              <EmployerImageUploadField
                label="Company logo"
                optional
                preview={logoPreview}
                existingImageUrl={existingLogoUrl}
                onPreviewChange={(preview) => {
                  setLogoPreview(preview);
                  if (preview) {
                    setRemoveLogo(false);
                  }
                }}
                onRemoveExisting={() => setRemoveLogo(true)}
              />
            ) : null}
          </>
        ) : null}

        {section === "about" ? (
          <>
            <TextareaField
              id="profile-about-us"
              label={isBusiness ? "About us" : "About me"}
              value={draft.aboutUs}
              onChange={(value) => updateDraft("aboutUs", value)}
              placeholder={
                isBusiness
                  ? undefined
                  : "Introduce yourself and your approach to recruiting."
              }
            />
            <TextareaField
              id="profile-benefits"
              label={isBusiness ? "Benefits" : "Professional experience"}
              value={draft.benefits}
              onChange={(value) => updateDraft("benefits", value)}
              placeholder={
                isBusiness
                  ? "Describe employee benefits and workplace support."
                  : "Summarize your recruiting experience and specializations."
              }
            />
            <div className="grid gap-4 lg:grid-cols-3">
              <TextareaField
                id="profile-vision"
                label={isBusiness ? "Vision" : "Career vision"}
                value={draft.vision}
                onChange={(value) => updateDraft("vision", value)}
              />
              <TextareaField
                id="profile-mission"
                label={isBusiness ? "Mission" : "Professional goals"}
                value={draft.mission}
                onChange={(value) => updateDraft("mission", value)}
              />
              <TextareaField
                id="profile-values"
                label={isBusiness ? "Values" : "Achievements"}
                value={draft.values}
                onChange={(value) => updateDraft("values", value)}
              />
            </div>
          </>
        ) : null}

        {section === "contact" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="profile-contact-first-name"
                label="First name"
                value={draft.firstName}
                onChange={(value) => updateDraft("firstName", value)}
              />
              <Field
                id="profile-contact-last-name"
                label="Last name"
                value={draft.lastName}
                onChange={(value) => updateDraft("lastName", value)}
              />
              <Field
                id="profile-contact-designation"
                label="Designation"
                value={draft.contactDesignation}
                onChange={(value) => updateDraft("contactDesignation", value)}
              />
              <Field
                id="profile-contact-email"
                label="Email"
                type="email"
                value={draft.emailAddress}
                onChange={(value) => updateDraft("emailAddress", value)}
              />
              <Field
                id="profile-contact-phone"
                label="Primary phone"
                type="tel"
                value={profile.whatsappNumber}
                onChange={() => undefined}
                readOnly
              />
              <Field
                id="profile-contact-alternate"
                label="Alternate phone"
                type="tel"
                value={draft.alternatePhone}
                onChange={(value) => updateDraft("alternatePhone", value)}
              />
            </div>
            <TextareaField
              id="profile-contact-address"
              label="Address"
              value={draft.companyAddress}
              onChange={(value) => updateDraft("companyAddress", value)}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                id="profile-contact-city"
                label="City"
                value={draft.city}
                onChange={(value) => updateDraft("city", value)}
              />
              <Field
                id="profile-contact-state"
                label="State"
                value={draft.state}
                onChange={(value) => updateDraft("state", value)}
              />
              <Field
                id="profile-contact-pincode"
                label="Pincode"
                value={draft.pincode}
                onChange={(value) => updateDraft("pincode", value)}
              />
            </div>
          </>
        ) : null}

        {section === "social" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="profile-social-linkedin"
              label="LinkedIn"
              type="url"
              value={draft.linkedinUrl}
              onChange={(value) => updateDraft("linkedinUrl", value)}
              placeholder={
                isBusiness
                  ? "https://linkedin.com/company/…"
                  : "https://linkedin.com/in/…"
              }
            />
            <Field
              id="profile-social-facebook"
              label="Facebook"
              type="url"
              value={draft.facebookUrl}
              onChange={(value) => updateDraft("facebookUrl", value)}
              placeholder="https://facebook.com/…"
            />
            <Field
              id="profile-social-instagram"
              label="Instagram"
              type="url"
              value={draft.instagramUrl}
              onChange={(value) => updateDraft("instagramUrl", value)}
              placeholder="https://instagram.com/…"
            />
            <Field
              id="profile-social-twitter"
              label="Twitter / X"
              type="url"
              value={draft.twitterUrl}
              onChange={(value) => updateDraft("twitterUrl", value)}
              placeholder="https://x.com/…"
            />
            <Field
              id="profile-social-youtube"
              label="YouTube"
              type="url"
              value={draft.youtubeUrl}
              onChange={(value) => updateDraft("youtubeUrl", value)}
              placeholder="https://youtube.com/…"
            />
            <Field
              id="profile-social-website"
              label={isBusiness ? "Website" : "Personal website / portfolio"}
              type="url"
              value={draft.website}
              onChange={(value) => updateDraft("website", value)}
              placeholder="https://"
            />
          </div>
        ) : null}

        {errorMessage ? (
          <p className="text-sm font-medium text-pin-state" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </form>
    </EmployerProfileDialog>
  );
}
