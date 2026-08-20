import { Lightbulb, MessageCircle, Shield, Sparkles } from "lucide-react";

import { OperationsBadge } from "../../ui/OperationsBadge";

import { OperationsCard } from "../../ui/OperationsCard";

import type { AiNextBestAction } from "../../../types/operations-dashboard";

import { cn } from "../../../utils/cn";



const TONE_ICONS = {

  whatsapp: MessageCircle,

  insight: Lightbulb,

  compliance: Shield,

} as const;



const TONE_COLORS = {

  whatsapp: "text-whatsapp bg-whatsapp/10",

  insight: "text-warning bg-warning/10",

  compliance: "text-primary bg-primary-light",

} as const;



interface AiNextBestActionsSectionProps {

  actions: AiNextBestAction[];

}



export function AiNextBestActionsSection({ actions }: AiNextBestActionsSectionProps) {

  return (

    <OperationsCard

      title="AI Next Best Actions"

      badge={<OperationsBadge variant="beta">BETA</OperationsBadge>}

      className="min-w-0"

    >

      <ul className="space-y-2">

        {actions.slice(0, 3).map((action) => {

          const Icon = TONE_ICONS[action.tone];

          return (

            <li

              key={action.id}

              className="flex gap-2.5 rounded-lg border border-border-subtle bg-hero-bg/60 p-2.5"

            >

              <span

                className={cn(

                  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",

                  TONE_COLORS[action.tone],

                )}

              >

                <Icon className="size-3.5" aria-hidden="true" />

              </span>

              <div className="min-w-0">

                <p className="text-xs font-medium leading-snug text-foreground">

                  {action.title}

                </p>

                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">

                  {action.description}

                </p>

              </div>

            </li>

          );

        })}

      </ul>

      <button

        type="button"

        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-soft px-3 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"

      >

        <Sparkles className="size-4" aria-hidden="true" />

        Ask AI Assistant

      </button>

    </OperationsCard>

  );

}

