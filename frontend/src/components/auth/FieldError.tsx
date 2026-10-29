type FieldErrorProps = {
  id?: string;
  message?: string | null;
  className?: string;
};

/**
 * Accessible field-level error. Matches employer-register alert styling.
 */
export function FieldError({ id, message, className }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p
      id={id}
      role="alert"
      className={className ?? "text-sm font-medium text-red-600"}
    >
      {message}
    </p>
  );
}
