"use client";

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type RequiredFieldLabelProps = {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
  className?: string;
};

/**
 * Consistent required-field label: text + space + asterisk (when required).
 * Pass label text without an asterisk; this component adds it.
 */
export function RequiredFieldLabel({
  htmlFor,
  children,
  required = false,
  className,
}: RequiredFieldLabelProps) {
  return (
    <label htmlFor={htmlFor} className={cn(className)}>
      {children}
      {required ? (
        <>
          {" "}
          <span className="text-red-600" aria-hidden="true">
            *
          </span>
        </>
      ) : null}
    </label>
  );
}
