import { useMemo } from "react";
import type { OperationsCatalogTreeNode, OperationsRoleGrant } from "../../../types/operations-team";
import { cn } from "../../../utils/cn";

type PermissionTreeBuilderProps = {
  tree: OperationsCatalogTreeNode[];
  grants: OperationsRoleGrant[];
  onChange: (grants: OperationsRoleGrant[]) => void;
  allowedKeys?: string[] | null;
  isSuperAdmin: boolean;
};

function collectLeafKeys(node: OperationsCatalogTreeNode): string[] {
  if (node.children.length === 0) {
    return [node.key];
  }
  return node.children.flatMap(collectLeafKeys);
}

function grantMap(grants: OperationsRoleGrant[]) {
  return new Map(grants.map((grant) => [grant.key, grant]));
}

export function PermissionTreeBuilder({
  tree,
  grants,
  onChange,
  allowedKeys,
  isSuperAdmin,
}: PermissionTreeBuilderProps) {
  const allowed = useMemo(
    () => (isSuperAdmin || !allowedKeys ? null : new Set(allowedKeys)),
    [allowedKeys, isSuperAdmin],
  );
  const selected = grantMap(grants);

  const visibleTree = useMemo(() => {
    if (!allowed) {
      return tree;
    }
    const filterNode = (
      node: OperationsCatalogTreeNode,
    ): OperationsCatalogTreeNode | null => {
      if (node.children.length === 0) {
        return allowed.has(node.key) ? node : null;
      }
      const children = node.children
        .map(filterNode)
        .filter((child): child is OperationsCatalogTreeNode => Boolean(child));
      if (children.length === 0) {
        return null;
      }
      return { ...node, children };
    };
    return tree
      .map(filterNode)
      .filter((node): node is OperationsCatalogTreeNode => Boolean(node));
  }, [allowed, tree]);

  const setLeaf = (key: string, enabled: boolean, canDelegate: boolean) => {
    const next = grants.filter((grant) => grant.key !== key);
    if (enabled) {
      next.push({ key, access: "allow", canDelegate });
    }
    onChange(next);
  };

  const setNode = (node: OperationsCatalogTreeNode, enabled: boolean) => {
    const leaves = collectLeafKeys(node).filter(
      (key) => !allowed || allowed.has(key),
    );
    const kept = grants.filter((grant) => !leaves.includes(grant.key));
    if (enabled) {
      onChange([
        ...kept,
        ...leaves.map((key) => ({
          key,
          access: "allow" as const,
          canDelegate: selected.get(key)?.canDelegate ?? false,
        })),
      ]);
      return;
    }
    onChange(kept);
  };

  const renderNode = (node: OperationsCatalogTreeNode, depth: number) => {
    const leaves = collectLeafKeys(node);
    const selectedCount = leaves.filter((key) => selected.has(key)).length;
    const isLeaf = node.children.length === 0;
    const checked = isLeaf
      ? selected.has(node.key)
      : selectedCount === leaves.length && leaves.length > 0;
    const indeterminate = !isLeaf && selectedCount > 0 && selectedCount < leaves.length;
    const grant = selected.get(node.key);

    return (
      <li key={node.key} className="min-w-0">
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 rounded-lg px-2 py-1.5",
            depth === 0 && "bg-hero-bg/60",
          )}
        >
          <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="size-4 rounded border-border-subtle text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              checked={checked}
              ref={(element) => {
                if (element) {
                  element.indeterminate = indeterminate;
                }
              }}
              onChange={(event) => {
                if (isLeaf) {
                  setLeaf(node.key, event.target.checked, grant?.canDelegate ?? false);
                  return;
                }
                setNode(node, event.target.checked);
              }}
            />
            <span className="truncate font-medium capitalize">{node.label}</span>
          </label>
          {isLeaf && checked ? (
            <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted">
              <input
                type="checkbox"
                className="size-3.5 rounded border-border-subtle text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                checked={Boolean(grant?.canDelegate)}
                onChange={(event) =>
                  setLeaf(node.key, true, event.target.checked)
                }
              />
              Delegatable
            </label>
          ) : null}
        </div>
        {node.children.length > 0 ? (
          <ul className="ml-4 border-l border-border-subtle pl-3">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </ul>
        ) : null}
      </li>
    );
  };

  if (visibleTree.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border-subtle bg-surface px-4 py-8 text-center text-sm text-muted">
        You can only delegate permissions available within your assigned
        delegation scope.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {!isSuperAdmin ? (
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-foreground">
          You can only delegate permissions available within your assigned
          delegation scope.
        </p>
      ) : null}
      <ul className="space-y-2">{visibleTree.map((node) => renderNode(node, 0))}</ul>
    </div>
  );
}
