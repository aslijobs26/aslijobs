"use client";

import { FieldError } from "@/components/auth/FieldError";
import { RequiredFieldLabel } from "@/components/auth/RequiredFieldLabel";
import {
  EMPLOYER_REGISTER_PINCODE_LOCATION_MAP,
  EMPLOYER_REGISTER_PINCODE_OPTIONS,
} from "@/constants/employer-register";
import { useTranslate } from "@/i18n/translate";
import type { PlaceSuggestion } from "@/types/nominatim-location";
import type { AuthFieldErrors } from "@/utils/auth-field-errors";
import { EmployerRegisterPlaceAutocomplete } from "./EmployerRegisterPlaceAutocomplete";
import { EmployerRegisterSearchableSelect } from "./EmployerRegisterSearchableSelect";
import { useAuthMessageTranslator } from "./useAuthMessageTranslator";

export type EmployerRegisterLocationValues = {
  companyAddress: string;
  state: string;
  city: string;
  pincode: string;
};

type EmployerRegisterLocationFieldsProps = {
  idPrefix: string;
  values: EmployerRegisterLocationValues;
  fieldErrors: AuthFieldErrors;
  addressCopy?: "company" | "individual";
  useSelectPlaceholders?: boolean;
  onAddressChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onStateSelect: (suggestion: PlaceSuggestion) => void;
  onCityChange: (value: string) => void;
  onCitySelect: (suggestion: PlaceSuggestion) => void;
  onLocationPatch: (next: Partial<EmployerRegisterLocationValues>) => void;
};

export function EmployerRegisterLocationFields({
  idPrefix,
  values,
  fieldErrors,
  addressCopy = "company",
  useSelectPlaceholders = false,
  onAddressChange,
  onStateChange,
  onStateSelect,
  onCityChange,
  onCitySelect,
  onLocationPatch,
}: EmployerRegisterLocationFieldsProps) {
  const t = useTranslate();
  const translateMessage = useAuthMessageTranslator();
  const addressId = `${idPrefix}-address`;
  const stateId = `${idPrefix}-state`;
  const cityId = `${idPrefix}-city`;
  const pincodeId = `${idPrefix}-pincode`;

  const handlePincodeChange = (pincode: string) => {
    const location = EMPLOYER_REGISTER_PINCODE_LOCATION_MAP[pincode];
    onLocationPatch({
      pincode,
      city: location?.city ?? values.city,
      state: location?.state ?? values.state,
    });
  };

  return (
    <>
      <div className="employer-register-form-stack">
        <RequiredFieldLabel
          htmlFor={addressId}
          required
          className="employer-register-form-label"
        >
          {t(
            addressCopy === "individual"
              ? "auth.employerRegister.individualAddress"
              : "auth.employerRegister.companyAddress",
          )}
        </RequiredFieldLabel>
        <textarea
          id={addressId}
          name="companyAddress"
          value={values.companyAddress}
          onChange={(event) => onAddressChange(event.target.value)}
          placeholder="#6-250, Kavuri Hills, Madhapur, Hyderabad, Telangana"
          rows={3}
          className="employer-register-form-textarea"
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.companyAddress)}
          aria-describedby={
            fieldErrors.companyAddress ? "companyAddress-error" : undefined
          }
        />
        <FieldError
          id="companyAddress-error"
          message={translateMessage(fieldErrors.companyAddress)}
        />
      </div>

      <div className="employer-register-form-row employer-register-form-row--three">
        <div className="employer-register-form-stack">
          <RequiredFieldLabel
            htmlFor={stateId}
            required
            className="employer-register-form-label"
          >
            {t("auth.employerRegister.state")}
          </RequiredFieldLabel>
          <EmployerRegisterPlaceAutocomplete
            id={stateId}
            name="state"
            mode="state"
            value={values.state}
            placeholder={
              useSelectPlaceholders
                ? t("auth.employerRegister.selectState")
                : t("auth.employerRegister.searchState")
            }
            aria-required
            aria-invalid={Boolean(fieldErrors.state)}
            aria-describedby={fieldErrors.state ? "state-error" : undefined}
            onChange={onStateChange}
            onSelect={onStateSelect}
          />
          <FieldError
            id="state-error"
            message={translateMessage(fieldErrors.state)}
          />
        </div>

        <div className="employer-register-form-stack">
          <RequiredFieldLabel
            htmlFor={cityId}
            required
            className="employer-register-form-label"
          >
            {t("auth.employerRegister.city")}
          </RequiredFieldLabel>
          <EmployerRegisterPlaceAutocomplete
            id={cityId}
            name="city"
            mode="city"
            value={values.city}
            selectedState={values.state}
            disabled={!values.state.trim()}
            placeholder={
              values.state.trim()
                ? useSelectPlaceholders
                  ? t("auth.employerRegister.selectCity")
                  : t("auth.employerRegister.searchCity")
                : t("auth.employerRegister.selectStateFirst")
            }
            aria-required
            aria-invalid={Boolean(fieldErrors.city)}
            aria-describedby={fieldErrors.city ? "city-error" : undefined}
            onChange={onCityChange}
            onSelect={onCitySelect}
          />
          <FieldError
            id="city-error"
            message={translateMessage(fieldErrors.city)}
          />
        </div>

        <EmployerRegisterSearchableSelect
          id={pincodeId}
          name="pincode"
          label={t("auth.employerRegister.pincode")}
          required
          allowCustom
          initialVisibleCount={5}
          value={values.pincode}
          placeholder={t("auth.employerRegister.selectPincode")}
          options={EMPLOYER_REGISTER_PINCODE_OPTIONS}
          onChange={handlePincodeChange}
          error={fieldErrors.pincode}
          errorId="pincode-error"
        />
      </div>
    </>
  );
}
