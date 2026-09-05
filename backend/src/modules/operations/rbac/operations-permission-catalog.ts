import type {
  OperationsPermissionAction,
  OperationsPermissionModule,
} from "../auth/operations-rbac.js";
import { OPERATIONS_PERMISSION_MODULES } from "../auth/operations-rbac.js";

/**
 * Central Operations permission registry.
 *
 * Keys are the authorization source of truth:
 *   module[.page][.section][.field].action
 *
 * Catalog ≠ implemented feature. Unimplemented modules still register
 * coarse view/create/update/delete keys so Team Management can assign
 * them before those pages exist.
 */

export type OperationsPermissionAccess = "allow";

export type OperationsPermissionDefinition = {
  key: string;
  module: OperationsPermissionModule;
  page: string | null;
  section: string | null;
  field: string | null;
  action: string;
  label: string;
  description?: string;
  /** Coarse matrix projection used by existing can(module, action) gates. */
  mapsTo: {
    module: OperationsPermissionModule;
    action: OperationsPermissionAction;
  };
  sensitive?: boolean;
};

export type OperationsCatalogTreeNode = {
  key: string;
  label: string;
  children: OperationsCatalogTreeNode[];
};

function keyOf(parts: Array<string | null | undefined>): string {
  return parts.filter((part): part is string => Boolean(part)).join(".");
}

function define(input: {
  module: OperationsPermissionModule;
  page?: string | null;
  section?: string | null;
  field?: string | null;
  action: string;
  label: string;
  description?: string;
  mapsToAction: OperationsPermissionAction;
  sensitive?: boolean;
}): OperationsPermissionDefinition {
  return {
    key: keyOf([
      input.module,
      input.page,
      input.section,
      input.field,
      input.action,
    ]),
    module: input.module,
    page: input.page ?? null,
    section: input.section ?? null,
    field: input.field ?? null,
    action: input.action,
    label: input.label,
    description: input.description,
    mapsTo: {
      module: input.module,
      action: input.mapsToAction,
    },
    sensitive: input.sensitive,
  };
}

function coarseModule(
  module: OperationsPermissionModule,
  label: string,
  actions: OperationsPermissionAction[],
): OperationsPermissionDefinition[] {
  const actionLabels: Record<OperationsPermissionAction, string> = {
    read: "View",
    create: "Create",
    update: "Update",
    delete: "Delete",
  };

  return actions.map((action) =>
    define({
      module,
      action: action === "read" ? "view" : action,
      label: `${label} · ${actionLabels[action]}`,
      mapsToAction: action,
    }),
  );
}

function employerCatalog(): OperationsPermissionDefinition[] {
  const listActions: Array<{
    action: string;
    label: string;
    mapsToAction: OperationsPermissionAction;
  }> = [
    { action: "view", label: "View list", mapsToAction: "read" },
    { action: "search", label: "Search", mapsToAction: "read" },
    { action: "filter", label: "Filter", mapsToAction: "read" },
    { action: "export", label: "Export", mapsToAction: "read" },
  ];

  const profileFields: Array<{ id: string; label: string; sensitive?: boolean }> =
    [
      { id: "name", label: "Name" },
      { id: "phone", label: "Phone", sensitive: true },
      { id: "email", label: "Email", sensitive: true },
      { id: "address", label: "Address", sensitive: true },
      { id: "pan", label: "PAN", sensitive: true },
      { id: "gst", label: "GST", sensitive: true },
      { id: "registration_number", label: "Registration number", sensitive: true },
    ];

  const profileActions: Array<{
    action: string;
    label: string;
  }> = [
    { action: "verify", label: "Verify" },
    { action: "reject", label: "Reject" },
    { action: "suspend", label: "Suspend" },
    { action: "activate", label: "Activate" },
  ];

  return [
    ...listActions.map((item) =>
      define({
        module: "employers",
        page: "list",
        action: item.action,
        label: `Employers · List · ${item.label}`,
        mapsToAction: item.mapsToAction,
      }),
    ),
    define({
      module: "employers",
      page: "profile",
      action: "view",
      label: "Employers · Profile · View",
      mapsToAction: "read",
    }),
    ...profileFields.map((field) =>
      define({
        module: "employers",
        page: "profile",
        section: "fields",
        field: field.id,
        action: "view",
        label: `Employers · Profile · ${field.label}`,
        mapsToAction: "read",
        sensitive: field.sensitive,
      }),
    ),
    define({
      module: "employers",
      page: "profile",
      section: "documents",
      action: "view",
      label: "Employers · Documents · View",
      mapsToAction: "read",
    }),
    define({
      module: "employers",
      page: "profile",
      section: "documents",
      action: "download",
      label: "Employers · Documents · Download",
      mapsToAction: "read",
      sensitive: true,
    }),
    define({
      module: "employers",
      page: "profile",
      section: "jobs",
      action: "view",
      label: "Employers · Posted jobs · View",
      mapsToAction: "read",
    }),
    ...profileActions.map((item) =>
      define({
        module: "employers",
        page: "profile",
        section: "actions",
        action: item.action,
        label: `Employers · ${item.label}`,
        mapsToAction: "update",
      }),
    ),
  ];
}

