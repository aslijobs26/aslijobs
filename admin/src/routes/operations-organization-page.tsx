import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { OrganizationEmbedPanels } from "../components/operations/organization/OrganizationEmbedPanels";
import { OrganizationHierarchyPanel } from "../components/operations/organization/OrganizationHierarchyPanel";
import { OrganizationPageHeader } from "../components/operations/organization/OrganizationPageHeader";
import { OrganizationTabs } from "../components/operations/organization/OrganizationTabs";
import { OrganizationUnitDetail } from "../components/operations/organization/OrganizationUnitDetail";
import { OrganizationUnitFormDialog } from "../components/operations/organization/OrganizationUnitFormDialog";
import {
  findOrgNodeById,
  flattenOrgTree,
} from "../components/operations/organization/org-tree-utils";
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
  type OperationsOrganizationTab,
  type OperationsOrgUnitDetailTab,
  type OperationsOrgUnitType,
  type UpdateOperationsOrgUnitInput,
} from "../types/operations-organization";

const PAGE_TABS: OperationsOrganizationTab[] = [
  "structure",
  "people",
  "roles",
  "departments",
  "locations",
  "teams",
  "settings",
];

function parseTab(value: string | null): OperationsOrganizationTab {
  if (value && PAGE_TABS.includes(value as OperationsOrganizationTab)) {
    return value as OperationsOrganizationTab;
  }
  return "structure";
}

type DialogState =
  | { mode: "create" }
  | { mode: "create-sub" }
  | { mode: "edit" }
  | null;

export function OperationsOrganizationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));
  const selectedUnitId = searchParams.get("unit");

  const [headerSearch, setHeaderSearch] = useState("");
  const [scopeId, setScopeId] = useState("");
  const [scopeInitialized, setScopeInitialized] = useState(false);
  const [detailTab, setDetailTab] =
    useState<OperationsOrgUnitDetailTab>("overview");
  const [dialog, setDialog] = useState<DialogState>(null);

  const treeQuery = useOperationsOrgTree({
    search: headerSearch.trim() || undefined,
    scopeId: scopeId || undefined,
    status: "active",
  });

  const roots = treeQuery.data?.roots ?? [];
  const selectedNode = selectedUnitId
    ? findOrgNodeById(roots, selectedUnitId)
    : null;

  const overviewEnabled =
    Boolean(selectedUnitId) &&
    (activeTab === "structure" ||
      activeTab === "departments" ||
      activeTab === "teams" ||
      activeTab === "settings");

  const peopleEnabled =
    Boolean(selectedUnitId) &&
    (activeTab === "people" ||
      (activeTab === "structure" && detailTab === "people"));

  const overviewQuery = useOperationsOrgOverview(selectedUnitId, {
    enabled: overviewEnabled,
  });
  const peopleQuery = useOperationsOrgPeople(selectedUnitId, {
    page: 1,
    limit: 20,
    enabled: peopleEnabled,
  });

  const createMutation = useCreateOperationsOrgUnit();
  const createSubMutation = useCreateOperationsOrgSubUnit();
  const updateMutation = useUpdateOperationsOrgUnit();

  const setParams = useCallback(
    (next: { tab?: OperationsOrganizationTab; unit?: string | null }) => {
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);
          if (next.tab) {
            params.set("tab", next.tab);
          }
          if (next.unit === null) {
            params.delete("unit");
          } else if (typeof next.unit === "string") {
            if (next.unit) params.set("unit", next.unit);
            else params.delete("unit");
          }
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    if (!searchParams.get("tab")) {
      setParams({ tab: "structure" });
    }
  }, [searchParams, setParams]);

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

  useEffect(() => {
    if (selectedUnitId) return;
    if (roots.length === 0) return;
    const flat = flattenOrgTree(roots);
    const preferred =
      flat.find(
        (node) =>
          node.type === "state" &&
          node.name.trim().toLowerCase() === "telangana",
      ) ??
      flat.find(
        (node) =>
          node.type === "region" &&
          node.name.trim().toLowerCase() === "south india",
      ) ??
      flat.find((node) => node.type === "global") ??
      roots[0];
    if (preferred) {
      setParams({ unit: preferred.id });
    }
  }, [roots, selectedUnitId, setParams]);

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

        <OrganizationTabs
          activeTab={activeTab}
          onTabChange={(tab) => setParams({ tab })}
        />

        {activeTab === "structure" ? (
          <div className="grid gap-3 xl:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
            <OrganizationHierarchyPanel
              roots={roots}
              selectedUnitId={selectedUnitId}
              onSelect={(unitId) => {
                setDetailTab("overview");
                setParams({ unit: unitId, tab: "structure" });
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
            />
          </div>
        ) : (
          <OrganizationEmbedPanels
            variant={activeTab}
            unitId={selectedUnitId}
            unitName={selectedUnit?.name}
            people={peopleQuery.data ?? null}
            peopleLoading={peopleQuery.isPending}
            overview={overviewQuery.data ?? null}
            overviewLoading={overviewQuery.isPending}
            roots={roots}
            onEditUnit={() => setDialog({ mode: "edit" })}
          />
        )}
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
