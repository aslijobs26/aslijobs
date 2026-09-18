import { Link, useLocation } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import { cn } from "../../../utils/cn";

const TABS: Array<{ id: string; label: string; href: string }> = [
  { id: "structure", label: "Structure", href: OPERATIONS_ROUTES.ORGANIZATION },
  { id: "people", label: "People", href: OPERATIONS_ROUTES.TEAM_MANAGEMENT },
  { id: "teams", label: "Teams", href: OPERATIONS_ROUTES.TEAMS },
  {
    id: "roles",
    label: "Roles & Permissions",
    href: OPERATIONS_ROUTES.ROLES,
  },
  {
    id: "departments",
    label: "Departments",
    href: OPERATIONS_ROUTES.DEPARTMENTS,
  },
  { id: "settings", label: "Settings", href: OPERATIONS_ROUTES.SETTINGS },
];

function isTabActive(href: string, pathname: string, tabId: string): boolean {
  if (tabId === "structure") {
    return (
      pathname === OPERATIONS_ROUTES.ORGANIZATION ||
      pathname.startsWith(`${OPERATIONS_ROUTES.ORGANIZATION}/`)
    );
  }
  if (tabId === "people") {
    return (
      pathname === OPERATIONS_ROUTES.TEAM_MANAGEMENT ||
      pathname.startsWith(`${OPERATIONS_ROUTES.TEAM_MANAGEMENT}/`) ||
      pathname === OPERATIONS_ROUTES.PEOPLE ||
      pathname.startsWith(`${OPERATIONS_ROUTES.PEOPLE}/`)
    );
  }
  if (tabId === "teams") {
    return (
      pathname === OPERATIONS_ROUTES.TEAMS ||
      pathname.startsWith(`${OPERATIONS_ROUTES.TEAMS}/`)
    );
  }
  if (tabId === "roles") {
    return (
      pathname === OPERATIONS_ROUTES.ROLES ||
      pathname.startsWith(`${OPERATIONS_ROUTES.ROLES}/`)
    );
  }
  if (tabId === "departments") {
    return (
      pathname === OPERATIONS_ROUTES.DEPARTMENTS ||
      pathname.startsWith(`${OPERATIONS_ROUTES.DEPARTMENTS}/`)
    );
  }
  if (tabId === "settings") {
    return (
      pathname === OPERATIONS_ROUTES.SETTINGS ||
      pathname.startsWith(`${OPERATIONS_ROUTES.SETTINGS}/`)
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function OrganizationTabs() {
  const { pathname } = useLocation();
  const activeId =
    TABS.find((tab) => isTabActive(tab.href, pathname, tab.id))?.id ??
    "structure";

  return (
    <div
      role="tablist"
      aria-label="Organization sections"
      className="flex gap-1 overflow-x-auto border-b border-border-subtle scrollbar-hidden"
    >
      {TABS.map((tab) => {
        const selected = tab.id === activeId;
        return (
          <Link
            key={tab.id}
            to={tab.href}
            role="tab"
            aria-selected={selected}
            id={`org-tab-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              selected
                ? "border-primary text-foreground"
                : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
