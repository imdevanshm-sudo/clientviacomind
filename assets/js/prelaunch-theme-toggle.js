/*
 * Pre-launch only theme toggle.
 * Remove this file include once final theme is decided for launch.
 */
(() => {
  const STORAGE_KEY = "viacom.prelaunch.theme";

  function applyTheme(theme) {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.setAttribute("data-prelaunch-theme", theme);
  }

  function getInitialTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
    return "light";
  }

  function createToggle(theme) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "prelaunch-theme-toggle";
    button.setAttribute("aria-live", "polite");

    const setButtonText = (mode) => {
      button.textContent = mode === "dark" ? "PRE-LAUNCH: DARK" : "PRE-LAUNCH: LIGHT";
    };

    setButtonText(theme);

    button.addEventListener("click", () => {
      const current = document.documentElement.classList.contains("dark") ? "dark" : "light";
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
      setButtonText(next);
    });

    document.body.appendChild(button);
  }

  const initialTheme = getInitialTheme();
  applyTheme(initialTheme);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => createToggle(initialTheme));
  } else {
    createToggle(initialTheme);
  }
})();
