import { Activity, CheckCircle2, Clock, ShieldCheck, UserCheck } from "lucide-react";
import type { OperationsEmployerDetail } from "../../../../types/operations-employers";

interface EmployerActivityPanelProps {
  employer: OperationsEmployerDetail;
}

export function EmployerActivityPanel({ employer }: EmployerActivityPanelProps) {
  const events = [
    {
      title: "Employer Account Registered",
      description: `Account created for ${employer.displayName} with phone ${employer.phone || "—"}.`,
      date: `${employer.registeredAtDate} ${employer.registeredAtTime}`,
      icon: UserCheck,
      iconColor: "text-primary",
      iconBg: "bg-primary-light",
    },
    ...(employer.verifiedAt
      ? [
          {
            title: "Verification Status Updated",
            description: `Employer was verified by Operations. Remarks: ${
              employer.verificationRemarks || "Verification approved."
            }`,
            date: employer.verifiedAtDate,
            icon: ShieldCheck,
            iconColor: "text-success",
            iconBg: "bg-success/10",
          },
        ]
      : []),
    ...(employer.status === "suspended"
      ? [
          {
            title: "Account Suspended",
            description: `Account was suspended. Reason: ${
              employer.suspensionReason || "Suspended by Operations."
            }`,
            date: "Recent",
            icon: Clock,
            iconColor: "text-danger",
            iconBg: "bg-danger/10",
          },
        ]
      : []),
    ...(employer.lastLoginAt
      ? [
          {
            title: "Last Employer Login",
            description: "Employer logged in to AsliJobs employer portal.",
            date: new Date(employer.lastLoginAt).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            icon: CheckCircle2,
            iconColor: "text-chart-accent",
            iconBg: "bg-chart-accent/10",
          },
        ]
      : []),
  ];

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm max-sm:rounded-lg max-sm:p-2 sm:p-4 lg:p-5">
      <div className="flex items-center gap-1.5 border-b border-border-subtle pb-2 max-sm:pb-1.5 sm:gap-2 sm:pb-3">
        <Activity className="size-3.5 text-primary sm:size-4" />
        <h3 className="text-[12px] font-bold text-foreground sm:text-sm">
          Account Activity & History
        </h3>
      </div>

      <div className="mt-2.5 space-y-3 max-sm:mt-2 max-sm:space-y-2.5 sm:mt-4 sm:space-y-4">
        {events.map((evt, idx) => {
          const Icon = evt.icon;
          return (
            <div
              key={idx}
              className="flex items-start gap-2 text-[11px] max-sm:gap-2 sm:gap-3 sm:text-xs"
            >
              <span
                className={`inline-flex size-7 shrink-0 items-center justify-center rounded-md sm:size-8 sm:rounded-lg ${evt.iconBg} ${evt.iconColor}`}
              >
                <Icon className="size-3.5 sm:size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                  <h4 className="font-semibold text-foreground">{evt.title}</h4>
                  <span className="text-[10px] text-muted sm:text-[11px]">
                    {evt.date}
                  </span>
                </div>
                <p className="mt-0.5 leading-snug text-muted">{evt.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
