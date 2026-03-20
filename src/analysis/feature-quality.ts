import type {
  EnrichedPR,
  BugLink,
  FeatureQualityReport,
  BugSeverity,
} from "./types";

/** Bug must appear within this many days after a feature to be linked */
const BUG_WINDOW_DAYS = 90;

const SEVERITY_WEIGHTS: Record<BugSeverity, number> = {
  critical: 3,
  major: 2,
  minor: 1,
};

function getSeverity(pr: EnrichedPR): BugSeverity {
  const labels = pr.labels.map((l) => l.toLowerCase());
  if (
    labels.some(
      (l) =>
        l.includes("critical") ||
        l.includes("p0") ||
        l.includes("severity/critical")
    )
  )
    return "critical";
  if (
    labels.some(
      (l) =>
        l.includes("major") ||
        l.includes("p1") ||
        l.includes("severity/major") ||
        l.includes("high")
    )
  )
    return "major";
  return "minor";
}

function daysBetween(a: string, b: string): number {
  return (
    Math.abs(new Date(a).getTime() - new Date(b).getTime()) /
    (1000 * 60 * 60 * 24)
  );
}

function modulesOverlap(a: string[], b: string[]): string[] {
  const setB = new Set(b);
  return a.filter((m) => setB.has(m));
}

/**
 * For each feature PR by this engineer, find bug PRs (by anyone)
 * merged within BUG_WINDOW_DAYS that share at least one module.
 */
export function analyzeFeatureQuality(
  engineerPRs: EnrichedPR[],
  allBugPRs: EnrichedPR[]
): FeatureQualityReport {
  const features = engineerPRs.filter((pr) => pr.category === "feature");
  const linkedBugs: BugLink[] = [];

  for (const feature of features) {
    if (!feature.mergedAt) continue;
    for (const bug of allBugPRs) {
      if (!bug.mergedAt) continue;
      // Bug must come after the feature merge
      if (new Date(bug.mergedAt) <= new Date(feature.mergedAt)) continue;
      const days = daysBetween(feature.mergedAt, bug.mergedAt);
      if (days > BUG_WINDOW_DAYS) continue;
      const overlap = modulesOverlap(feature.modules, bug.modules);
      if (overlap.length > 0) {
        linkedBugs.push({
          featurePR: feature,
          bugPR: bug,
          overlappingModules: overlap,
          severity: getSeverity(bug),
          daysBetween: Math.round(days),
        });
      }
    }
  }

  const weightedBugScore = linkedBugs.reduce(
    (sum, b) => sum + SEVERITY_WEIGHTS[b.severity],
    0
  );

  return {
    featuresShipped: features,
    linkedBugs,
    weightedBugScore,
    ratio:
      features.length > 0
        ? features.length / Math.max(weightedBugScore, 1)
        : null,
  };
}
