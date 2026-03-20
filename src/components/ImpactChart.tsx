import { useState } from "react";
import type { EngineerReport } from "../analysis/types";

const AVATAR_SIZE = 18;
const AVATAR_X = 3;
const BAR_LEFT = 28;
const BAR_RIGHT = 380;
const HALF_WIDTH = (BAR_RIGHT - BAR_LEFT) / 2; // 176
const CENTER_X = BAR_LEFT + HALF_WIDTH; // 204
const RIGHT_LABEL_X = 386;
const SVG_W = 430;
const HEADER_H = 28;
const ROW_H = 24;
const BAR_H = 16;
const FOOTER_H = 8;
const COLLAPSED_ROWS = 8;
const WIDE_QUERY = "(min-width: 1200px)";

const GREEN = "#16a34a";
const AMBER = "#b45309";
const GRAY = "#9ca3af";

function ratioToX(ratio: number, maxRatio: number): number {
  if (ratio <= 1) return BAR_LEFT + (ratio / 1) * HALF_WIDTH;
  const effectiveMax = maxRatio <= 1 ? 2 : maxRatio;
  return CENTER_X + ((ratio - 1) / (effectiveMax - 1)) * HALF_WIDTH;
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
  const svgH = HEADER_H + visibleReports.length * ROW_H + FOOTER_H;

  return (
    <div className="impact-chart">
      <svg
        viewBox={`0 0 ${SVG_W} ${svgH}`}
        role="img"
        aria-label="Quality ratio chart"
      >
        <defs>
          <clipPath id="avatar-clip" clipPathUnits="objectBoundingBox">
            <circle cx="0.5" cy="0.5" r="0.5" />
          </clipPath>
        </defs>

        {/* Bar area background */}
        <rect
          x={BAR_LEFT}
          y={HEADER_H}
          width={BAR_RIGHT - BAR_LEFT}
          height={visibleReports.length * ROW_H}
          fill="var(--code-bg)"
          rx={3}
        />

        {/* Axis labels */}
        <text
          x={BAR_LEFT}
          y={18}
          fontSize={11}
          fill="var(--text)"
          textAnchor="middle"
        >
          0
        </text>
        <text
          x={CENTER_X}
          y={18}
          fontSize={11}
          fill="var(--text-h)"
          fontWeight={700}
          textAnchor="middle"
        >
          1.0
        </text>
        <text
          x={BAR_RIGHT}
          y={18}
          fontSize={11}
          fill="var(--text)"
          textAnchor="middle"
        >
          {displayMax.toFixed(1)}
        </text>

        {/* Center line */}
        <line
          x1={CENTER_X}
          y1={HEADER_H}
          x2={CENTER_X}
          y2={HEADER_H + visibleReports.length * ROW_H}
          stroke="var(--text)"
          strokeWidth={1}
          strokeDasharray="3,3"
          opacity={0.5}
        />

        {/* Rows */}
        {visibleReports.map((r, i) => {
          const y = HEADER_H + i * ROW_H;
          const ratio = r.featureQuality.ratio;
          const textY = y + ROW_H / 2 + 4;
          const avatarY = y + (ROW_H - AVATAR_SIZE) / 2;
          const tooltipText = `${r.login} (${r.totalPRs})`;
          const tooltipX = AVATAR_X + AVATAR_SIZE + 4;
          const tooltipW = tooltipText.length * 6.6 + 10;

          return (
            <g key={r.login}>
              {/* Avatar + tooltip */}
              <g className="chart-avatar-group">
                <image
                  href={`${r.avatarUrl}&s=36`}
                  x={AVATAR_X}
                  y={avatarY}
                  width={AVATAR_SIZE}
                  height={AVATAR_SIZE}
                  clipPath="url(#avatar-clip)"
                />
                <g className="chart-tooltip">
                  <rect
                    x={tooltipX}
                    y={avatarY}
                    width={tooltipW}
                    height={AVATAR_SIZE}
                    rx={4}
                    fill="var(--text-h)"
                  />
                  <text
                    x={tooltipX + 5}
                    y={textY}
                    fontSize={11}
                    fontFamily="var(--mono)"
                    fill="var(--bg)"
                  >
                    {tooltipText}
                  </text>
                </g>
              </g>

              {ratio === null ? (
                <>
                  <line
                    x1={CENTER_X - 4}
                    y1={y + ROW_H / 2}
                    x2={CENTER_X + 4}
                    y2={y + ROW_H / 2}
                    stroke={GRAY}
                    strokeWidth={2}
                  />
                  <text
                    x={RIGHT_LABEL_X}
                    y={textY}
                    fontSize={11}
                    fontFamily="var(--mono)"
                    fill={GRAY}
                    textAnchor="start"
                  >
                    --
                  </text>
                </>
              ) : (
                <>
                  {(() => {
                    const barX = ratioToX(Math.min(ratio, 1), maxRatio);
                    const barEndX = ratioToX(Math.max(ratio, 1), maxRatio);
                    const w = Math.max(barEndX - barX, 2);
                    const color = ratio >= 1 ? GREEN : AMBER;

                    return (
                      <rect
                        x={barX}
                        y={y + (ROW_H - BAR_H) / 2}
                        width={w}
                        height={BAR_H}
                        fill={color}
                        rx={2}
                        opacity={0.85}
                      />
                    );
                  })()}
                  <text
                    x={RIGHT_LABEL_X}
                    y={textY}
                    fontSize={11}
                    fontFamily="var(--mono)"
                    fill={ratio >= 1 ? GREEN : AMBER}
                    textAnchor="start"
                  >
                    {ratio.toFixed(1)}
                  </text>
                </>
              )}

            </g>
          );
        })}
      </svg>

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
