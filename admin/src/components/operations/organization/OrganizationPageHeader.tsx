import { ChevronDown, Globe, Plus, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import type { OperationsOrgTreeNode } from "../../../types/operations-organization";
import { OperationsCan } from "../auth/OperationsCan";
import { flattenOrgTree } from "./org-tree-utils";

interface OrganizationPageHeaderProps {
  scopeId: string;
  onScopeChange: (scopeId: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  roots: OperationsOrgTreeNode[];
  onAddUnit: () => void;
  onAddSubUnit: () => void;
  canAddSubUnit: boolean;
}

export function OrganizationPageHeader({
  scopeId,
  onScopeChange,
  search,
  onSearchChange,
  roots,
  onAddUnit,
  onAddSubUnit,
  canAddSubUnit,
}: OrganizationPageHeaderProps) {
  const addMenuId = useId();
  const [addOpen, setAddOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!addOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (
        addMenuRef.current &&
        !addMenuRef.current.contains(event.target as Node)
      ) {
        setAddOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAddOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [addOpen]);

  const scopeOptions = [
    { value: "", label: "Global" },
    ...flattenOrgTree(roots)
      .filter(
        (node) =>
          node.type === "global" ||
          node.type === "country" ||
          node.type === "region",
      )
      .map((node) => ({
        value: node.id,
        label: node.name,
      })),
  ];

  const selectedScopeLabel =
    scopeOptions.find((option) => option.value === scopeId)?.label ?? "Global";

  return (
    <div className="space-y-3">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted"
      >
        <Link
          to={OPERATIONS_ROUTES.DASHBOARD}
          className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Management
        </Link>
        <span aria-hidden="true">›</span>
        <span className="font-medium text-foreground">Organization</span>
      </nav>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground sm:text-[24px]">
            Organization
          </h1>
          <p className="mt-1 max-w-xl text-[13px] leading-snug text-muted">
            Manage ASLI&apos;s global structure, teams, people, roles and
            locations.
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <label className="relative inline-flex h-9 min-w-[7.5rem] items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-2.5 text-[12px] font-medium text-foreground shadow-sm focus-within:ring-2 focus-within:ring-primary/30">
            <Globe className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
            <span className="sr-only">Organization scope</span>
            <select
              value={scopeId}
              onChange={(event) => onScopeChange(event.target.value)}
              className="h-full min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-5 text-[12px] font-medium text-foreground outline-none"
              aria-label="Organization scope"
            >
              {scopeOptions.map((option) => (
                <option key={option.value || "global"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2 size-3.5 text-muted"
              aria-hidden="true"
            />
            <span className="sr-only">{selectedScopeLabel}</span>
          </label>

          <label className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
            <span className="sr-only">Search organization</span>
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search organization..."
              className="h-9 w-full rounded-lg border border-border-subtle bg-surface pl-8 pr-3 text-[12px] text-foreground shadow-sm placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </label>

          <OperationsCan module="team" action="create">
            <div className="relative" ref={addMenuRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={addOpen}
                aria-controls={addMenuId}
                onClick={() => setAddOpen((open) => !open)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12px] font-semibold text-white shadow-sm hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Add
                <ChevronDown className="size-3.5 opacity-90" aria-hidden="true" />
              </button>
              {addOpen ? (
                <ul
                  id={addMenuId}
                  role="menu"
                  className="absolute right-0 z-20 mt-1 min-w-[12rem] overflow-hidden rounded-lg border border-border-subtle bg-surface py-1 shadow-md"
                >
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full px-3 py-2 text-left text-[12px] text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:bg-hero-bg"
                      onClick={() => {
                        setAddOpen(false);
                        onAddUnit();
                      }}
                    >
                      Add organization unit
                    </button>
                  </li>
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      disabled={!canAddSubUnit}
                      className="flex w-full px-3 py-2 text-left text-[12px] text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:bg-hero-bg disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => {
                        setAddOpen(false);
                        onAddSubUnit();
                      }}
                    >
                      Add sub-unit
                    </button>
                  </li>
                </ul>
              ) : null}
            </div>
          </OperationsCan>
        </div>
      </div>
    </div>
  );
}
