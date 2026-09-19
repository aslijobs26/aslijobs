import {
  ChevronDown,
  ChevronRight,
  Info,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  OPERATIONS_ROUTES,
  operationsRoleEditPath,
} from "../../../constants/operations-routes";
import type {
  OperationsRole,
  OperationsRoleTreeNode,
} from "../../../types/operations-team";
import { cn } from "../../../utils/cn";
import { OperationsCan } from "../auth/OperationsCan";
import { RolesRowActions } from "./RolesRowActions";
import { formatRoleMemberBadge, getRoleVisual } from "./role-visuals";

type RolesHierarchyPanelProps = {
  tree: OperationsRoleTreeNode[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onArchive: (role: OperationsRole) => void;
  onRestore: (role: OperationsRole) => void;
  /** Rendered on the left of the hierarchy toolbar (e.g. Roles/Hierarchy toggle). */
  leadingControls?: ReactNode;
};

function collectExpandableIds(nodes: OperationsRoleTreeNode[]): string[] {
  const ids: string[] = [];
  const walk = (list: OperationsRoleTreeNode[]) => {
    for (const node of list) {
      if (node.children.length > 0) {
        ids.push(node.id);
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return ids;
}

function filterTree(
  nodes: OperationsRoleTreeNode[],
  query: string,
): OperationsRoleTreeNode[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return nodes;
  }

  const walk = (list: OperationsRoleTreeNode[]): OperationsRoleTreeNode[] => {
    const next: OperationsRoleTreeNode[] = [];
    for (const node of list) {
      const children = walk(node.children);
      const matches =
        node.name.toLowerCase().includes(normalized) ||
        node.description.toLowerCase().includes(normalized) ||
        (node.departmentName ?? "").toLowerCase().includes(normalized);
      if (matches || children.length > 0) {
        next.push({ ...node, children });
      }
    }
    return next;
  };

  return walk(nodes);
}

function HierarchySkeleton() {
  return (
    <div className="space-y-3 p-4" aria-hidden="true">
      <div className="h-[68px] animate-pulse rounded-xl border border-border-subtle bg-hero-bg" />
      <div className="ml-16 space-y-2.5 border-l border-border-subtle pl-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-[64px] animate-pulse rounded-xl border border-border-subtle bg-hero-bg"
          />
        ))}
      </div>
    </div>
  );
}

