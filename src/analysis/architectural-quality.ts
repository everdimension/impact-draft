import type {
  EnrichedPR,
  ArchitecturalReport,
  CohesionDetail,
  CouplingDetail,
} from "./types";
import { getModules } from "./modules";

function getModulePairs(modules: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  const sorted = [...modules].sort();
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      pairs.push([sorted[i], sorted[j]]);
    }
  }
  return pairs;
}

/**
 * Cohesion: how localized are the engineer's changes?
 *   - Modules per PR (fewer = more cohesive)
 *   - Deletion boundary: modules with deletions per PR (fewer = tighter cleanup)
 *
 * Coupling: how many cross-module connections do PRs introduce?
 *   - Each PR touching N modules creates N*(N-1)/2 module pairs
 *   - Total cross-cuts = sum of all such pairs
 */
export function analyzeArchitecturalQuality(
  engineerPRs: EnrichedPR[]
): ArchitecturalReport {
  const prsWithFiles = engineerPRs.filter((pr) => pr.files.length > 0);

  if (prsWithFiles.length === 0) {
    return {
      avgModulesPerPR: null,
      avgDeletionBoundary: null,
      cohesionDetails: [],
      couplingDetails: [],
      totalCrossCuts: 0,
    };
  }

  const cohesionDetails: CohesionDetail[] = prsWithFiles.map((pr) => {
    const filesWithDeletions = pr.files
      .filter((f) => f.deletions > 0)
      .map((f) => f.filename);
    const deletionModules = getModules(filesWithDeletions);
    return {
      pr,
      modulesChanged: pr.modules,
      deletionBoundarySize: deletionModules.length,
    };
  });

  const couplingDetails: CouplingDetail[] = prsWithFiles
    .filter((pr) => pr.modules.length > 1)
    .map((pr) => ({
      pr,
      modulePairs: getModulePairs(pr.modules),
    }));

  const avgModulesPerPR =
    cohesionDetails.reduce((sum, d) => sum + d.modulesChanged.length, 0) /
    cohesionDetails.length;

  const avgDeletionBoundary =
    cohesionDetails.reduce((sum, d) => sum + d.deletionBoundarySize, 0) /
    cohesionDetails.length;

  const totalCrossCuts = couplingDetails.reduce(
    (sum, d) => sum + d.modulePairs.length,
    0
  );

  return {
    avgModulesPerPR,
    avgDeletionBoundary,
    cohesionDetails,
    couplingDetails,
    totalCrossCuts,
  };
}
