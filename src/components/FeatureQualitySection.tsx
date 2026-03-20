import { useState } from "react";
import type { FeatureQualityReport } from "../analysis/types";
import { PRLink } from "./PRLink";

export function FeatureQualitySection({
  report,
}: {
  report: FeatureQualityReport;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="metric-section">
      <button className="section-toggle" onClick={() => setExpanded(!expanded)}>
        <span className="toggle-icon">{expanded ? "▾" : "▸"}</span>
        <h4>Feature Quality</h4>
        <span className="section-summary">
          {report.featuresShipped.length} features,{" "}
          {report.linkedBugs.length} linked bugs,{" "}
          ratio:{" "}
          {report.ratio !== null ? report.ratio.toFixed(2) : "N/A"}
        </span>
      </button>

      {expanded && (
        <div className="section-body">
          <div className="metric-explanation">
            <strong>How this works:</strong> Each feature PR is matched to
            subsequent bug PRs (within 90 days) that touch overlapping modules.
            Bugs are weighted by severity (critical=3, major=2, minor=1). Ratio
            = features / weighted bug score (higher is better).
          </div>

          {report.featuresShipped.length === 0 ? (
            <p className="empty">No feature PRs in this period.</p>
          ) : (
            <>
              <h5>Features shipped ({report.featuresShipped.length})</h5>
              <ul className="evidence-list">
                {report.featuresShipped.map((pr) => (
                  <li key={pr.number}>
                    <PRLink pr={pr} /> {pr.title}
                    <span className="classification-reason">
                      ({pr.categoryReason})
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {report.linkedBugs.length > 0 && (
            <>
              <h5>
                Linked bugs ({report.linkedBugs.length}, weighted score:{" "}
                {report.weightedBugScore})
              </h5>
              <table className="evidence-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Bug</th>
                    <th>Severity</th>
                    <th>Days after</th>
                    <th>Shared modules</th>
                  </tr>
                </thead>
                <tbody>
                  {report.linkedBugs.map((link, i) => (
                    <tr key={i}>
                      <td>
                        <PRLink pr={link.featurePR} />
                      </td>
                      <td>
                        <PRLink pr={link.bugPR} />{" "}
                        <span className="pr-title-inline">
                          {link.bugPR.title}
                        </span>
                      </td>
                      <td>
                        <span className={`severity sev-${link.severity}`}>
                          {link.severity}
                        </span>
                      </td>
                      <td>{link.daysBetween}d</td>
                      <td className="module-list">
                        {link.overlappingModules.join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}
