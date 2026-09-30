import { cn } from "@/utils/cn";
import { Check, Clock3, FileText, type LucideIcon } from "lucide-react";

type VerificationStepState = "completed" | "current" | "upcoming";

type VerificationStep = {
  id: string;
  label: string;
  description: string;
  status: string;
  state: VerificationStepState;
  icon: LucideIcon;
};

const VERIFICATION_STEPS: readonly VerificationStep[] = [
  {
    id: "profile",
    label: "Step 1",
    description: "Profile Information",
    status: "Completed",
    state: "completed",
    icon: Check,
  },
  {
    id: "review",
    label: "Step 2",
    description: "Verification Review",
    status: "Under Review",
    state: "current",
    icon: Clock3,
  },
  {
    id: "publish",
    label: "Step 3",
    description: "Post & Publish Jobs",
    status: "Available after verification",
    state: "upcoming",
    icon: FileText,
  },
];

const STEP_CIRCLE_CLASS: Record<VerificationStepState, string> = {
  completed: "bg-primary text-surface ring-primary",
  current: "bg-surface text-amber-700 ring-amber-300",
  upcoming: "bg-surface text-muted ring-border",
};

const STEP_STATUS_CLASS: Record<VerificationStepState, string> = {
  completed: "bg-primary-light text-primary",
  current: "bg-amber-100 text-amber-800",
  upcoming: "bg-border-subtle text-muted",
};

export function EmployerVerificationReviewBanner() {
  return (
    <section
      className="mt-4 overflow-hidden rounded-xl border border-amber-200 bg-amber-50/80 shadow-sm"
      aria-labelledby="profile-verification-review-title"
      aria-live="polite"
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-amber-700 ring-1 ring-amber-200 sm:size-12">
            <Clock3 className="size-5 sm:size-6" strokeWidth={2} aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="profile-verification-review-title"
                className="text-base font-bold text-foreground sm:text-lg"
              >
                Account Verification — Under Review
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                <span
                  className="size-1.5 rounded-full bg-amber-500"
                  aria-hidden="true"
                />
                Pending Verification
              </span>
            </div>

            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Your account is currently under review by our Operations team.
              You can complete and save your profile information, but
              submitting or publishing jobs will be available after your
              account is verified.
            </p>
          </div>
        </div>

        <ol
          className="mt-5 grid grid-cols-3 sm:mt-6"
          aria-label="Verification progress"
        >
          {VERIFICATION_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === VERIFICATION_STEPS.length - 1;

            return (
              <li
                key={step.id}
                className="relative flex min-w-0 flex-col items-center px-1 text-center"
                aria-current={step.state === "current" ? "step" : undefined}
              >
                {isLast ? null : (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-[1.125rem] left-1/2 w-full sm:top-5",
                      step.state === "completed"
                        ? "h-0.5 -translate-y-1/2 bg-primary"
                        : "-translate-y-1/2 border-t-2 border-dashed border-border",
                    )}
                  />
                )}

                <span
                  className={cn(
                    "relative z-10 inline-flex size-9 items-center justify-center rounded-full ring-2 sm:size-10",
                    STEP_CIRCLE_CLASS[step.state],
                  )}
                >
                  <Icon
                    className="size-4 sm:size-5"
                    strokeWidth={step.state === "completed" ? 3 : 2}
                    aria-hidden="true"
                  />
                </span>

                <span className="mt-2 text-xs font-bold text-foreground sm:text-sm">
                  {step.label}
                </span>
                <span className="mt-0.5 break-words text-[0.6875rem] leading-snug text-muted sm:text-sm">
                  {step.description}
                </span>
                <span
                  className={cn(
                    "mt-1.5 inline-flex max-w-full items-center justify-center rounded-full px-2 py-0.5 text-[0.625rem] leading-tight font-semibold break-words sm:px-2.5 sm:text-xs",
                    STEP_STATUS_CLASS[step.state],
                  )}
                >
                  {step.status}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