function candidateCatalog(): OperationsPermissionDefinition[] {
  const fields: Array<{ id: string; label: string; sensitive?: boolean }> = [
    { id: "name", label: "Name" },
    { id: "phone", label: "Phone", sensitive: true },
    { id: "email", label: "Email", sensitive: true },
    { id: "location", label: "Location" },
  ];

  return [
    define({
      module: "candidates",
      page: "list",
      action: "view",
      label: "Candidates · List · View",
      mapsToAction: "read",
    }),
    define({
      module: "candidates",
      page: "list",
      action: "search",
      label: "Candidates · List · Search",
      mapsToAction: "read",
    }),
    define({
      module: "candidates",
      page: "list",
      action: "filter",
      label: "Candidates · List · Filter",
      mapsToAction: "read",
    }),
    define({
      module: "candidates",
      page: "profile",
      action: "view",
      label: "Candidates · Profile · View",
      mapsToAction: "read",
    }),
    ...fields.map((field) =>
      define({
        module: "candidates",
        page: "profile",
        section: "fields",
        field: field.id,
        action: "view",
        label: `Candidates · Profile · ${field.label}`,
        mapsToAction: "read",
        sensitive: field.sensitive,
      }),
    ),
    define({
      module: "candidates",
      page: "profile",
      section: "applications",
      action: "view",
      label: "Candidates · Applications · View",
      mapsToAction: "read",
    }),
  ];
}

function jobCatalog(): OperationsPermissionDefinition[] {
  const listActions = [
    { action: "view", label: "View list", mapsToAction: "read" as const },
    { action: "search", label: "Search", mapsToAction: "read" as const },
    { action: "filter", label: "Filter", mapsToAction: "read" as const },
  ];

  const statusActions = [
    "approve",
    "reject",
    "pause",
    "resume",
    "close",
    "reactivate",
    "publish",
    "expire",
  ] as const;

  return [
    ...listActions.map((item) =>
      define({
        module: "jobs",
        page: "list",
        action: item.action,
        label: `Jobs · List · ${item.label}`,
        mapsToAction: item.mapsToAction,
      }),
    ),
    define({
      module: "jobs",
      page: "detail",
      action: "view",
      label: "Jobs · Detail · View",
      mapsToAction: "read",
    }),
    define({
      module: "jobs",
      page: "detail",
      section: "applications",
      action: "view",
      label: "Jobs · Applications · View",
      mapsToAction: "read",
    }),
    define({
      module: "jobs",
      page: "post",
      action: "create",
      label: "Jobs · Post · Create",
      mapsToAction: "create",
    }),
    define({
      module: "jobs",
      page: "post",
      action: "update",
      label: "Jobs · Post · Update draft",
      mapsToAction: "update",
    }),
    define({
      module: "jobs",
      page: "post",
      action: "publish",
      label: "Jobs · Post · Publish",
      mapsToAction: "update",
    }),
    define({
      module: "jobs",
      page: "post",
      action: "assign_employer",
      label: "Jobs · Post · Assign employer",
      mapsToAction: "update",
    }),
    ...statusActions.map((action) =>
      define({
        module: "jobs",
        page: "detail",
        section: "actions",
        action,
        label: `Jobs · ${action.charAt(0).toUpperCase()}${action.slice(1)}`,
        mapsToAction: "update",
      }),
    ),
  ];
}

