export type ThemePreference = "dark" | "light" | "system";

const storageKey = "brain-loop-theme";
const validPreferences = new Set<ThemePreference>(["dark", "light", "system"]);

function getSystemPrefersDark() {
  if (typeof window === "undefined" || !("matchMedia" in window)) {
    return true;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function loadThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "dark";
  }

  const stored = window.localStorage.getItem(storageKey);
  return validPreferences.has(stored as ThemePreference) ? (stored as ThemePreference) : "dark";
}

export function applyThemePreference(preference: ThemePreference) {
  if (typeof document === "undefined") {
    return;
  }

  const resolvedDark = preference === "dark" || (preference === "system" && getSystemPrefersDark());
  document.documentElement.classList.toggle("dark", resolvedDark);
  document.documentElement.dataset.theme = resolvedDark ? "dark" : "light";
  document.documentElement.style.colorScheme = resolvedDark ? "dark" : "light";
}

export function saveThemePreference(preference: ThemePreference) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey, preference);
  }

  applyThemePreference(preference);
}

