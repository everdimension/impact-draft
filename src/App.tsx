import { useCallback, useMemo, useRef } from "react";
import type { RawPRWithFiles } from "./api/github";
import { analyzeAll } from "./analysis";
import type { EngineerReport } from "./analysis/types";
import { EngineerCard } from "./components/EngineerCard";
import { ImpactChart } from "./components/ImpactChart";
import cachedPRs from "./data/posthog-prs.json";
import "./App.css";

function App() {
  const { reports, rawCount } = useMemo(() => {
    const prs = cachedPRs as unknown as RawPRWithFiles[];
    return { reports: analyzeAll(prs), rawCount: prs.length };
  }, []);
  const resultsRef = useRef<HTMLDivElement>(null);
  const handleHover = useCallback((e: React.MouseEvent) => {
    const container = resultsRef.current;
    if (!container) return;
    const target = (e.target as Element).closest("[data-login]");
    for (const el of container.querySelectorAll(".row-highlight")) {
      el.classList.remove("row-highlight");
    }
    if (target) {
      const login = target.getAttribute("data-login");
      for (const el of container.querySelectorAll(
        `[data-login="${login}"]`,
      )) {
        el.classList.add("row-highlight");
      }
    }
  }, []);
  const clearHover = useCallback(() => {
    const container = resultsRef.current;
    if (!container) return;
    for (const el of container.querySelectorAll(".row-highlight")) {
      el.classList.remove("row-highlight");
    }
  }, []);

  return (
    <div className="app">
      <header>
        <h1>Engineering Impact Analysis</h1>
        <p className="subtitle">
          Analyze engineer contributions beyond lines of code
        </p>
      </header>

      {reports && (
        <section className="results">
          <div className="results-header">
            <h2>
              Results — {reports.length} engineers from {rawCount} merged PRs
            </h2>
            <p className="results-note">
              Click an engineer to expand their impact report. Each metric
              section shows the methodology and links to specific PRs as
              evidence.
            </p>
          </div>
          <div
            className="results-body"
            ref={resultsRef}
            onMouseOver={handleHover}
            onMouseOut={clearHover}
          >
            <ImpactChart reports={reports} />
            <div className="engineer-list">
              {reports.map((r: EngineerReport, i: number) => (
                <EngineerCard key={r.login} report={r} rank={i + 1} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
