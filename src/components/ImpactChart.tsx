import type { EngineerReport } from "../analysis/types";

const LEFT_LABEL_END = 136;
const BAR_LEFT = 140;
const BAR_RIGHT = 660;
const HALF_WIDTH = (BAR_RIGHT - BAR_LEFT) / 2; // 260
const CENTER_X = BAR_LEFT + HALF_WIDTH; // 400
const RIGHT_LABEL_X = 664;
const HEADER_H = 28;
const ROW_H = 24;
const BAR_H = 16;
const FOOTER_H = 8;
const SVG_W = 800;

const GREEN = "#16a34a";
const AMBER = "#b45309";
const GRAY = "#9ca3af";

function ratioToX(ratio: number, maxRatio: number): number {
  if (ratio <= 1) return BAR_LEFT + (ratio / 1) * HALF_WIDTH;
  const effectiveMax = maxRatio <= 1 ? 2 : maxRatio;
  return CENTER_X + ((ratio - 1) / (effectiveMax - 1)) * HALF_WIDTH;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "\u2026" : s;
}

export function ImpactChart({ reports }: { reports: EngineerReport[] }) {
  const ratios = reports.map((r) => r.featureQuality.ratio);
  const validRatios = ratios.filter((r): r is number => r !== null);
  const maxRatio = validRatios.length > 0 ? Math.max(...validRatios) : 2;
  const displayMax = maxRatio <= 1 ? 2 : maxRatio;

  const svgH = HEADER_H + reports.length * ROW_H + FOOTER_H;

  return (
    <div className="impact-chart">
      <svg
        viewBox={`0 0 ${SVG_W} ${svgH}`}
        width="100%"
        height="auto"
        role="img"
        aria-label="Quality ratio chart"
      >
        {/* Bar area background */}
        <rect
          x={BAR_LEFT}
          y={HEADER_H}
          width={BAR_RIGHT - BAR_LEFT}
          height={reports.length * ROW_H}
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
          y2={HEADER_H + reports.length * ROW_H}
          stroke="var(--text)"
          strokeWidth={1}
          strokeDasharray="3,3"
          opacity={0.5}
        />

        {/* Rows */}
        {reports.map((r, i) => {
          const y = HEADER_H + i * ROW_H;
          const ratio = r.featureQuality.ratio;
          const textY = y + ROW_H / 2 + 4;

          return (
            <g key={r.login}>
              {/* Name label */}
              <text
                x={LEFT_LABEL_END}
                y={textY}
                fontSize={12}
                fontFamily="var(--mono)"
                fill="var(--text-h)"
                textAnchor="end"
              >
                {truncate(r.login, 14)} ({r.totalPRs})
              </text>

              {ratio === null ? (
                <>
                  {/* Null: gray dash at center */}
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
                  {/* Colored bar */}
                  {(() => {
                    const barX = ratioToX(
                      Math.min(ratio, 1),
                      maxRatio
                    );
                    const barEndX = ratioToX(
                      Math.max(ratio, 1),
                      maxRatio
                    );
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
    </div>
  );
}
