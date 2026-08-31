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
    <div className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
        <Activity className="size-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">
          Account Activity & History
        </h3>
      </div>

      <div className="mt-4 space-y-4">
        {events.map((evt, idx) => {
          const Icon = evt.icon;
          return (
            <div key={idx} className="flex items-start gap-3 text-xs">
              <span
                className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${evt.iconBg} ${evt.iconColor}`}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-foreground">{evt.title}</h4>
                  <span className="text-[11px] text-muted">{evt.date}</span>
                </div>
                <p className="mt-0.5 text-muted">{evt.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
