import type { EnrichedPR, EngineerReport, PRCategory } from "./types";
import type { RawPRWithFiles } from "../api/github";
import { classifyPR } from "./classify";
import { getModules } from "./modules";
import { analyzeFeatureQuality } from "./feature-quality";
import { analyzeBugfixEffectiveness } from "./bugfix-effectiveness";
import { analyzeArchitecturalQuality } from "./architectural-quality";

function enrichPR(raw: RawPRWithFiles): EnrichedPR | null {
  if (!raw.user) return null;
  const { category, reason } = classifyPR(
    raw.title,
    raw.labels.map((l) => l.name)
  );
  return {
    number: raw.number,
    title: raw.title,
    author: raw.user.login,
    authorAvatarUrl: raw.user.avatar_url,
    authorUrl: raw.user.html_url,
    url: raw.html_url,
    createdAt: raw.created_at,
    mergedAt: raw.merged_at,
    labels: raw.labels.map((l) => l.name),
    files: raw.files,
    modules: getModules(raw.files.map((f) => f.filename)),
    category,
    categoryReason: reason,
  };
}

function minMaxNormalize(
  values: (number | null)[],
): number[] {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length === 0) return values.map(() => 0.5);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = max - min;
  return values.map((v) =>
    v === null ? 0 : range === 0 ? 0.5 : (v - min) / range
  );
}

/** Bayesian-smoothed min-max scoring. Each raw sub-score is normalized across
 *  the cohort, then blended toward the cohort mean based on sample size:
 *    effective = (n/(n+k)) * raw + (k/(n+k)) * mean
 *  This prevents engineers with very few PRs from dominating the ranking. */
const CONFIDENCE_K = 5;

function bayesianSmooth(
  raw: number,
  cohortMean: number,
  n: number,
): number {
  return (n / (n + CONFIDENCE_K)) * raw + (CONFIDENCE_K / (n + CONFIDENCE_K)) * cohortMean;
}

function computeSortScores(reports: EngineerReport[]): Map<string, number> {
  const featureRatios = reports.map((r) => r.featureQuality.ratio);
  const regressionRates = reports.map((r) =>
    r.totalPRs > 0
      ? 1 - r.bugfixEffectiveness.regressions.length / r.totalPRs
      : null
  );
  const focusScores = reports.map((r) => {
    const avg = r.architecturalQuality.avgModulesPerPR;
    return avg !== null ? 1 / avg : null;
  });

  const normFeature = minMaxNormalize(featureRatios);
  const normRegression = minMaxNormalize(regressionRates);
  const normFocus = minMaxNormalize(focusScores);

  // Compute cohort means for each normalized sub-score
  const mean = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const meanFeature = mean(normFeature);
  const meanRegression = mean(normRegression);
  const meanFocus = mean(normFocus);

  const scores = new Map<string, number>();
  for (let i = 0; i < reports.length; i++) {
    const n = reports[i].totalPRs;
    const score =
      0.4 * bayesianSmooth(normFeature[i], meanFeature, n) +
      0.3 * bayesianSmooth(normRegression[i], meanRegression, n) +
      0.3 * bayesianSmooth(normFocus[i], meanFocus, n);
    scores.set(reports[i].login, score);
  }
  return scores;
}

export function analyzeAll(rawPRs: RawPRWithFiles[]): EngineerReport[] {
  const allPRs = rawPRs
    .map(enrichPR)
    .filter((pr): pr is EnrichedPR => pr !== null);
  const allBugPRs = allPRs.filter((pr) => pr.category === "bugfix");

  const byAuthor = new Map<string, EnrichedPR[]>();
  for (const pr of allPRs) {
    const list = byAuthor.get(pr.author) || [];
    list.push(pr);
    byAuthor.set(pr.author, list);
  }

  const reports: EngineerReport[] = [];

  for (const [login, prs] of byAuthor) {
    const first = prs[0];
    const prsByCategory: Record<PRCategory, number> = {
      feature: 0,
      bugfix: 0,
      refactor: 0,
      other: 0,
    };
    for (const pr of prs) {
      prsByCategory[pr.category]++;
    }

    reports.push({
      login,
      avatarUrl: first.authorAvatarUrl,
      profileUrl: first.authorUrl,
      totalPRs: prs.length,
      prsByCategory,
      featureQuality: analyzeFeatureQuality(prs, allBugPRs),
      bugfixEffectiveness: analyzeBugfixEffectiveness(prs, prs),
      architecturalQuality: analyzeArchitecturalQuality(prs),
    });
  }

  const scores = computeSortScores(reports);
  reports.sort((a, b) => {
    const diff = (scores.get(b.login) ?? 0) - (scores.get(a.login) ?? 0);
    return diff !== 0 ? diff : b.totalPRs - a.totalPRs;
  });
  return reports;
}
