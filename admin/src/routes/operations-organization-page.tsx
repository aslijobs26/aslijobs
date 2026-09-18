import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { OrganizationHierarchyPanel } from "../components/operations/organization/OrganizationHierarchyPanel";
import { OrganizationPageHeader } from "../components/operations/organization/OrganizationPageHeader";
import { OrganizationTabs } from "../components/operations/organization/OrganizationTabs";
import { OrganizationUnitDetail } from "../components/operations/organization/OrganizationUnitDetail";
import { OrganizationUnitFormDialog } from "../components/operations/organization/OrganizationUnitFormDialog";
import {
  findOrgNodeById,
  flattenOrgTree,
} from "../components/operations/organization/org-tree-utils";
import { resolveIndiaStateLabel } from "../components/operations/employers/overview/india-state-normalize";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { getOperationsApiErrorMessage } from "../components/operations/team/team-format";
import {
  useCreateOperationsOrgSubUnit,
  useCreateOperationsOrgUnit,
  useOperationsOrgOverview,
  useOperationsOrgPeople,
  useOperationsOrgTree,
  useUpdateOperationsOrgUnit,
} from "../hooks/use-operations-organization";
import {
  ORG_UNIT_CHILD_TYPES,
  OPERATIONS_ORG_UNIT_TYPES,
  type CreateOperationsOrgUnitInput,
  type OperationsOrgUnitDetailTab,
  type OperationsOrgUnitType,
  type UpdateOperationsOrgUnitInput,
} from "../types/operations-organization";
import {
  prefetchIndiaStateDistrictMaps,
  SOUTH_INDIA_DISTRICT_PREFETCH_LABELS,
} from "../utils/india-state-districts";

type DialogState =
  | { mode: "create" }
  | { mode: "create-sub" }
  | { mode: "edit" }
  | null;