function teamCatalog(): OperationsPermissionDefinition[] {
  return [
    define({
      module: "team",
      page: "members",
      action: "view",
      label: "Team · Members · View",
      mapsToAction: "read",
    }),
    define({
      module: "team",
      page: "members",
      action: "invite",
      label: "Team · Members · Invite",
      mapsToAction: "create",
    }),
    define({
      module: "team",
      page: "members",
      action: "update",
      label: "Team · Members · Edit",
      mapsToAction: "update",
    }),
    define({
      module: "team",
      page: "members",
      action: "activate",
      label: "Team · Members · Activate",
      mapsToAction: "update",
    }),
    define({
      module: "team",
      page: "members",
      action: "deactivate",
      label: "Team · Members · Deactivate",
      mapsToAction: "update",
    }),
    define({
      module: "team",
      page: "members",
      action: "assign_role",
      label: "Team · Members · Assign role",
      mapsToAction: "update",
    }),
    define({
      module: "team",
      page: "members",
      action: "assign_department",
      label: "Team · Members · Assign department",
      mapsToAction: "update",
    }),
    define({
      module: "roles",
      action: "view",
      label: "Roles · View",
      mapsToAction: "read",
    }),
    define({
      module: "roles",
      action: "create",
      label: "Roles · Create",
      mapsToAction: "create",
    }),
    define({
      module: "roles",
      action: "update",
      label: "Roles · Update",
      mapsToAction: "update",
    }),
    define({
      module: "roles",
      action: "archive",
      label: "Roles · Archive",
      mapsToAction: "delete",
    }),
    define({
      module: "roles",
      action: "restore",
      label: "Roles · Restore",
      mapsToAction: "update",
    }),
    define({
      module: "departments",
      action: "view",
      label: "Departments · View",
      mapsToAction: "read",
    }),
    define({
      module: "departments",
      action: "create",
      label: "Departments · Create",
      mapsToAction: "create",
    }),
    define({
      module: "departments",
      action: "update",
      label: "Departments · Update",
      mapsToAction: "update",
    }),
    define({
      module: "activity_logs",
      action: "view",
      label: "Activity log · View",
      mapsToAction: "read",
    }),
  ];
}

const UNIMPLEMENTED_READ_WRITE: OperationsPermissionModule[] = [
  "my_work",
  "work_queue",
  "whatsapp",
  "support",
  "verifications",
  "escalations",
  "campaigns",
];

const UNIMPLEMENTED_READ_ONLY: OperationsPermissionModule[] = [
  "dashboard",
  "journey_alerts",
  "reports",
  "billing",
  "settings",
];

export const OPERATIONS_PERMISSION_CATALOG: OperationsPermissionDefinition[] = [
  ...coarseModule("dashboard", "Dashboard", ["read"]),
  ...UNIMPLEMENTED_READ_WRITE.flatMap((module) =>
    coarseModule(module, module.replaceAll("_", " "), [
      "read",
      "create",
      "update",
      "delete",
    ]),
  ),
  ...UNIMPLEMENTED_READ_ONLY.filter((module) => module !== "dashboard").flatMap(
    (module) => coarseModule(module, module.replaceAll("_", " "), ["read"]),
  ),
  ...employerCatalog(),
  ...candidateCatalog(),
  ...jobCatalog(),
  ...teamCatalog(),
];

const CATALOG_BY_KEY = new Map(
  OPERATIONS_PERMISSION_CATALOG.map((item) => [item.key, item]),
);

export function isOperationsPermissionKey(key: string): boolean {
  return CATALOG_BY_KEY.has(key);
}

