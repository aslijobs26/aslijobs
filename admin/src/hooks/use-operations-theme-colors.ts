import { useMemo } from "react";
import { OPERATIONS_THEME_CSS_VARIABLES } from "../constants/operations-theme";
import { useOperationsTheme } from "../providers/theme-provider";
import { readOperationsCssColor } from "../utils/operations-css-color";

export function useOperationsThemeColors() {
  const { theme } = useOperationsTheme();

  return useMemo(
    () => ({
      primary: readOperationsCssColor(OPERATIONS_THEME_CSS_VARIABLES.primary, "#0e8585"),
      borderSubtle: readOperationsCssColor(
        OPERATIONS_THEME_CSS_VARIABLES.borderSubtle,
        "#eef1f3",
      ),
      danger: readOperationsCssColor(OPERATIONS_THEME_CSS_VARIABLES.danger, "#dc2626"),
      warning: readOperationsCssColor(OPERATIONS_THEME_CSS_VARIABLES.warning, "#ea580c"),
      success: readOperationsCssColor(OPERATIONS_THEME_CSS_VARIABLES.success, "#16a34a"),
      chartAccent: readOperationsCssColor(OPERATIONS_THEME_CSS_VARIABLES.chartAccent, "#2563eb"),
      chartAccentAlt: readOperationsCssColor(
        OPERATIONS_THEME_CSS_VARIABLES.chartAccentAlt,
        "#7c3aed",
      ),
    }),
    [theme],
  );
}
