import type { EnrichedPR, BugfixReport } from "./types";

function isCritical(pr: EnrichedPR): boolean {
  const labels = pr.labels.map((l) => l.toLowerCase());
  return labels.some(
    (l) =>
      l.includes("critical") ||
      l.includes("p0") ||
      l.includes("severity/critical") ||
      l.includes("urgent") ||
      l.includes("incident")
  );
}

/**
 * Analyze bugfix effectiveness for an engineer:
 * - Time to fix critical bugs (PR created → merged)
 * - Count of non-critical bugfixes
 * - Regressions: bugs in modules the same engineer recently changed
 */
export function analyzeBugfixEffectiveness(
  engineerPRs: EnrichedPR[],
  allEngineerPRs: EnrichedPR[]
): BugfixReport {
  const bugfixes = engineerPRs.filter((pr) => pr.category === "bugfix");

  const criticalFixes = bugfixes
    .filter(isCritical)
    .filter((pr) => pr.mergedAt)
    .map((pr) => ({
      pr,
      timeToFixDays:
        (new Date(pr.mergedAt!).getTime() - new Date(pr.createdAt).getTime()) /
        (1000 * 60 * 60 * 24),
    }));

  const nonCriticalFixes = bugfixes.filter((pr) => !isCritical(pr));

  // Detect regressions: bugs that touch modules the same engineer
  // recently shipped features/refactors into (within 30 days)
  const regressions: BugfixReport["regressions"] = [];
  const nonBugPRs = allEngineerPRs.filter(
    (pr) => pr.category === "feature" || pr.category === "refactor"
  );

  for (const bug of bugfixes) {
    if (!bug.mergedAt) continue;
    for (const original of nonBugPRs) {
      if (!original.mergedAt) continue;
      // Original must come before the bug
      if (new Date(original.mergedAt) >= new Date(bug.mergedAt)) continue;
      const daysDiff =
        (new Date(bug.mergedAt).getTime() -
          new Date(original.mergedAt).getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysDiff > 30) continue;
      const bugModules = new Set(bug.modules);
      if (original.modules.some((m) => bugModules.has(m))) {
        regressions.push({ originalPR: original, bugPR: bug });
        break; // link to first matching original only
      }
    }
  }

  return {
    criticalFixes,
    avgCriticalFixTimeDays:
      criticalFixes.length > 0
        ? criticalFixes.reduce((sum, f) => sum + f.timeToFixDays, 0) /
          criticalFixes.length
        : null,
    nonCriticalFixes,
    regressions,
  };
}
