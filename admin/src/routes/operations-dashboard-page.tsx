import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { AiNextBestActionsSection } from "../components/operations/dashboard/AiNextBestActionsSection";
import { EscalationsOverviewSection } from "../components/operations/dashboard/EscalationsOverviewSection";
import { JourneyAlertsSection } from "../components/operations/dashboard/JourneyAlertsSection";
import { OperationsKpiStrip } from "../components/operations/dashboard/OperationsKpiStrip";
import { OperationsSnapshotSection } from "../components/operations/dashboard/OperationsSnapshotSection";
import { PriorityQueueSection } from "../components/operations/dashboard/PriorityQueueSection";
import { SlaPerformanceSection } from "../components/operations/dashboard/SlaPerformanceSection";
import { TeamWorkloadSection } from "../components/operations/dashboard/TeamWorkloadSection";
import { WhatsAppActivitySection } from "../components/operations/dashboard/WhatsAppActivitySection";
import { OPERATIONS_DASHBOARD_MOCK } from "../data/operations-dashboard.mock";
import { OperationsCan } from "../components/operations/auth/OperationsCan";

export function OperationsDashboardPage() {
  const data = OPERATIONS_DASHBOARD_MOCK;

  return (
    <OperationsLayout
      title="Operations Dashboard"
      subtitle="Real-time overview of hiring operations."
    >
      <div className="flex w-full min-w-0 flex-col gap-2 sm:gap-2.5">
        <OperationsKpiStrip metrics={data.kpis} />

        <div className="grid grid-cols-1 gap-2 xl:grid-cols-12 xl:gap-2.5">
          <div className="min-w-0 xl:col-span-6">
            <PriorityQueueSection items={data.priorityQueue} />
          </div>
          <div className="min-w-0 xl:col-span-3">
            <SlaPerformanceSection
              overall={data.slaOverall}
              target={data.slaTarget}
              categories={data.slaCategories}
            />
          </div>
          <div className="min-w-0 xl:col-span-3">
            <AiNextBestActionsSection actions={data.aiActions} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4 xl:gap-2.5">
          <OperationsCan module="journey_alerts" action="read">
            <JourneyAlertsSection alerts={data.journeyAlerts} />
          </OperationsCan>
          <OperationsCan module="whatsapp" action="read">
            <WhatsAppActivitySection metrics={data.whatsappActivity} />
          </OperationsCan>
          <OperationsCan module="team" action="read">
            <TeamWorkloadSection members={data.teamWorkload} />
          </OperationsCan>
          <OperationsCan module="escalations" action="read">
            <EscalationsOverviewSection items={data.escalations} />
          </OperationsCan>
        </div>

        <OperationsSnapshotSection metrics={data.snapshot} />
      </div>
    </OperationsLayout>
  );
}