function HierarchyNodeRow({
  node,
  depth,
  isLast,
  expanded,
  onToggle,
  onArchive,
  onRestore,
}: {
  node: OperationsRoleTreeNode;
  depth: number;
  isLast: boolean;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onArchive: (role: OperationsRole) => void;
  onRestore: (role: OperationsRole) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isSystemRoot = Boolean(node.isSystemRoot);
  const { Icon, className: iconClass } = getRoleVisual(node.name);
  const memberBadge = formatRoleMemberBadge(
    node.memberCount,
    isSystemRoot ? null : node.departmentName,
  );
  const description = isSystemRoot
    ? node.description?.trim() ||
      "Highest level role with full system access."
    : node.description?.trim() || "—";

  const rowContent = (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-xl border border-border-subtle bg-surface px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors",
        isSystemRoot ? "py-3" : "hover:bg-[#F8FAFC]",
      )}
    >
      <span
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-[11px]",
          iconClass,
        )}
        aria-hidden="true"
      >
        <Icon className="size-[18px]" strokeWidth={2} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {isSystemRoot ? (
            <p className="truncate text-[14px] font-semibold text-foreground">
              {node.name}
            </p>
          ) : (
            <Link
              to={operationsRoleEditPath(node.id)}
              className="truncate text-[14px] font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {node.name}
            </Link>
          )}
          {isSystemRoot ? (
            <span className="inline-flex rounded-full bg-[#E8F0FE] px-2 py-0.5 text-[10px] font-semibold text-[#2563EB]">
              Root Role
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 line-clamp-1 text-[12px] leading-snug text-muted">
          {description}
        </p>
      </div>

      <span className="hidden shrink-0 rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[11px] font-medium text-[#475569] sm:inline-flex">
        {memberBadge}
      </span>

      {!isSystemRoot ? (
        <RolesRowActions
          role={node}
          onArchive={onArchive}
          onRestore={onRestore}
        />
      ) : (
        <span className="inline-flex size-8" aria-hidden="true" />
      )}

      {hasChildren ? (
        <button
          type="button"
          aria-label={isExpanded ? "Collapse role" : "Expand role"}
          aria-expanded={isExpanded}
          onClick={() => onToggle(node.id)}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {isExpanded ? (
            <ChevronDown className="size-4" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-4" aria-hidden="true" />
          )}
        </button>
      ) : (
        <span className="inline-flex size-8 shrink-0 items-center justify-center text-muted">
          <ChevronRight className="size-4 opacity-40" aria-hidden="true" />
        </span>
      )}
    </div>
  );

  return (
    <li className="relative min-w-0 list-none">
      {depth > 0 ? (
        <>
          <span
            className={cn(
              "pointer-events-none absolute -left-[22px] top-0 w-px bg-[#D7E0E8]",
              isLast ? "h-[34px]" : "bottom-0",
            )}
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute -left-[22px] top-[34px] h-px w-[22px] bg-[#D7E0E8]"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute -left-[25px] top-[31px] size-[7px] rounded-full border-2 border-[#D7E0E8] bg-surface"
            aria-hidden="true"
          />
        </>
      ) : null}

      {rowContent}

      <span className="mt-2 block text-[11px] font-medium text-[#475569] sm:hidden">
        {memberBadge}
      </span>

      {hasChildren && isExpanded ? (
        <ul className="relative mt-2.5 ml-[54px] space-y-2.5 border-l border-[#D7E0E8] pl-6">
          {node.children.map((child, index) => (
            <HierarchyNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              isLast={index === node.children.length - 1}
              expanded={expanded}
              onToggle={onToggle}
              onArchive={onArchive}
              onRestore={onRestore}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function RolesHierarchyPanel({
  tree,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onArchive,
  onRestore,
  leadingControls,
}: RolesHierarchyPanelProps) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const filteredTree = useMemo(
    () => filterTree(tree, search),
    [search, tree],
  );

  const expandableIds = useMemo(
    () => collectExpandableIds(filteredTree),
    [filteredTree],
  );

  useEffect(() => {
    setExpanded(new Set(collectExpandableIds(tree)));
  }, [tree]);

  useEffect(() => {
    if (!search.trim()) {
      return;
    }
    setExpanded(new Set(expandableIds));
  }, [expandableIds, search]);

  const toggleNode = useCallback((id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {leadingControls ? (
          <div className="shrink-0">{leadingControls}</div>
        ) : null}

        <label className="relative min-w-0 w-full sm:max-w-sm sm:flex-1 sm:ml-auto">
          <span className="sr-only">Search roles in hierarchy</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search roles in hierarchy..."
            className="h-10 w-full rounded-lg border border-border-subtle bg-surface pl-9 pr-3 text-[12px] font-medium text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] placeholder:font-normal placeholder:text-muted transition-[border-color,box-shadow] hover:border-primary/25 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {isLoading ? (
          <HierarchySkeleton />
        ) : isError ? (
          <div className="flex flex-col items-start gap-3 px-5 py-10">
            <p className="text-[13px] font-medium text-danger">
              {errorMessage || "Unable to load role hierarchy."}
            </p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="h-9 rounded-lg border border-border-subtle bg-surface px-3 text-[12px] font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Retry
              </button>
            ) : null}
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <p className="text-[14px] font-semibold text-foreground">
              No roles found
            </p>
            <p className="max-w-sm text-[12px] text-muted">
              {search.trim()
                ? "No roles match your hierarchy search."
                : "Create your first role to define permissions and access."}
            </p>
            {!search.trim() ? (
              <OperationsCan module="roles" action="create">
                <Link
                  to={OPERATIONS_ROUTES.ROLES_NEW}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-[12px] font-semibold text-white hover:bg-primary-hover"
                >
                  + Create Role
                </Link>
              </OperationsCan>
            ) : null}
          </div>
        ) : (
          <>
            <ul className="space-y-2.5 p-4 sm:p-5">
              {filteredTree.map((node, index) => (
                <HierarchyNodeRow
                  key={node.id}
                  node={node}
                  depth={0}
                  isLast={index === filteredTree.length - 1}
                  expanded={expanded}
                  onToggle={toggleNode}
                  onArchive={onArchive}
                  onRestore={onRestore}
                />
              ))}
            </ul>
            <div className="border-t border-border-subtle px-4 py-3 sm:px-5">
              <div className="flex items-start gap-2.5 rounded-xl bg-[#E8F6F5] px-3.5 py-3 text-[12px] leading-snug text-[#1F6B68]">
                <Info
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <p>
                  <span className="font-semibold">
                    Drag and drop roles to reorganize the hierarchy.
                  </span>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
