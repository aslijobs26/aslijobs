import { MessageCircle } from "lucide-react";

import { OperationsCard } from "../../ui/OperationsCard";

import type { WhatsAppActivityMetric } from "../../../types/operations-dashboard";



interface WhatsAppActivitySectionProps {

  metrics: WhatsAppActivityMetric[];

}



export function WhatsAppActivitySection({ metrics }: WhatsAppActivitySectionProps) {

  return (

    <OperationsCard title="WhatsApp Activity (Today)" className="min-w-0">

      <div className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-whatsapp/10 px-2.5 py-1.5 text-xs font-medium text-whatsapp">

        <MessageCircle className="size-3.5" aria-hidden="true" />

        Live channel

      </div>

      <dl className="grid grid-cols-2 gap-2">

        {metrics.map((metric) => (

          <div

            key={metric.id}

            className="rounded-lg border border-border-subtle bg-hero-bg/40 px-2.5 py-2"

          >

            <dt className="text-[11px] text-muted">{metric.label}</dt>

            <dd className="mt-0.5 text-base font-bold text-foreground">{metric.value}</dd>

            {metric.subLabel && (

              <p className="text-[10px] text-muted">{metric.subLabel}</p>

            )}

          </div>

        ))}

      </dl>

    </OperationsCard>

  );

}

