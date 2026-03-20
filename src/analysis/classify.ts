import type { PRCategory } from "./types";

const BUG_LABELS = [
  "bug",
  "fix",
  "bugfix",
  "hotfix",
  "regression",
  "incident",
];
const FEATURE_LABELS = ["feature", "enhancement", "new feature", "feat"];
const REFACTOR_LABELS = [
  "refactor",
  "tech-debt",
  "cleanup",
  "chore",
  "maintenance",
  "internal",
];

const BUG_TITLE_PATTERNS: [RegExp, string][] = [
  [/\bfix(es|ed|ing)?\s/i, "fix"],
  [/\bbug\b/i, "bug"],
  [/\bhotfix\b/i, "hotfix"],
  [/\bregression\b/i, "regression"],
];

const FEATURE_TITLE_PATTERNS: [RegExp, string][] = [
  [/\bfeat(\(|:|\b)/i, "feat"],
  [/\bimplement(s|ed|ing)?\b/i, "implement"],
  [/\bintroduc(e|es|ed|ing)\b/i, "introduce"],
  [/\badd(s|ed|ing)?\s/i, "add"],
  [/\bnew\s/i, "new"],
];

const REFACTOR_TITLE_PATTERNS: [RegExp, string][] = [
  [/\brefactor(s|ed|ing)?\b/i, "refactor"],
  [/\bclean\s?up\b/i, "cleanup"],
  [/\brestructur(e|ed|ing)\b/i, "restructure"],
  [/\bchore(\(|:|\b)/i, "chore"],
  [/\bmigrat(e|es|ed|ing|ion)\b/i, "migration"],
];

export function classifyPR(
  title: string,
  labels: string[]
): { category: PRCategory; reason: string } {
  const lowerLabels = labels.map((l) => l.toLowerCase());

  // Label-based (highest confidence)
  for (const keyword of BUG_LABELS) {
    const match = labels.find((l) => lowerLabels[labels.indexOf(l)].includes(keyword));
    if (match) return { category: "bugfix", reason: `label: "${match}"` };
  }
  for (const keyword of FEATURE_LABELS) {
    const match = labels.find((l) => lowerLabels[labels.indexOf(l)].includes(keyword));
    if (match) return { category: "feature", reason: `label: "${match}"` };
  }
  for (const keyword of REFACTOR_LABELS) {
    const match = labels.find((l) => lowerLabels[labels.indexOf(l)].includes(keyword));
    if (match) return { category: "refactor", reason: `label: "${match}"` };
  }

  // Title-based
  for (const [pattern, name] of BUG_TITLE_PATTERNS) {
    if (pattern.test(title))
      return { category: "bugfix", reason: `title keyword: "${name}"` };
  }
  for (const [pattern, name] of FEATURE_TITLE_PATTERNS) {
    if (pattern.test(title))
      return { category: "feature", reason: `title keyword: "${name}"` };
  }
  for (const [pattern, name] of REFACTOR_TITLE_PATTERNS) {
    if (pattern.test(title))
      return { category: "refactor", reason: `title keyword: "${name}"` };
  }

  return { category: "other", reason: "no matching labels or title patterns" };
}