export function getOperationsPermissionDefinition(
  key: string,
): OperationsPermissionDefinition | undefined {
  return CATALOG_BY_KEY.get(key);
}

export function listOperationsPermissionKeys(): string[] {
  return OPERATIONS_PERMISSION_CATALOG.map((item) => item.key);
}

export function assertKnownPermissionKeys(keys: string[]): void {
  const unknown = keys.filter((key) => !isOperationsPermissionKey(key));
  if (unknown.length > 0) {
    throw new Error(`Unknown Operations permission keys: ${unknown.join(", ")}`);
  }
}

export function buildOperationsPermissionCatalogTree(): OperationsCatalogTreeNode[] {
  const moduleNodes = new Map<string, OperationsCatalogTreeNode>();

  for (const moduleKey of OPERATIONS_PERMISSION_MODULES) {
    moduleNodes.set(moduleKey, {
      key: moduleKey,
      label: moduleKey.replaceAll("_", " "),
      children: [],
    });
  }

  for (const item of OPERATIONS_PERMISSION_CATALOG) {
    const moduleNode = moduleNodes.get(item.module);
    if (!moduleNode) {
      continue;
    }

    const pageKey = item.page ? `${item.module}.${item.page}` : item.module;
    let pageNode = moduleNode.children.find((child) => child.key === pageKey);
    if (item.page) {
      if (!pageNode) {
        pageNode = {
          key: pageKey,
          label: item.page.replaceAll("_", " "),
          children: [],
        };
        moduleNode.children.push(pageNode);
      }
    } else {
      pageNode = moduleNode;
    }

    const sectionParent = pageNode;
    let actionParent = sectionParent;

    if (item.section) {
      const sectionKey = `${pageKey}.${item.section}`;
      let sectionNode = sectionParent.children.find(
        (child) => child.key === sectionKey,
      );
      if (!sectionNode) {
        sectionNode = {
          key: sectionKey,
          label: item.section.replaceAll("_", " "),
          children: [],
        };
        sectionParent.children.push(sectionNode);
      }
      actionParent = sectionNode;
    }

    if (item.field) {
      const fieldKey = `${actionParent.key}.${item.field}`;
      let fieldNode = actionParent.children.find(
        (child) => child.key === fieldKey,
      );
      if (!fieldNode) {
        fieldNode = {
          key: fieldKey,
          label: item.label.split(" · ").pop() ?? item.field,
          children: [],
        };
        actionParent.children.push(fieldNode);
      }
      fieldNode.children.push({
        key: item.key,
        label: item.action,
        children: [],
      });
    } else {
      actionParent.children.push({
        key: item.key,
        label: item.label.split(" · ").pop() ?? item.action,
        children: [],
      });
    }
  }

  return [...moduleNodes.values()].filter((node) => node.children.length > 0);
}

export const EMPLOYER_FIELD_PERMISSION_KEYS = {
  name: "employers.profile.fields.name.view",
  phone: "employers.profile.fields.phone.view",
  email: "employers.profile.fields.email.view",
  address: "employers.profile.fields.address.view",
  pan: "employers.profile.fields.pan.view",
  gst: "employers.profile.fields.gst.view",
  registrationNumber: "employers.profile.fields.registration_number.view",
} as const;

export const CANDIDATE_FIELD_PERMISSION_KEYS = {
  name: "candidates.profile.fields.name.view",
  phone: "candidates.profile.fields.phone.view",
  email: "candidates.profile.fields.email.view",
  location: "candidates.profile.fields.location.view",
} as const;

export const JOB_STATUS_ACTION_PERMISSION_KEYS = {
  approve: "jobs.detail.actions.approve",
  reject: "jobs.detail.actions.reject",
  pause: "jobs.detail.actions.pause",
  resume: "jobs.detail.actions.resume",
  close: "jobs.detail.actions.close",
  reactivate: "jobs.detail.actions.reactivate",
  publish: "jobs.detail.actions.publish",
  expire: "jobs.detail.actions.expire",
} as const;
