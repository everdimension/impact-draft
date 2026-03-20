import { useState } from "react";
import type { EngineerReport, PRCategory } from "../analysis/types";
import { FeatureQualitySection } from "./FeatureQualitySection";
import { BugfixSection } from "./BugfixSection";
import { ArchitectureSection } from "./ArchitectureSection";

const categoryLabels: Record<PRCategory, string> = {
  feature: "features",
  bugfix: "fixes",
  refactor: "refactors",
  other: "other",
};

function getDominantCategory(
  prsByCategory: Record<PRCategory, number>,
): string {
  let max = 0;
  let dominant: PRCategory = "other";
  for (const [cat, count] of Object.entries(prsByCategory) as [
    PRCategory,
    number,
  ][]) {
    if (count > max) {
      max = count;
      dominant = cat;
    }
  }
  return categoryLabels[dominant];
}

export function EngineerCard({ report, rank }: { report: EngineerReport; rank: number }) {
  const [open, setOpen] = useState(false);

  const qualityRatio = report.featureQuality.ratio;
  const regressionCount = report.bugfixEffectiveness.regressions.length;
  const avgModules = report.architecturalQuality.avgModulesPerPR;

  return (
    <div className="engineer-card" data-login={report.login}>
      <button className="engineer-header" onClick={() => setOpen(!open)}>
        <span className="engineer-rank">{rank}</span>
        <img
          className="avatar"
          src={report.avatarUrl}
          alt=""
          width={36}
          height={36}
        />
        <div className="engineer-info">
          <a
            href={report.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="engineer-name"
            onClick={(e) => e.stopPropagation()}
          >
            {report.login}
          </a>
          <span className="pr-summary">
            {report.totalPRs} PRs &mdash; mostly{" "}
            {getDominantCategory(report.prsByCategory)}
          </span>
        </div>
        <div className="metric-chips">
          <div className="metric-chip">
            <span
              className="metric-value"
              style={
                qualityRatio !== null && qualityRatio < 1
                  ? { color: "#b45309" }
                  : undefined
              }
            >
              {qualityRatio !== null ? qualityRatio.toFixed(1) : "--"}
            </span>
            <span className="metric-label">quality</span>
          </div>
          <div className="metric-chip">
            <span
              className="metric-value"
              style={
                regressionCount > 0 ? { color: "#dc2626" } : undefined
              }
            >
              {regressionCount}
            </span>
            <span className="metric-label">regr</span>
          </div>
          <div className="metric-chip">
            <span className="metric-value">
              {avgModules !== null ? avgModules.toFixed(1) : "--"}
            </span>
            <span className="metric-label">mod/PR</span>
          </div>
        </div>
        <svg className="expand-icon" viewBox="0 0 16 16" width="16" height="16" style={{ transform: open ? "rotate(90deg)" : undefined, transition: "transform 0.15s" }}><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>

      {open && (
        <div className="engineer-body">
          <FeatureQualitySection report={report.featureQuality} />
          <BugfixSection report={report.bugfixEffectiveness} />
          <ArchitectureSection report={report.architecturalQuality} />
        </div>
      )}
    </div>
  );
}