export function OperationsOrganizationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedUnitId = searchParams.get("unit");

  const [headerSearch, setHeaderSearch] = useState("");
  const [scopeId, setScopeId] = useState("");
  const [scopeInitialized, setScopeInitialized] = useState(false);
  const [unitInitialized, setUnitInitialized] = useState(false);
  const [detailTab, setDetailTab] =
    useState<OperationsOrgUnitDetailTab>("overview");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [locationHint, setLocationHint] = useState<string | null>(null);

  const treeQuery = useOperationsOrgTree({
    search: headerSearch.trim() || undefined,
    scopeId: scopeId || undefined,
    status: "active",
  });

  const roots = treeQuery.data?.roots ?? [];
  const selectedNode = selectedUnitId
    ? findOrgNodeById(roots, selectedUnitId)
    : null;

  const overviewQuery = useOperationsOrgOverview(selectedUnitId, {
    enabled: Boolean(selectedUnitId),
  });
  const peopleQuery = useOperationsOrgPeople(selectedUnitId, {
    page: 1,
    limit: 20,
    enabled: Boolean(selectedUnitId) && detailTab === "people",
  });

  const createMutation = useCreateOperationsOrgUnit();
  const createSubMutation = useCreateOperationsOrgSubUnit();
  const updateMutation = useUpdateOperationsOrgUnit();

  const setUnitParam = useCallback(
    (unitId: string | null) => {
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);
          params.delete("tab");
          if (unitId) params.set("unit", unitId);
          else params.delete("unit");
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Warm district maps so state clicks render from cache immediately.
  useEffect(() => {
    prefetchIndiaStateDistrictMaps([...SOUTH_INDIA_DISTRICT_PREFETCH_LABELS]);
  }, []);

  useEffect(() => {
    if (roots.length === 0) return;
    const labels = flattenOrgTree(roots)
      .filter((node) => node.type === "state")
      .map((node) => resolveIndiaStateLabel(node.name) ?? node.name);
    prefetchIndiaStateDistrictMaps(labels);
  }, [roots]);

  useEffect(() => {
    if (scopeInitialized) return;
    if (treeQuery.isPending) return;
    if (roots.length === 0) {
      setScopeInitialized(true);
      return;
    }

    const southIndia = flattenOrgTree(roots).find(
      (node) =>
        node.type === "region" &&
        node.name.trim().toLowerCase() === "south india",
    );
    if (southIndia) {
      setScopeId(southIndia.id);
    }
    setScopeInitialized(true);
  }, [roots, scopeInitialized, treeQuery.isPending]);

  // After South India scope is applied, default-select Telangana (not the region root).
  useEffect(() => {
    if (unitInitialized) return;
    if (!scopeInitialized) return;
    if (treeQuery.isPending || treeQuery.isFetching) return;
    if (roots.length === 0) {
      setUnitInitialized(true);
      return;
    }

    const flat = flattenOrgTree(roots);
    const telangana = flat.find(
      (node) =>
        node.type === "state" &&
        node.name.trim().toLowerCase() === "telangana",
    );
    const existing = selectedUnitId
      ? findOrgNodeById(roots, selectedUnitId)
      : null;

  // Keep an explicit unit from the URL, including country/region/global.
    if (existing) {
      setUnitInitialized(true);
      return;
    }

    const preferred =
      telangana ??
      flat.find(
        (node) =>
          node.type === "region" &&
          node.name.trim().toLowerCase() === "south india",
      ) ??
      flat.find((node) => node.type === "global") ??
      roots[0];

    if (preferred && preferred.id !== selectedUnitId) {
      setUnitParam(preferred.id);
    }
    setUnitInitialized(true);
  }, [
    roots,
    scopeInitialized,
    selectedUnitId,
    setUnitParam,
    treeQuery.isFetching,
    treeQuery.isPending,
    unitInitialized,
  ]);

  const selectedUnit = overviewQuery.data?.unit ?? selectedNode ?? null;

  const canAddSubUnit = useMemo(() => {
    if (!selectedUnit) return false;
    const type = selectedUnit.type as OperationsOrgUnitType;
    if (!OPERATIONS_ORG_UNIT_TYPES.includes(type)) return false;
    return ORG_UNIT_CHILD_TYPES[type].length > 0;
  }, [selectedUnit]);

  const parentForDialog =
    dialog?.mode === "create-sub" ? selectedUnit : null;
  const unitForDialog = dialog?.mode === "edit" ? selectedUnit : null;

  const handleCreate = async (input: CreateOperationsOrgUnitInput) => {
    if (dialog?.mode === "create-sub" && selectedUnitId) {
      const { parentId: _parentId, ...rest } = input;
      await createSubMutation.mutateAsync({
        parentId: selectedUnitId,
        input: rest,
      });
      return;
    }
    await createMutation.mutateAsync(input);
  };

  const handleUpdate = async (input: UpdateOperationsOrgUnitInput) => {
    if (!selectedUnitId) return;
    await updateMutation.mutateAsync({ unitId: selectedUnitId, input });
  };

  const handleArchive = async () => {
    if (!selectedUnitId || !selectedUnit) return;
    await updateMutation.mutateAsync({
      unitId: selectedUnitId,
      input: {
        status: "archived",
        revision: selectedUnit.revision,
      },
    });
  };

  const treeError = treeQuery.isError
    ? getOperationsApiErrorMessage(
        treeQuery.error,
        "Unable to load organization tree.",
      )
    : null;

  const overviewError = overviewQuery.isError
    ? getOperationsApiErrorMessage(
        overviewQuery.error,
        "Unable to load overview.",
      )
    : null;

  return (
    <OperationsLayout
      title="Organization"
      subtitle="Manage ASLI's global structure, teams, people, roles and locations."
      headerVariant="command"
    >
      <div className="space-y-3">
        <OrganizationPageHeader
          scopeId={scopeId}
          onScopeChange={setScopeId}
          search={headerSearch}
          onSearchChange={setHeaderSearch}
          roots={roots}
          onAddUnit={() => setDialog({ mode: "create" })}
          onAddSubUnit={() => setDialog({ mode: "create-sub" })}
          canAddSubUnit={canAddSubUnit}
        />

        <OrganizationTabs />

        <div className="grid gap-3 xl:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
          <OrganizationHierarchyPanel
            roots={roots}
            selectedUnitId={selectedUnitId}
            onSelect={(unitId) => {
              setDetailTab("overview");
              setLocationHint(null);
              setUnitParam(unitId);
            }}
            search={headerSearch}
            isLoading={treeQuery.isPending}
            errorMessage={treeError}
          />
          <OrganizationUnitDetail
            unit={selectedUnit}
            overview={overviewQuery.data ?? null}
            people={peopleQuery.data ?? null}
            detailTab={detailTab}
            onDetailTabChange={setDetailTab}
            isOverviewLoading={overviewQuery.isPending}
            isPeopleLoading={peopleQuery.isPending}
            overviewError={overviewError}
            onEdit={() => setDialog({ mode: "edit" })}
            onAddSubUnit={() => setDialog({ mode: "create-sub" })}
            onArchive={() => {
              void handleArchive();
            }}
            canAddSubUnit={canAddSubUnit}
            emptyMessage={
              treeQuery.isPending
                ? "Loading organization…"
                : "Select a unit from the hierarchy to view details."
            }
            onSelectNamedLocation={(name, kind) => {
              const flat = flattenOrgTree(roots);
              const wantedType = kind === "district" ? "city" : "state";
              const match = flat.find(
                (node) =>
                  node.type === wantedType &&
                  node.name.trim().toLowerCase() === name.trim().toLowerCase(),
              );
              if (match) {
                setLocationHint(null);
                setDetailTab("overview");
                setUnitParam(match.id);
                return;
              }
              if (kind === "district") {
                setLocationHint(
                  "Create this city as an organization location to manage teams and people here.",
                );
              }
            }}
            locationHint={locationHint}
          />
        </div>
      </div>

      <OrganizationUnitFormDialog
        open={dialog != null}
        mode={dialog?.mode ?? "create"}
        parentUnit={parentForDialog}
        unit={unitForDialog}
        isSubmitting={
          createMutation.isPending ||
          createSubMutation.isPending ||
          updateMutation.isPending
        }
        onClose={() => setDialog(null)}
        onSubmitCreate={handleCreate}
        onSubmitUpdate={handleUpdate}
      />
    </OperationsLayout>
  );
}
