import type {
  WorkflowIconKey,
  WorkflowStep as WorkflowStepType,
} from "@/types/trust-resources";
import { cn } from "@/utils/cn";
import { WorkflowIcon } from "./workflow-icons";

const workflowIconTileStyles: Record<WorkflowIconKey, string> = {
  whatsapp: "bg-workflow-mint-surface",
  language: "bg-workflow-neutral-surface text-primary",
  search: "bg-workflow-mint-alt-surface text-primary",
  apply: "bg-workflow-neutral-surface text-primary",
};

type WorkflowStepProps = {
  step: WorkflowStepType;
};

export function WorkflowStep({ step }: WorkflowStepProps) {
  return (
    <article className="flex min-w-0 flex-col items-center text-center">
      <div
        className={cn(
          "mb-2.5 flex size-10 items-center justify-center rounded-lg sm:mb-4 sm:size-12 sm:rounded-xl",
          workflowIconTileStyles[step.icon],
        )}
      >
        <WorkflowIcon icon={step.icon} />
      </div>

      <h3 className="text-xs font-bold leading-snug sm:text-base">
        <span className="text-foreground">{step.stepNumber}. </span>
        <span className="text-primary">{step.title}</span>
      </h3>

      <p className="mt-1.5 max-w-[11.5rem] whitespace-pre-line text-[0.6875rem] leading-relaxed text-muted sm:mt-2 sm:max-w-[14rem] sm:text-sm">
        {step.description}
      </p>
    </article>
  );
}
