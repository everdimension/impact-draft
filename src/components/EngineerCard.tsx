import { useState } from "react";
import type { EngineerReport } from "../analysis/types";
import { FeatureQualitySection } from "./FeatureQualitySection";
import { BugfixSection } from "./BugfixSection";
import { ArchitectureSection } from "./ArchitectureSection";

export function EngineerCard({ report }: { report: EngineerReport }) {
  const [open, setOpen] = useState(false);
  const { prsByCategory: cat } = report;

  return (
    <div className="engineer-card">
      <button className="engineer-header" onClick={() => setOpen(!open)}>
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
          <div className="pr-breakdown">
            <span className="total">{report.totalPRs} PRs</span>
            {cat.feature > 0 && (
              <span className="cat-feature">{cat.feature} feat</span>
            )}
            {cat.bugfix > 0 && (
              <span className="cat-bugfix">{cat.bugfix} fix</span>
            )}
            {cat.refactor > 0 && (
              <span className="cat-refactor">{cat.refactor} refactor</span>
            )}
            {cat.other > 0 && (
              <span className="cat-other">{cat.other} other</span>
            )}
          </div>
        </div>
        <span className="expand-icon">{open ? "▾" : "▸"}</span>
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
