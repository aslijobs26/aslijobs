import type {
  OperationsVerificationOverviewKpi,
  OperationsVerificationsOverviewKpis,
} from "../types/operations-verifications";

export interface VerificationOverviewKpiView {
  label: string;
  emptyMessage: string;
  valueKey: keyof Pick<
    OperationsVerificationsOverviewKpis,
    | "totalVerifications"
    | "pendingReview"
    | "verifiedEmployers"
    | "needsAttention"
    | "rejected"
  >;
  trendKey: keyof Pick<
    OperationsVerificationsOverviewKpis,
    | "totalVerificationsTrendPercent"
    | "pendingReviewTrendPercent"
    | "verifiedEmployersTrendPercent"
    | "needsAttentionTrendPercent"
    | "rejectedTrendPercent"
  >;
  captionKey: keyof Pick<
    OperationsVerificationsOverviewKpis,
    | "totalVerificationsCaption"
    | "pendingReviewCaption"
    | "verifiedEmployersCaption"
    | "needsAttentionCaption"
    | "rejectedCaption"
  >;
}

export const VERIFICATION_OVERVIEW_KPI_VIEWS: Record<
  OperationsVerificationOverviewKpi,
  VerificationOverviewKpiView
> = {
  total: {
    label: "Total Verifications",
    emptyMessage: "No verification submissions found.",
    valueKey: "totalVerifications",
    trendKey: "totalVerificationsTrendPercent",
    captionKey: "totalVerificationsCaption",
  },
  pending: {
    label: "Pending Review",
    emptyMessage: "No verifications pending review.",
    valueKey: "pendingReview",
    trendKey: "pendingReviewTrendPercent",
    captionKey: "pendingReviewCaption",
  },
  verified: {
    label: "Verified Employers",
    emptyMessage: "No verified employers found.",
    valueKey: "verifiedEmployers",
    trendKey: "verifiedEmployersTrendPercent",
    captionKey: "verifiedEmployersCaption",
  },
  needs_attention: {
    label: "Needs Attention",
    emptyMessage: "No verifications need attention.",
    valueKey: "needsAttention",
    trendKey: "needsAttentionTrendPercent",
    captionKey: "needsAttentionCaption",
  },
  rejected: {
    label: "Rejected",
    emptyMessage: "No rejected verifications found.",
    valueKey: "rejected",
    trendKey: "rejectedTrendPercent",
    captionKey: "rejectedCaption",
  },
};
