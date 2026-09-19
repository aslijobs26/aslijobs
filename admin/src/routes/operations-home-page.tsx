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

        {data.platformPulse.length > 0 ? (
          <PlatformPulseSection metrics={data.platformPulse} />
        ) : null}

        <OperationsOverviewSplit
          variant="command"
          className="gap-3.5 sm:gap-4"
          railClassName="gap-3.5"
          rail={
            <>
              {data.operationsHealth.length > 0 ? (
                <OperationsHealthSection items={data.operationsHealth} />
              ) : null}
              <OperationsCan module="team" action="read">
                <TeamWorkloadSection
                  members={data.teamWorkload}
                  status={data.teamWorkloadStatus}
                />
              </OperationsCan>
              {data.quickActions.length > 0 ? (
                <QuickActionsSection actions={data.quickActions} />
              ) : null}
            </>
          }
        >
          <div className="flex min-w-0 flex-col gap-3.5">
            {data.attentionItems.length > 0 ? (
              <WhatNeedsAttentionSection
                total={data.attentionItems.length}
                tabs={data.attentionTabs}
                items={data.attentionItems}
              />
            ) : null}
            <NewRegistrationsSection />
            {data.todaysActivity.length > 0 ? (
              <TodaysActivitySection metrics={data.todaysActivity} />
            ) : null}
            {data.insights.length > 0 ? (
              <AsliInsightsSection insights={data.insights} />
            ) : null}
          </div>
        </OperationsOverviewSplit>
      </div>
    </OperationsLayout>
  );
}
