import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { AsliInsightsSection } from "../components/operations/dashboard/AsliInsightsSection";
import { DashboardGreetingSection } from "../components/operations/dashboard/DashboardGreetingSection";
import { OperationsHealthSection } from "../components/operations/dashboard/OperationsHealthSection";
import { PlatformPulseSection } from "../components/operations/dashboard/PlatformPulseSection";
import { QuickActionsSection } from "../components/operations/dashboard/QuickActionsSection";
import { TeamWorkloadSection } from "../components/operations/dashboard/TeamWorkloadSection";
import { TodaysActivitySection } from "../components/operations/dashboard/TodaysActivitySection";
import { WhatNeedsAttentionSection } from "../components/operations/dashboard/WhatNeedsAttentionSection";
import { OperationsCan } from "../components/operations/auth/OperationsCan";
import { useOperationsDashboardData } from "../hooks/use-operations-dashboard-data";

/**
 * ASLI OS Home / Command Center — XL layout matches the product reference:
 * greeting + Ask ASLI, pulse strip, then left workspace + right intelligence column.
 */
export function OperationsHomePage() {
  const data = useOperationsDashboardData();

  return (
    <OperationsLayout
      title="Home"
      subtitle="Command center"
      headerVariant="command"
    >
      <div className="operations-home-command flex w-full min-w-0 flex-col gap-3.5 sm:gap-4">
        <DashboardGreetingSection />

        <PlatformPulseSection metrics={data.platformPulse} />

        <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-12 xl:items-start xl:gap-4">
          <div className="flex min-w-0 flex-col gap-3.5 xl:col-span-8">
            <WhatNeedsAttentionSection
              total={data.attentionTotal}
              tabs={data.attentionTabs}
              items={data.attentionItems}
            />
            <TodaysActivitySection metrics={data.todaysActivity} />
            <AsliInsightsSection insights={data.insights} />
          </div>

          <div className="flex min-w-0 flex-col gap-3.5 xl:col-span-4">
            <OperationsHealthSection items={data.operationsHealth} />
            <OperationsCan module="team" action="read">
              <TeamWorkloadSection
                members={data.teamWorkload}
                status={data.teamWorkloadStatus}
              />
            </OperationsCan>
            <QuickActionsSection actions={data.quickActions} />
          </div>
        </div>
      </div>
    </OperationsLayout>
  );
}
