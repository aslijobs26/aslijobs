import { cn } from "@/utils/cn";
import type { ReactNode } from "react";
import { postJobFieldLabelClassName, postJobFieldStackClassName } from "./post-job-form-styles";

type PostJobFormFieldProps = {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
};

export function PostJobFormField({
  id,
  label,
  children,
  className,
}: PostJobFormFieldProps) {
  return (
    <div className={cn(postJobFieldStackClassName, className)}>
      <label htmlFor={id} className={postJobFieldLabelClassName}>
        {label}
      </label>
      {children}
    </div>
  );
}
