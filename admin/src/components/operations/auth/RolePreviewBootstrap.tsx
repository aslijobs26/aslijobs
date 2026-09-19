import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RolePreviewPermissionProvider } from "../../../providers/role-preview-permission-provider";
import {
  clearRolePreviewDraft,
  loadRolePreviewDraft,
  type OperationsRolePreviewDraft,
} from "../../../utils/operations-role-preview";

type RolePreviewBootstrapProps = {
  children: ReactNode;
};

/**
 * When a preview draft exists in sessionStorage, overlay preview permissions
 * on top of the real session for the entire Operations shell.
 */
export function RolePreviewBootstrap({ children }: RolePreviewBootstrapProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [draft, setDraft] = useState<OperationsRolePreviewDraft | null>(() =>
    loadRolePreviewDraft(),
  );

  useEffect(() => {
    setDraft(loadRolePreviewDraft());
  }, [location.pathname]);

  if (!draft) {
    return <>{children}</>;
  }

  const exitPreview = () => {
    const returnPath = draft.returnPath;
    clearRolePreviewDraft();
    setDraft(null);
    navigate(returnPath);
  };

  return (
    <RolePreviewPermissionProvider draft={draft}>
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col pt-[4.5rem] sm:pt-[3.75rem]">
        <div
          role="status"
          className="fixed inset-x-0 top-0 z-[60] border-b border-warning/30 bg-warning/15 px-3 py-2.5 text-[12px] text-foreground sm:px-4"
        >
          <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-semibold">
                Previewing role: {draft.roleName}
              </p>
              <p className="text-[11px] text-muted">
                {draft.unsaved
                  ? "Showing unsaved permission changes. "
                  : "Showing currently saved permissions. "}
                This is a read-only preview. No actions will be executed.
              </p>
            </div>
            <button
              type="button"
              onClick={exitPreview}
              className="h-8 shrink-0 rounded-lg border border-border-subtle bg-surface px-3 text-[11px] font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Exit Preview
            </button>
          </div>
        </div>
        {children}
      </div>
    </RolePreviewPermissionProvider>
  );
}
