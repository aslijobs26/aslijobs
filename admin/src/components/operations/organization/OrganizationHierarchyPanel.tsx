import {
  ChevronRight,
  Folder,
  Globe2,
  MapPin,
  MapPinned,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { resolveIndiaStateLabel } from "../employers/overview/india-state-normalize";
import type { OperationsOrgTreeNode } from "../../../types/operations-organization";
import { cn } from "../../../utils/cn";
import { prefetchIndiaStateDistrictMaps } from "../../../utils/india-state-districts";

interface OrganizationHierarchyPanelProps {
  roots: OperationsOrgTreeNode[];
  selectedUnitId: string | null;
  onSelect: (unitId: string) => void;
  search: string;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export function OrganizationHierarchyPanel({
  roots,
  selectedUnitId,
  onSelect,
  search,
  isLoading,
  errorMessage,
}: OrganizationHierarchyPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [localSearch, setLocalSearch] = useState("");

  const defaultExpanded = useMemo(() => {
    const ids = new Set<string>();
    const walk = (nodes: OperationsOrgTreeNode[], depth: number) => {
      for (const node of nodes) {
        if (depth < 3) ids.add(node.id);
        if (node.children.length > 0) walk(node.children, depth + 1);
      }
    };
    walk(roots, 0);
    if (selectedUnitId) {
      for (const id of collectAncestors(roots, selectedUnitId)) ids.add(id);
      ids.add(selectedUnitId);
    }
    return ids;
  }, [roots, selectedUnitId]);

  useEffect(() => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      for (const id of defaultExpanded) next.add(id);
      return next;
    });
  }, [defaultExpanded]);

  const toggleExpanded = (unitId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  };

  const filterQuery = (localSearch || search).trim().toLowerCase();
  const visibleRoots = useMemo(() => {
    if (!filterQuery) return roots;
    return filterTree(roots, filterQuery);
  }, [roots, filterQuery]);

  return (
    <section className="flex min-h-[28rem] flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm xl:min-h-[36rem]">
      <header className="shrink-0 space-y-2 border-b border-border-subtle px-3 py-3">
        <h2 className="text-[13px] font-semibold tracking-tight text-foreground">
          Organization Hierarchy
        </h2>
        <label className="relative block">
          <span className="sr-only">Search in hierarchy</span>
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={localSearch}
            onChange={(event) => setLocalSearch(event.target.value)}
            placeholder="Search in hierarchy..."
            className="h-8 w-full rounded-lg border border-border-subtle bg-hero-bg/50 pl-8 pr-2.5 text-[11px] text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </label>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-2 scrollbar-hidden">
        {isLoading ? (
          <div className="space-y-2 p-1">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-9 animate-pulse rounded-lg bg-hero-bg"
              />
            ))}
          </div>
        ) : errorMessage ? (
          <p className="px-2 py-6 text-center text-[12px] text-danger">
            {errorMessage}
          </p>
        ) : visibleRoots.length === 0 ? (
          <p className="px-2 py-10 text-center text-[12px] text-muted">
            No organization units found.
          </p>
        ) : (
          <ul
            role="tree"
            aria-label="Organization hierarchy"
            className="space-y-0.5"
          >
            {visibleRoots.map((node) => (
              <HierarchyNode
                key={node.id}
                node={node}
                depth={0}
                selectedUnitId={selectedUnitId}
                expandedIds={expandedIds}
                onToggle={toggleExpanded}
                onSelect={onSelect}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function HierarchyNode({
  node,
  depth,
  selectedUnitId,
  expandedIds,
  onToggle,
  onSelect,
}: {
  node: OperationsOrgTreeNode;
  depth: number;
  selectedUnitId: string | null;
  expandedIds: Set<string>;
  onToggle: (unitId: string) => void;
  onSelect: (unitId: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const expanded = expandedIds.has(node.id);
  const selected = selectedUnitId === node.id;
  const TypeIcon = iconForType(node.type);
  const flag =
    node.type === "country" ? countryFlagEmoji(node.name) : null;

  return (
    <li
      role="treeitem"
      aria-expanded={hasChildren ? expanded : undefined}
      aria-selected={selected}
    >
      <div
        className={cn(
          "group flex items-center gap-0.5 rounded-lg",
          selected && "bg-sky-50 dark:bg-sky-500/15",
        )}
        style={{ paddingLeft: `${Math.min(depth, 6) * 0.7}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={
              expanded ? `Collapse ${node.name}` : `Expand ${node.name}`
            }
            aria-expanded={expanded}
            onClick={() => onToggle(node.id)}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <ChevronRight
              className={cn(
                "size-3.5 transition-transform",
                expanded && "rotate-90",
              )}
              aria-hidden="true"
            />
          </button>
        ) : (
          <span className="inline-flex size-7 shrink-0" aria-hidden="true" />
        )}

        <button
          type="button"
          onClick={() => onSelect(node.id)}
          onMouseEnter={() => {
            if (node.type !== "state") return;
            const label = resolveIndiaStateLabel(node.name) ?? node.name;
            prefetchIndiaStateDistrictMaps([label]);
          }}
          onFocus={() => {
            if (node.type !== "state") return;
            const label = resolveIndiaStateLabel(node.name) ?? node.name;
            prefetchIndiaStateDistrictMaps([label]);
          }}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            selected ? "text-foreground" : "text-foreground hover:bg-hero-bg/80",
          )}
        >
          <span
            className={cn(
              "inline-flex size-6 shrink-0 items-center justify-center rounded-md",
              selected
                ? "bg-primary/15 text-primary"
                : iconToneClass(node.type, node.name),
            )}
            aria-hidden="true"
          >
            {flag ? (
              <span className="text-[12px] leading-none">{flag}</span>
            ) : (
              <TypeIcon className="size-3.5" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-semibold">
              {node.name}
            </span>
            <span className="block truncate text-[10px] text-muted">
              {node.type === "global"
                ? `Headquarters · ${node.peopleCount.toLocaleString("en-IN")} people`
                : `${node.peopleCount.toLocaleString("en-IN")} people`}
            </span>
          </span>
        </button>
      </div>

      {hasChildren && expanded ? (
        <ul role="group" className="mt-0.5 space-y-0.5">
          {node.children.map((child) => (
            <HierarchyNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedUnitId={selectedUnitId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function iconForType(type: string) {
  switch (type) {
    case "global":
      return Globe2;
    case "country":
      return Globe2;
    case "region":
      return Folder;
    case "state":
      return MapPin;
    case "city":
    case "office":
      return MapPinned;
    default:
      return Folder;
  }
}

/** Soft icon chip colors — states get a distinct light color per state name. */
const STATE_ICON_TONES: Record<string, string> = {
  "andhra pradesh": "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300",
  karnataka: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
  kerala: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
  "tamil nadu": "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
  telangana: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  puducherry: "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-300",
  maharashtra: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300",
  gujarat: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300",
  goa: "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300",
  delhi: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300",
  "west bengal": "bg-lime-50 text-lime-700 dark:bg-lime-500/10 dark:text-lime-300",
  "uttar pradesh": "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300",
  rajasthan: "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300",
  "madhya pradesh": "bg-stone-50 text-stone-600 dark:bg-stone-500/10 dark:text-stone-300",
  bihar: "bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-300",
  odisha: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
  assam: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-300",
  punjab: "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-200",
  haryana: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200",
  "himachal pradesh": "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200",
  "jammu and kashmir": "bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-200",
  ladakh: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200",
  chhattisgarh: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-200",
  jharkhand: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200",
  "andaman and nicobar islands":
    "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-200",
  lakshadweep: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200",
};

const STATE_ICON_FALLBACK_TONES = [
  "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300",
  "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
  "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
  "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
  "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-300",
  "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300",
  "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300",
] as const;

function iconToneClass(type: string, name: string): string {
  if (type === "global") {
    return "bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300";
  }
  if (type === "country") {
    return "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300";
  }
  if (type === "region") {
    return "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300";
  }
  if (type === "city") {
    return "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300";
  }
  if (type === "office") {
    return "bg-stone-50 text-stone-600 dark:bg-stone-500/10 dark:text-stone-300";
  }
  if (type === "state") {
    const label = (resolveIndiaStateLabel(name) ?? name).trim().toLowerCase();
    const mapped = STATE_ICON_TONES[label];
    if (mapped) return mapped;
    let hash = 0;
    for (let i = 0; i < label.length; i += 1) {
      hash = (hash + label.charCodeAt(i) * (i + 1)) % STATE_ICON_FALLBACK_TONES.length;
    }
    return STATE_ICON_FALLBACK_TONES[hash]!;
  }
  return "bg-hero-bg text-muted";
}

function countryFlagEmoji(name: string): string | null {
  const normalized = name.trim().toLowerCase();
  if (normalized === "india") return "🇮🇳";
  if (normalized === "uae" || normalized === "united arab emirates") return "🇦🇪";
  if (normalized === "saudi arabia") return "🇸🇦";
  return null;
}

function filterTree(
  nodes: OperationsOrgTreeNode[],
  query: string,
): OperationsOrgTreeNode[] {
  const result: OperationsOrgTreeNode[] = [];
  for (const node of nodes) {
    const children = filterTree(node.children, query);
    const matches = node.name.toLowerCase().includes(query);
    if (matches || children.length > 0) {
      result.push({
        ...node,
        children: matches ? node.children : children,
      });
    }
  }
  return result;
}

function collectAncestors(
  roots: OperationsOrgTreeNode[],
  unitId: string,
): string[] {
  const path: string[] = [];
  const walk = (
    nodes: OperationsOrgTreeNode[],
    trail: string[],
  ): boolean => {
    for (const node of nodes) {
      if (node.id === unitId) {
        path.push(...trail);
        return true;
      }
      if (walk(node.children, [...trail, node.id])) return true;
    }
    return false;
  };
  walk(roots, []);
  return path;
}
