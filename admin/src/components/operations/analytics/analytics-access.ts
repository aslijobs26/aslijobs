/** Analytics view and export require reports access. Job view and job export do not. */
export function canAccessOperationsAnalytics(input: {
  isSuperAdmin: boolean;
  reportsRead: boolean;
  reportsView: boolean;
}): boolean {
  return input.isSuperAdmin || input.reportsRead || input.reportsView;
}
