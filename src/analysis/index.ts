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

  reports.sort((a, b) => b.totalPRs - a.totalPRs);
  return reports;
}
