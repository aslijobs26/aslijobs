import { useMemo, useState } from "react";

import { OperationsAvatar } from "../../ui/OperationsAvatar";

import { OperationsBadge } from "../../ui/OperationsBadge";

import { OperationsCard } from "../../ui/OperationsCard";

import { PRIORITY_QUEUE_TAB_COUNTS } from "../../../data/operations-dashboard.mock";

import type {
  EntityType,
  PriorityQueueItem,
} from "../../../types/operations-dashboard";

import { cn } from "../../../utils/cn";



type QueueTab = "all" | "high" | "medium" | "low";



const TABS: { id: QueueTab; label: string; count: number }[] = [

  { id: "all", label: "All", count: PRIORITY_QUEUE_TAB_COUNTS.all },

  { id: "high", label: "High", count: PRIORITY_QUEUE_TAB_COUNTS.high },

  { id: "medium", label: "Medium", count: PRIORITY_QUEUE_TAB_COUNTS.medium },

  { id: "low", label: "Low", count: PRIORITY_QUEUE_TAB_COUNTS.low },

];



function entityBadgeVariant(type: EntityType) {

  if (type === "employer") return "employer";

  if (type === "candidate") return "candidate";

  if (type === "job") return "job";

  if (type === "verification") return "verification";

  return "support";

}



function formatSla(minutes: number) {

  if (minutes < 60) return `${minutes}m left`;

  const hours = Math.floor(minutes / 60);

  const mins = minutes % 60;

  return mins > 0 ? `${hours}h ${mins}m left` : `${hours}h left`;

}



interface PriorityQueueSectionProps {

  items: PriorityQueueItem[];

}



export function PriorityQueueSection({ items }: PriorityQueueSectionProps) {

  const [activeTab, setActiveTab] = useState<QueueTab>("all");



  const filteredItems = useMemo(() => {

    if (activeTab === "all") return items;

    return items.filter((item) => item.priority === activeTab);

  }, [activeTab, items]);



  return (

    <OperationsCard

      title="Today's Priority Queue"

      className="min-w-0"

      bodyClassName="p-0 sm:p-0"

      action={

        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Priority filters">

          {TABS.map((tab) => (

            <button

              key={tab.id}

              type="button"

              role="tab"

              aria-selected={activeTab === tab.id}

              onClick={() => setActiveTab(tab.id)}

              className={cn(

                "rounded-md px-2 py-1 text-[11px] font-medium transition-colors sm:text-xs",

                activeTab === tab.id

                  ? "bg-primary-soft text-surface"

                  : "bg-hero-bg text-muted hover:text-foreground",

              )}

            >

              {tab.label} ({tab.count})

            </button>

          ))}

        </div>

      }

    >

      <div className="overflow-x-auto overscroll-x-contain scrollbar-hidden">

        <table className="w-full min-w-[640px] border-collapse text-left text-xs">

          <thead>

            <tr className="border-b border-border-subtle bg-hero-bg/50 text-muted">

              <th className="px-3 py-2 font-medium">ID</th>

              <th className="px-3 py-2 font-medium">Type</th>

              <th className="px-3 py-2 font-medium">Customer</th>

              <th className="px-3 py-2 font-medium">Task</th>

              <th className="px-3 py-2 font-medium">Priority</th>

              <th className="px-3 py-2 font-medium">Lang</th>

              <th className="px-3 py-2 font-medium">Assigned</th>

              <th className="px-3 py-2 font-medium">SLA</th>

            </tr>

          </thead>

          <tbody>

            {filteredItems.map((item) => (

              <tr

                key={item.id}

                className="border-b border-border-subtle last:border-0 hover:bg-hero-bg/40"

              >

                <td className="whitespace-nowrap px-3 py-2 font-medium text-foreground">

                  {item.id}

                </td>

                <td className="px-3 py-2">

                  <OperationsBadge variant={entityBadgeVariant(item.type)}>

                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}

                  </OperationsBadge>

                </td>

                <td className="max-w-[7rem] truncate px-3 py-2 text-foreground">

                  {item.customer}

                </td>

                <td className="max-w-[9rem] truncate px-3 py-2 text-muted">

                  {item.task}

                </td>

                <td className="px-3 py-2">

                  <OperationsBadge variant={item.priority}>

                    {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}

                  </OperationsBadge>

                </td>

                <td className="px-3 py-2 text-muted">{item.language}</td>

                <td className="px-3 py-2">

                  {item.assignedTo ? (

                    <span className="inline-flex items-center gap-1.5">

                      <OperationsAvatar initials={item.assignedTo.initials} />

                      <span className="max-w-[4rem] truncate text-muted">

                        {item.assignedTo.name}

                      </span>

                    </span>

                  ) : (

                    <span className="text-warning">Unassigned</span>

                  )}

                </td>

                <td

                  className={cn(

                    "whitespace-nowrap px-3 py-2 font-medium",

                    item.slaRemainingMinutes <= 30 ? "text-danger" : "text-foreground",

                  )}

                >

                  {formatSla(item.slaRemainingMinutes)}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </OperationsCard>

  );

}

