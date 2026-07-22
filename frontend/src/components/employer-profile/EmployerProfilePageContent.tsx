"use client";

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
import {
  fetchEmployerProfile,
  updateEmployerProfile,
  type EmployerProfilePublic,
} from "@/services/employer-profile.service";
import type { EmployerRegisterImagePreview } from "@/types/employer-register";
import { resolveMediaUrl } from "@/utils/resolve-media-url";
import { isAxiosError } from "axios";
import { useEffect, useState, type FormEvent } from "react";

export function EmployerProfilePageContent() {
  const [employer, setEmployer] = useState<EmployerProfilePublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [industry, setIndustry] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [companyStrength, setCompanyStrength] = useState("");
  const [minimumEmployees, setMinimumEmployees] = useState("");
  const [maximumEmployees, setMaximumEmployees] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [emailAddress, setEmailAddress] = useState("");

  const [companyLogoPreview, setCompanyLogoPreview] =
    useState<EmployerRegisterImagePreview | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] =
    useState<EmployerRegisterImagePreview | null>(null);
  const [removeCompanyLogo, setRemoveCompanyLogo] = useState(false);
  const [removeProfilePhoto, setRemoveProfilePhoto] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void fetchEmployerProfile()
      .then((profile) => {
        if (cancelled) {
          return;
        }

        setEmployer(profile);
        setCompanyName(profile.companyName);
        setFirstName(profile.firstName);
        setLastName(profile.lastName);
        setIndustry(profile.industry);
        setBusinessCategory(profile.businessCategory);
        setCompanyStrength(
          getCompanyStrengthValueFromRange(
            profile.minimumEmployees,
            profile.maximumEmployees,
          ),
        );
        setMinimumEmployees(
          typeof profile.minimumEmployees === "number"
            ? String(profile.minimumEmployees)
            : "",
        );
        setMaximumEmployees(
          typeof profile.maximumEmployees === "number"
            ? String(profile.maximumEmployees)
            : "",
        );
        setCompanyAddress(profile.companyAddress);
        setPincode(profile.pincode);
        setCity(profile.city);
        setState(profile.state);
        setEmailAddress(profile.emailAddress);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        const message = isAxiosError(error)
          ? error.response?.data?.message
          : null;
        setErrorMessage(
          typeof message === "string" && message.trim()
            ? message
            : "Unable to load employer profile",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const businessCategoryOptions =
    getEmployerRegisterBusinessCategoryOptions(industry);

  const handleIndustryChange = (nextIndustry: string) => {
    setIndustry(nextIndustry);
    setBusinessCategory("");
  };

  const handlePincodeChange = (nextPincode: string) => {
    const location = EMPLOYER_REGISTER_PINCODE_LOCATION_MAP[nextPincode];
    setPincode(nextPincode);
    if (location) {
      setCity(location.city);
      setState(location.state);
    }
  };

  const handleStateInputChange = (value: string) => {
    setState(value);
    setCity("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!employer) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    if (isBusinessEmployerAccountType(employer.accountType)) {
      const isConsultancy = employer.accountType === "consultancy";
      let nextMinimumEmployees: number;
      let nextMaximumEmployees: number;

      if (isConsultancy) {
        nextMinimumEmployees = Number.parseInt(minimumEmployees, 10);
        nextMaximumEmployees = Number.parseInt(maximumEmployees, 10);

        if (
          !minimumEmployees.trim() ||
          !maximumEmployees.trim() ||
          !Number.isFinite(nextMinimumEmployees) ||
          !Number.isFinite(nextMaximumEmployees)
        ) {
          setErrorMessage("Enter Employees From and Employees To");
          return;
        }

        if (nextMaximumEmployees < nextMinimumEmployees) {
          setErrorMessage(
            "Employees To must be greater than or equal to Employees From",
          );
          return;
        }
      } else {
        const strengthRange = getCompanyStrengthRange(companyStrength);

        if (!strengthRange) {
          setErrorMessage("Select company strength");
          return;
        }

        nextMinimumEmployees = strengthRange.minimumEmployees;
        nextMaximumEmployees = strengthRange.maximumEmployees;
      }

      setIsSubmitting(true);

      try {
        const updated = await updateEmployerProfile({
          companyName,
          industry,
          businessCategory,
          minimumEmployees: nextMinimumEmployees,
          maximumEmployees: nextMaximumEmployees,
          companyAddress,
          pincode,
          city,
          state,
          emailAddress,
          companyLogoFile: companyLogoPreview?.file,
          removeCompanyLogo:
            removeCompanyLogo && !companyLogoPreview?.file ? true : undefined,
        });

        setEmployer(updated);
        setCompanyLogoPreview(null);
        setRemoveCompanyLogo(false);
        setCompanyStrength(
          getCompanyStrengthValueFromRange(
            updated.minimumEmployees,
            updated.maximumEmployees,
          ),
        );
        setMinimumEmployees(
          typeof updated.minimumEmployees === "number"
            ? String(updated.minimumEmployees)
            : "",
        );
        setMaximumEmployees(
          typeof updated.maximumEmployees === "number"
            ? String(updated.maximumEmployees)
            : "",
        );
        setSuccessMessage("Profile updated successfully");
      } catch (error) {
        const message = isAxiosError(error)
          ? error.response?.data?.message
          : null;
        setErrorMessage(
          typeof message === "string" && message.trim()
            ? message
            : "Failed to update profile",
        );
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    setIsSubmitting(true);

    try {
      const updated = await updateEmployerProfile({
        firstName,
        lastName,
        emailAddress,
        profilePhotoFile: profilePhotoPreview?.file,
        removeProfilePhoto:
          removeProfilePhoto && !profilePhotoPreview?.file ? true : undefined,
      });

      setEmployer(updated);
      setProfilePhotoPreview(null);
      setRemoveProfilePhoto(false);
      setSuccessMessage("Profile updated successfully");
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : null;
      setErrorMessage(
        typeof message === "string" && message.trim()
          ? message
          : "Failed to update profile",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-surface p-6">
        <p className="text-sm text-muted">Loading profile...</p>
      </div>
    );
  }

  if (!employer) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-surface p-6">
        <p className="text-sm font-medium text-red-600" role="alert">
          {errorMessage ?? "Unable to load employer profile"}
        </p>
      </div>
    );
  }

  const isBusiness = isBusinessEmployerAccountType(employer.accountType);
  const isConsultancy = employer.accountType === "consultancy";
  const existingLogoUrl =
    !removeCompanyLogo && employer.companyLogo
      ? resolveMediaUrl(employer.companyLogo.url)
      : null;
  const existingPhotoUrl =
    !removeProfilePhoto && employer.profilePhoto
      ? resolveMediaUrl(employer.profilePhoto.url)
      : null;

  return (
    <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6 lg:p-8">
      <h1 className="text-xl font-bold text-foreground sm:text-2xl">
        {isConsultancy
          ? "Consultancy Profile"
          : isBusiness
            ? "Company Profile"
            : "Individual Profile"}
      </h1>
      <p className="mt-1 text-sm text-muted">
        Update your profile details and keep your brand image current.
      </p>

      <form
        className="employer-register-form-fields mt-8 w-full"
        onSubmit={handleSubmit}
        noValidate
      >
        {isBusiness ? (
          <>
            <div className="employer-register-form-stack">
              <label
                htmlFor="edit-company-name"
                className="employer-register-form-label"
              >
                {isConsultancy
                  ? "Consultancy Name*"
                  : "Company / Business Name*"}
              </label>
              <input
                id="edit-company-name"
                type="text"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                className="employer-register-form-input"
              />
            </div>

            {isConsultancy ? (
              <>
                <div className="employer-register-form-row">
                  <EmployerRegisterSearchableSelect
                    id="edit-industry"
                    label="Industry"
                    required
                    value={industry}
                    placeholder="Select Industry"
                    options={EMPLOYER_REGISTER_INDUSTRY_OPTIONS}
                    onChange={handleIndustryChange}
                  />
                  <EmployerRegisterSearchableSelect
                    id="edit-business-category"
                    label="Business Category"
                    required
                    disabled={!industry}
                    value={businessCategory}
                    placeholder="Select Business Category"
                    options={businessCategoryOptions}
                    onChange={setBusinessCategory}
                  />
                </div>

                <div className="employer-register-form-stack">
                  <p className="employer-register-form-label">
                    Consultancy Strength*
                  </p>
                  <div className="employer-register-form-row">
                    <div className="employer-register-form-stack">
                      <label
                        htmlFor="edit-employees-from"
                        className="employer-register-form-label"
                      >
                        Employees From
                      </label>
                      <input
                        id="edit-employees-from"
                        type="text"
                        inputMode="numeric"
                        value={minimumEmployees}
                        onChange={(event) =>
                          setMinimumEmployees(
                            event.target.value.replace(/\D/g, ""),
                          )
                        }
                        placeholder="Minimum Employees"
                        className="employer-register-form-input"
                      />
                    </div>
                    <div className="employer-register-form-stack">
                      <label
                        htmlFor="edit-employees-to"
                        className="employer-register-form-label"
                      >
                        Employees To
                      </label>
                      <input
                        id="edit-employees-to"
                        type="text"
                        inputMode="numeric"
                        value={maximumEmployees}
                        onChange={(event) =>
                          setMaximumEmployees(
                            event.target.value.replace(/\D/g, ""),
                          )
                        }
                        placeholder="Maximum Employees"
                        className="employer-register-form-input"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="employer-register-form-row employer-register-form-row--three">
                <EmployerRegisterSearchableSelect
                  id="edit-industry"
                  label="Industry"
                  required
                  value={industry}
                  placeholder="Select Industry"
                  options={EMPLOYER_REGISTER_INDUSTRY_OPTIONS}
                  onChange={handleIndustryChange}
                />
                <EmployerRegisterSearchableSelect
                  id="edit-business-category"
                  label="Business Category"
                  required
                  disabled={!industry}
                  value={businessCategory}
                  placeholder="Select Business Category"
                  options={businessCategoryOptions}
                  onChange={setBusinessCategory}
                />
                <EmployerRegisterSearchableSelect
                  id="edit-company-strength"
                  label="Company Strength"
                  required
                  value={companyStrength}
                  placeholder="Select Strength"
                  options={EMPLOYER_REGISTER_COMPANY_STRENGTH_OPTIONS}
                  onChange={setCompanyStrength}
                />
              </div>
            )}

            <div className="employer-register-form-stack">
              <label
                htmlFor="edit-company-address"
                className="employer-register-form-label"
              >
                {isConsultancy ? "Consultancy Address*" : "Company Address*"}
              </label>
              <textarea
                id="edit-company-address"
                value={companyAddress}
                onChange={(event) => setCompanyAddress(event.target.value)}
                rows={3}
                className="employer-register-form-textarea"
              />
            </div>

            <div className="employer-register-form-row employer-register-form-row--three">
              <div className="employer-register-form-stack">
                <label
                  htmlFor="edit-state"
                  className="employer-register-form-label"
                >
                  State*
                </label>
                <EmployerRegisterPlaceAutocomplete
                  id="edit-state"
                  mode="state"
                  value={state}
                  placeholder="Search State"
                  onChange={handleStateInputChange}
                  onSelect={(suggestion) => {
                    setState(suggestion.state);
                    setCity("");
                  }}
                />
              </div>

              <div className="employer-register-form-stack">
                <label
                  htmlFor="edit-city"
                  className="employer-register-form-label"
                >
                  City*
                </label>
                <EmployerRegisterPlaceAutocomplete
                  id="edit-city"
                  mode="city"
                  value={city}
                  selectedState={state}
                  disabled={!state.trim()}
                  placeholder={
                    state.trim() ? "Search City" : "Select a state first"
                  }
                  onChange={setCity}
                  onSelect={(suggestion) => setCity(suggestion.city)}
                />
              </div>

              <EmployerRegisterSearchableSelect
                id="edit-pincode"
                label="Pincode"
                required
                allowCustom
                initialVisibleCount={5}
                value={pincode}
                placeholder="Select Pincode"
                options={EMPLOYER_REGISTER_PINCODE_OPTIONS}
                onChange={handlePincodeChange}
              />
            </div>

            <EmployerImageUploadField
              label={
                isConsultancy
                  ? "Upload Consultancy Logo"
                  : "Upload Company Logo"
              }
              preview={companyLogoPreview}
              existingImageUrl={existingLogoUrl}
              onPreviewChange={(preview) => {
                setCompanyLogoPreview(preview);
                if (preview) {
                  setRemoveCompanyLogo(false);
                }
              }}
              onRemoveExisting={() => setRemoveCompanyLogo(true)}
            />
          </>
        ) : (
          <>
            <div className="employer-register-form-row">
              <div className="employer-register-form-stack">
                <label
                  htmlFor="edit-first-name"
                  className="employer-register-form-label"
                >
                  First Name*
                </label>
                <input
                  id="edit-first-name"
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="employer-register-form-input"
                />
              </div>
              <div className="employer-register-form-stack">
                <label
                  htmlFor="edit-last-name"
                  className="employer-register-form-label"
                >
                  Last Name*
                </label>
                <input
                  id="edit-last-name"
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="employer-register-form-input"
                />
              </div>
            </div>

            <EmployerImageUploadField
              label="Upload Profile Photo"
              preview={profilePhotoPreview}
              existingImageUrl={existingPhotoUrl}
              onPreviewChange={(preview) => {
                setProfilePhotoPreview(preview);
                if (preview) {
                  setRemoveProfilePhoto(false);
                }
              }}
              onRemoveExisting={() => setRemoveProfilePhoto(true)}
            />
          </>
        )}

        <div className="employer-register-form-stack">
          <label
            htmlFor="edit-email"
            className="employer-register-form-label"
          >
            Email Address
          </label>
          <input
            id="edit-email"
            type="email"
            value={emailAddress}
            onChange={(event) => setEmailAddress(event.target.value)}
            className="employer-register-form-input"
          />
        </div>

        {errorMessage ? (
          <p className="text-sm font-medium text-red-600" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="text-sm font-medium text-primary-soft" role="status">
            {successMessage}
          </p>
        ) : null}

        <button
          type="submit"
          className="employer-register-form-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
