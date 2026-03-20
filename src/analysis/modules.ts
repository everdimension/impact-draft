/**
 * Extract the "module" from a file path.
 * Uses the first two directory segments as the module boundary.
 * e.g. "posthog/api/foo.py" → "posthog/api"
 *      "frontend/src/scenes/x.tsx" → "frontend/src"
 *      "README.md" → "."
 */
export function getModule(filepath: string): string {
  const parts = filepath.split("/");
  if (parts.length <= 1) return ".";
  if (parts.length === 2) return parts[0];
  return parts.slice(0, 2).join("/");
}

export function getModules(filepaths: string[]): string[] {
  return [...new Set(filepaths.map(getModule))];
}
