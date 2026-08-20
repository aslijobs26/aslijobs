import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  OPERATIONS_THEME_CHANGE_EVENT,
  OPERATIONS_THEME_STORAGE_KEY,
  OPERATIONS_THEME_TRANSITION_MS,
  type OperationsTheme,
} from "../constants/operations-theme";
import {
  applyOperationsThemeToDocument,
  disableOperationsThemeTransition,
  enableOperationsThemeTransition,
  getStoredOperationsTheme,
  getSystemOperationsTheme,
  resolveOperationsTheme,
  setStoredOperationsTheme,
} from "../utils/operations-theme-storage";

interface OperationsThemeContextValue {
  theme: OperationsTheme;
  setTheme: (theme: OperationsTheme) => void;
  toggleTheme: () => void;
}

const OperationsThemeContext = createContext<OperationsThemeContextValue | null>(
  null,
);

function useThemeTransition(theme: OperationsTheme): void {
  const previousThemeRef = useRef(theme);
  const transitionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (previousThemeRef.current === theme) {
      return;
    }

    previousThemeRef.current = theme;
    enableOperationsThemeTransition();

    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
    }

    transitionTimeoutRef.current = window.setTimeout(() => {
      disableOperationsThemeTransition();
      transitionTimeoutRef.current = null;
    }, OPERATIONS_THEME_TRANSITION_MS);

    return () => {
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [theme]);
}

function readInitialOperationsTheme(): OperationsTheme {
  if (typeof document !== "undefined") {
    const fromDocument = document.documentElement.dataset.theme;

    if (fromDocument === "light" || fromDocument === "dark") {
      return fromDocument;
    }
  }

  return resolveOperationsTheme();
}

export function OperationsThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<OperationsTheme>(() => readInitialOperationsTheme());

  useThemeTransition(theme);

  const setTheme = useCallback((nextTheme: OperationsTheme) => {
    applyOperationsThemeToDocument(nextTheme);
    setStoredOperationsTheme(nextTheme);
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [setTheme, theme]);

  useEffect(() => {
    applyOperationsThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    const handleThemeChange = () => {
      setThemeState(resolveOperationsTheme());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === OPERATIONS_THEME_STORAGE_KEY) {
        handleThemeChange();
      }
    };

    window.addEventListener(OPERATIONS_THEME_CHANGE_EVENT, handleThemeChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(OPERATIONS_THEME_CHANGE_EVENT, handleThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = () => {
      if (getStoredOperationsTheme() !== null) {
        return;
      }

      const nextTheme = getSystemOperationsTheme();
      applyOperationsThemeToDocument(nextTheme);
      setThemeState(nextTheme);
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme],
  );

  return (
    <OperationsThemeContext.Provider value={value}>
      {children}
    </OperationsThemeContext.Provider>
  );
}

export function useOperationsTheme(): OperationsThemeContextValue {
  const context = useContext(OperationsThemeContext);

  if (!context) {
    throw new Error("useOperationsTheme must be used within OperationsThemeProvider");
  }

  return context;
}
