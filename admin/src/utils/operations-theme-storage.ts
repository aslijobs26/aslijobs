import {
  OPERATIONS_THEME_CHANGE_EVENT,
  OPERATIONS_THEME_STORAGE_KEY,
  type OperationsTheme,
} from "../constants/operations-theme";

function notifyThemeChange(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(OPERATIONS_THEME_CHANGE_EVENT));
}

export function getSystemOperationsTheme(): OperationsTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getStoredOperationsTheme(): OperationsTheme | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(OPERATIONS_THEME_STORAGE_KEY);

  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return null;
}

export function resolveOperationsTheme(): OperationsTheme {
  return getStoredOperationsTheme() ?? getSystemOperationsTheme();
}

export function setStoredOperationsTheme(theme: OperationsTheme): void {
  window.localStorage.setItem(OPERATIONS_THEME_STORAGE_KEY, theme);
  notifyThemeChange();
}

export function clearStoredOperationsTheme(): void {
  window.localStorage.removeItem(OPERATIONS_THEME_STORAGE_KEY);
  notifyThemeChange();
}

export function applyOperationsThemeToDocument(theme: OperationsTheme): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function enableOperationsThemeTransition(): void {
  document.documentElement.dataset.themeTransition = "true";
}

export function disableOperationsThemeTransition(): void {
  delete document.documentElement.dataset.themeTransition;
}
