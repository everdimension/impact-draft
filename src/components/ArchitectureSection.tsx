import { useState } from "react";
import type { ArchitecturalReport } from "../analysis/types";
import { PRLink } from "./PRLink";

export function ArchitectureSection({
  report,
}: {
  report: ArchitecturalReport;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="metric-section">
      <button className="section-toggle" onClick={() => setExpanded(!expanded)}>
        <span className="toggle-icon">{expanded ? "▾" : "▸"}</span>
        <h4>Architectural Quality</h4>
        <span className="section-summary">
          cohesion:{" "}
          {report.avgModulesPerPR !== null
            ? `${report.avgModulesPerPR.toFixed(1)} modules/PR`
            : "N/A"}
          , deletion boundary:{" "}
          {report.avgDeletionBoundary !== null
            ? report.avgDeletionBoundary.toFixed(1)
            : "N/A"}
          , coupling: {report.totalCrossCuts} cross-cuts
        </span>
      </button>

      {expanded && (
        <div className="section-body">
          <div className="metric-explanation">
            <strong>Cohesion</strong> = average modules touched per PR (lower =
            more focused changes). <strong>Deletion boundary</strong> = average
            modules with deletions per PR (lower = tighter cleanup scope).{" "}
            <strong>Coupling</strong> = total cross-module pairs across all PRs
            (each PR touching N modules creates N*(N-1)/2 pairs).
          </div>

          {report.cohesionDetails.length === 0 ? (
            <p className="empty">No PRs with file data.</p>
          ) : (
            <>
              <h5>Least cohesive PRs (most modules touched)</h5>
              <table className="evidence-table">
                <thead>
                  <tr>
                    <th>PR</th>
                    <th>Title</th>
                    <th>Modules</th>
                    <th>Del. boundary</th>
                  </tr>
                </thead>
                <tbody>
                  {[...report.cohesionDetails]
                    .sort(
                      (a, b) =>
                        b.modulesChanged.length - a.modulesChanged.length
                    )
                    .slice(0, 5)
                    .map((d) => (
                      <tr key={d.pr.number}>
                        <td>
                          <PRLink pr={d.pr} />
                        </td>
                        <td>{d.pr.title}</td>
                        <td>
                          {d.modulesChanged.length}
                          <span
                            className="module-list"
                            title={d.modulesChanged.join(", ")}
                          >
                            {" "}
                            ({d.modulesChanged.slice(0, 3).join(", ")}
                            {d.modulesChanged.length > 3 && "..."})
                          </span>
                        </td>
                        <td>{d.deletionBoundarySize}</td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {report.couplingDetails.length > 0 && (
                <>
                  <h5>Highest coupling PRs</h5>
                  <table className="evidence-table">
                    <thead>
                      <tr>
                        <th>PR</th>
                        <th>Title</th>
                        <th>Module pairs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...report.couplingDetails]
                        .sort(
                          (a, b) =>
                            b.modulePairs.length - a.modulePairs.length
                        )
                        .slice(0, 5)
                        .map((d) => (
                          <tr key={d.pr.number}>
                            <td>
                              <PRLink pr={d.pr} />
                            </td>
                            <td>{d.pr.title}</td>
                            <td>
                              {d.modulePairs.length} pairs
                              <span className="module-list">
                                {" "}
                                (
                                {d.modulePairs
                                  .slice(0, 2)
                                  .map((p) => p.join(" ↔ "))
                                  .join("; ")}
                                {d.modulePairs.length > 2 && "; ..."}
                                )
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
