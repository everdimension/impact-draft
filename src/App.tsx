import { useCallback, useRef, useState } from "react";
import { fetchAllPRsWithFiles } from "./api/github";
import type { RawPRWithFiles } from "./api/github";
import { analyzeAll } from "./analysis";
import type { EngineerReport } from "./analysis/types";
import { EngineerCard } from "./components/EngineerCard";
import "./App.css";

const DEFAULT_REPO = "PostHog/posthog";
const DEFAULT_MAX_PRS = 300;

function App() {
  const [repo, setRepo] = useState(DEFAULT_REPO);
  const [token, setToken] = useState("");
  const [maxPRs, setMaxPRs] = useState(DEFAULT_MAX_PRS);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<EngineerReport[] | null>(null);
  const [rawCount, setRawCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setReports(null);
    setProgress("Starting...");

    try {
      const prs: RawPRWithFiles[] = await fetchAllPRsWithFiles(repo, maxPRs, {
        token: token || undefined,
        signal: controller.signal,
        onProgress: setProgress,
      });
      setRawCount(prs.length);
      setProgress("Analyzing...");
      // Run analysis synchronously (fast, all in-memory)
      const results = analyzeAll(prs);
      setReports(results);
      setProgress(null);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : String(err));
      setProgress(null);
    }
  }, [repo, token, maxPRs]);

  return (
    <div className="app">
      <header>
        <h1>Engineering Impact Analysis</h1>
        <p className="subtitle">
          Analyze engineer contributions beyond lines of code
        </p>
      </header>

      <section className="controls">
        <div className="control-row">
          <label>
            Repository
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="owner/repo"
            />
          </label>
          <label>
            Max PRs
            <input
              type="number"
              value={maxPRs}
              onChange={(e) => setMaxPRs(Number(e.target.value))}
              min={10}
              max={1000}
              step={50}
            />
          </label>
        </div>
        <div className="control-row">
          <label className="token-label">
            GitHub Token{" "}
            <span className="hint">(recommended — 60 req/hr without)</span>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_..."
            />
          </label>
        </div>
        <button className="analyze-btn" onClick={analyze} disabled={!!progress}>
          {progress ? progress : "Analyze"}
        </button>
      </section>

      {error && <div className="error-box">{error}</div>}

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
          <div className="engineer-list">
            {reports.map((r) => (
              <EngineerCard key={r.login} report={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
