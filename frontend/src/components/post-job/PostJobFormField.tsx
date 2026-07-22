import { cn } from "@/utils/cn";
import type { ReactNode } from "react";
import { postJobFieldLabelClassName, postJobFieldStackClassName } from "./post-job-form-styles";

type PostJobFormFieldProps = {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
  error?: string;
};

export function PostJobFormField({
  id,
  label,
  children,
  className,
  error,
}: PostJobFormFieldProps) {
  return (
    <div className={cn(postJobFieldStackClassName, className)}>
      <label htmlFor={id} className={postJobFieldLabelClassName}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
