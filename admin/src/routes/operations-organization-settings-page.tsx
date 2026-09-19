import { useEffect, useState } from "react";
import { OrganizationTabs } from "../components/operations/organization/OrganizationTabs";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsCan } from "../components/operations/auth/OperationsCan";
import { OperationsFilterSelect } from "../components/operations/jobs/OperationsFilterSelect";
import { getOperationsApiErrorMessage } from "../components/operations/team/team-format";
import { useOperationsPermissions } from "../hooks/use-operations-permissions";
import {
  useOperationsOrganizationSettings,
  useUpdateOperationsOrganizationSettings,
} from "../hooks/use-operations-organization-settings";

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "UTC",
  "America/New_York",
  "Europe/London",
];

export function OperationsOrganizationSettingsPage() {
  const { can } = useOperationsPermissions();
  const settingsQuery = useOperationsOrganizationSettings();
  const updateMutation = useUpdateOperationsOrganizationSettings();
  const [organizationName, setOrganizationName] = useState("");
  const [defaultCountryId, setDefaultCountryId] = useState("");
  const [defaultTimezone, setDefaultTimezone] = useState("Asia/Kolkata");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const data = settingsQuery.data;
    if (!data) return;
    setOrganizationName(data.organizationName);
    setDefaultCountryId(data.defaultCountryId ?? "");
    setDefaultTimezone(data.defaultTimezone || "Asia/Kolkata");
  }, [settingsQuery.data]);

  const save = async () => {
    if (!settingsQuery.data) return;
    setError("");
    setSuccess("");
    try {
      await updateMutation.mutateAsync({
        organizationName: organizationName.trim(),
        defaultCountryId,
        defaultTimezone,
        expectedRevision: settingsQuery.data.revision,
      });
      setSuccess("Organization settings saved.");
    } catch (caught) {
      setError(
        getOperationsApiErrorMessage(caught, "Unable to save settings."),
      );
    }
  };

  return (
    <OperationsLayout
      title="Settings"
      subtitle="Organization display name, default country and timezone."
    >
      <div className="flex flex-col gap-4">
        <OrganizationTabs />
        {settingsQuery.isError ? (
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <p>
              {getOperationsApiErrorMessage(
                settingsQuery.error,
                "Unable to load settings.",
              )}
            </p>
            <button
              type="button"
              className="mt-2 text-xs font-semibold underline"
              onClick={() => void settingsQuery.refetch()}
            >
              Retry
            </button>
          </div>
        ) : settingsQuery.isPending ? (
          <div className="h-48 animate-pulse rounded-xl border border-border-subtle bg-surface" />
        ) : (
          <form
            className="max-w-xl space-y-4 rounded-xl border border-border-subtle bg-surface p-4 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <label className="grid gap-1 text-xs font-semibold text-muted">
              Organization display name
              <input
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                disabled={!can("settings", "update")}
                className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-70"
              />
            </label>
            <div className="grid gap-1.5">
              <p className="text-xs font-semibold text-muted">Default country</p>
              <OperationsFilterSelect
                label="Default country"
                value={defaultCountryId}
                options={(settingsQuery.data?.countries ?? []).map((country) => ({
                  value: country.id,
                  label: country.name,
                }))}
                onChange={setDefaultCountryId}
                hideSearch
                triggerClassName="h-9"
              />
            </div>
            <div className="grid gap-1.5">
              <p className="text-xs font-semibold text-muted">Default timezone</p>
              <OperationsFilterSelect
                label="Default timezone"
                value={defaultTimezone}
                options={TIMEZONES.map((zone) => ({ value: zone, label: zone }))}
                onChange={setDefaultTimezone}
                hideSearch
                triggerClassName="h-9"
              />
            </div>
            {error ? (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="text-sm text-success" role="status">
                {success}
              </p>
            ) : null}
            <OperationsCan module="settings" action="update">
              <button
                type="submit"
                disabled={
                  updateMutation.isPending ||
                  !organizationName.trim() ||
                  !defaultCountryId
                }
                className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover disabled:opacity-60"
              >
                {updateMutation.isPending ? "Saving…" : "Save settings"}
              </button>
            </OperationsCan>
          </form>
        )}
      </div>
    </OperationsLayout>
  );
}
