import { useMemo } from "react";
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
          <div className="results-body">
            <ImpactChart reports={reports} />
            <div className="engineer-list">
              {reports.map((r: EngineerReport) => (
                <EngineerCard key={r.login} report={r} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
