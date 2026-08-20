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

export function OperationsDashboardPage() {
  const data = OPERATIONS_DASHBOARD_MOCK;

  return (
    <OperationsLayout
      title="Operations Dashboard"
      subtitle="Real-time overview of hiring operations."
    >
      <div className="flex w-full min-w-0 flex-col gap-3 sm:gap-4">
        <OperationsKpiStrip metrics={data.kpis} />

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12 xl:gap-4">
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

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 xl:gap-4">
          <JourneyAlertsSection alerts={data.journeyAlerts} />
          <WhatsAppActivitySection metrics={data.whatsappActivity} />
          <TeamWorkloadSection members={data.teamWorkload} />
          <EscalationsOverviewSection items={data.escalations} />
        </div>

        <OperationsSnapshotSection metrics={data.snapshot} />
      </div>
    </OperationsLayout>
  );
}
