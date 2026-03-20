import type { CSSProperties } from "react";
import { useState } from "react";
import type { EngineerReport } from "../analysis/types";

const COLLAPSED_ROWS = 8;
const WIDE_QUERY = "(min-width: 1200px)";

const GREEN = "#16a34a";
const AMBER = "#b45309";
const GRAY = "#9ca3af";

function barStyle(ratio: number, maxRatio: number): CSSProperties {
  if (ratio <= 1) {
    const leftPct = ratio * 50;
    return { left: `${leftPct}%`, width: `${50 - leftPct}%`, backgroundColor: AMBER };
  }
  const effectiveMax = maxRatio <= 1 ? 2 : maxRatio;
  const widthPct = ((ratio - 1) / (effectiveMax - 1)) * 50;
  return { left: "50%", width: `${widthPct}%`, backgroundColor: GREEN };
}

const isDesktop = () => window.matchMedia(WIDE_QUERY).matches;

export function ImpactChart({ reports }: { reports: EngineerReport[] }) {
  const [expanded, setExpanded] = useState(isDesktop);

  // Scale from ALL reports so it doesn't shift on expand
  const ratios = reports.map((r) => r.featureQuality.ratio);
  const validRatios = ratios.filter((r): r is number => r !== null);
  const maxRatio = validRatios.length > 0 ? Math.max(...validRatios) : 2;
  const displayMax = maxRatio <= 1 ? 2 : maxRatio;

  const collapsible = reports.length > COLLAPSED_ROWS;
  const visibleReports =
    expanded || !collapsible ? reports : reports.slice(0, COLLAPSED_ROWS);

  return (
    <div className="impact-chart">
      {/* Axis */}
      <div className="chart-row chart-axis">
        <div className="chart-avatar-spacer" />
        <div className="chart-axis-labels">
          <span className="chart-axis-label" style={{ left: 0 }}>0</span>
          <span className="chart-axis-label chart-axis-center" style={{ left: "50%" }}>1.0</span>
          <span className="chart-axis-label" style={{ right: 0, left: "auto", transform: "translateX(50%)" }}>{displayMax.toFixed(1)}</span>
        </div>
        <div className="chart-value-spacer" />
      </div>

      {/* Rows */}
      {visibleReports.map((r) => {
        const ratio = r.featureQuality.ratio;
        return (
          <div key={r.login} className="chart-row" data-login={r.login}>
            <div className="chart-avatar-group">
              <img
                className="chart-avatar"
                src={`${r.avatarUrl}&s=40`}
                alt=""
                width={22}
                height={22}
              />
              <span className="chart-tooltip">
                {r.login} ({r.totalPRs})
              </span>
            </div>
            <div className="chart-bar-area">
              {ratio === null ? (
                <div className="chart-dash" />
              ) : (
                <div className="chart-bar" style={barStyle(ratio, maxRatio)} />
              )}
            </div>
            <span
              className="chart-value"
              style={{ color: ratio === null ? GRAY : ratio >= 1 ? GREEN : AMBER }}
            >
              {ratio === null ? "--" : ratio.toFixed(1)}
            </span>
          </div>
        );
      })}

      {collapsible && (
        <button
          className="chart-expand-btn"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show less" : `Show all ${reports.length}`}
        </button>
      )}
    </div>
  );
}
