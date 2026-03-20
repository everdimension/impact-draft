export type PRCategory = "feature" | "bugfix" | "refactor" | "other";
export type BugSeverity = "critical" | "major" | "minor";

export interface PRFile {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
  status: string;
}

export interface EnrichedPR {
  number: number;
  title: string;
  author: string;
  authorAvatarUrl: string;
  authorUrl: string;
  url: string;
  createdAt: string;
  mergedAt: string | null;
  labels: string[];
  files: PRFile[];
  modules: string[];
  category: PRCategory;
  categoryReason: string;
}

export interface BugLink {
  featurePR: EnrichedPR;
  bugPR: EnrichedPR;
  overlappingModules: string[];
  severity: BugSeverity;
  daysBetween: number;
}

export interface FeatureQualityReport {
  featuresShipped: EnrichedPR[];
  linkedBugs: BugLink[];
  weightedBugScore: number;
  /** features / max(weightedBugScore, 1). null if no features. */
  ratio: number | null;
}

export interface BugfixReport {
  criticalFixes: { pr: EnrichedPR; timeToFixDays: number }[];
  avgCriticalFixTimeDays: number | null;
  nonCriticalFixes: EnrichedPR[];
  regressions: { originalPR: EnrichedPR; bugPR: EnrichedPR }[];
}

export interface CohesionDetail {
  pr: EnrichedPR;
  modulesChanged: string[];
  deletionBoundarySize: number;
}

export interface CouplingDetail {
  pr: EnrichedPR;
  modulePairs: [string, string][];
}

export interface ArchitecturalReport {
  avgModulesPerPR: number | null;
  avgDeletionBoundary: number | null;
  cohesionDetails: CohesionDetail[];
  couplingDetails: CouplingDetail[];
  totalCrossCuts: number;
}

export interface EngineerReport {
  login: string;
  avatarUrl: string;
  profileUrl: string;
  totalPRs: number;
  prsByCategory: Record<PRCategory, number>;
  featureQuality: FeatureQualityReport;
  bugfixEffectiveness: BugfixReport;
  architecturalQuality: ArchitecturalReport;
}
