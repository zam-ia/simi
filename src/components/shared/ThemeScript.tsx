export function ThemeScript() {
  const script = `
    try {
      var storedTheme = localStorage.getItem("simi-theme");
      var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.dataset.theme = storedTheme || (prefersDark ? "dark" : "light");
    } catch (_) {}
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
