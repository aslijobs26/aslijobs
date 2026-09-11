import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsOverviewSplit } from "../components/operations/layout/OperationsOverviewSplit";
import { AsliInsightsSection } from "../components/operations/dashboard/AsliInsightsSection";
import { DashboardGreetingSection } from "../components/operations/dashboard/DashboardGreetingSection";
import { NewRegistrationsSection } from "../components/operations/dashboard/NewRegistrationsSection";
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

        <OperationsOverviewSplit
          variant="command"
          className="gap-3.5 sm:gap-4"
          railClassName="gap-3.5"
          rail={
            <>
              <OperationsHealthSection items={data.operationsHealth} />
              <OperationsCan module="team" action="read">
                <TeamWorkloadSection
                  members={data.teamWorkload}
                  status={data.teamWorkloadStatus}
                />
              </OperationsCan>
              <QuickActionsSection actions={data.quickActions} />
            </>
          }
        >
          <div className="flex min-w-0 flex-col gap-3.5">
            <WhatNeedsAttentionSection
              total={data.attentionTotal}
              tabs={data.attentionTabs}
              items={data.attentionItems}
            />
            <NewRegistrationsSection />
            <TodaysActivitySection metrics={data.todaysActivity} />
            <AsliInsightsSection insights={data.insights} />
          </div>
        </OperationsOverviewSplit>
      </div>
    </OperationsLayout>
  );
}
