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
          "mb-3 flex size-11 items-center justify-center rounded-xl sm:mb-4 sm:size-12",
          workflowIconTileStyles[step.icon],
        )}
      >
        <WorkflowIcon icon={step.icon} />
      </div>

      <h3 className="text-sm font-bold sm:text-base">
        <span className="text-foreground">{step.stepNumber}. </span>
        <span className="text-primary">{step.title}</span>
      </h3>

      <p className="mt-2 max-w-[14rem] whitespace-pre-line text-xs leading-relaxed text-muted sm:text-sm">
        {step.description}
      </p>
    </article>
  );
}
