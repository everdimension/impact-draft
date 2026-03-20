import { useState } from "react";
import type { BugfixReport } from "../analysis/types";
import { PRLink } from "./PRLink";

export function BugfixSection({ report }: { report: BugfixReport }) {
  const [expanded, setExpanded] = useState(false);

  const criticalCount = report.criticalFixes.length;
  const avgTime = report.avgCriticalFixTimeDays;

  return (
    <div className="metric-section">
      <button className="section-toggle" onClick={() => setExpanded(!expanded)}>
        <span className="toggle-icon">{expanded ? "▾" : "▸"}</span>
        <h4>Bugfix Effectiveness</h4>
        <span className="section-summary">
          {criticalCount} critical fixes
          {avgTime !== null && ` (avg ${avgTime.toFixed(1)}d)`},{" "}
          {report.nonCriticalFixes.length} non-critical,{" "}
          {report.regressions.length} regressions
        </span>
      </button>

      {expanded && (
        <div className="section-body">
          <div className="metric-explanation">
            <strong>How this works:</strong> Critical bugs are identified by
            labels (critical, p0, urgent, incident). Fix time = PR created →
            merged. Regressions = bugs in modules the same engineer recently
            changed (within 30 days).
          </div>

          {criticalCount > 0 && (
            <>
              <h5>
                Critical bugfixes ({criticalCount}) — avg{" "}
                {avgTime!.toFixed(1)} days to merge
              </h5>
              <table className="evidence-table">
                <thead>
                  <tr>
                    <th>PR</th>
                    <th>Title</th>
                    <th>Time to fix</th>
                  </tr>
                </thead>
                <tbody>
                  {report.criticalFixes.map(({ pr, timeToFixDays }) => (
                    <tr key={pr.number}>
                      <td>
                        <PRLink pr={pr} />
                      </td>
                      <td>{pr.title}</td>
                      <td>{timeToFixDays.toFixed(1)} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {report.nonCriticalFixes.length > 0 && (
            <>
              <h5>Non-critical bugfixes ({report.nonCriticalFixes.length})</h5>
              <ul className="evidence-list">
                {report.nonCriticalFixes.map((pr) => (
                  <li key={pr.number}>
                    <PRLink pr={pr} /> {pr.title}
                  </li>
                ))}
              </ul>
            </>
          )}

          {report.regressions.length > 0 && (
            <>
              <h5>Potential regressions ({report.regressions.length})</h5>
              <table className="evidence-table">
                <thead>
                  <tr>
                    <th>Original PR</th>
                    <th>Bug PR</th>
                  </tr>
                </thead>
                <tbody>
                  {report.regressions.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <PRLink pr={r.originalPR} /> {r.originalPR.title}
                      </td>
                      <td>
                        <PRLink pr={r.bugPR} /> {r.bugPR.title}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {criticalCount === 0 &&
            report.nonCriticalFixes.length === 0 &&
            report.regressions.length === 0 && (
              <p className="empty">No bugfix PRs in this period.</p>
            )}
        </div>
      )}
    </div>
  );
}
