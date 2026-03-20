import { useCallback, useMemo, useRef } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import type { RawPRWithFiles } from "./api/github";
import { analyzeAll } from "./analysis";
import type { EngineerReport } from "./analysis/types";
import { EngineerCard } from "./components/EngineerCard";
import { ImpactChart } from "./components/ImpactChart";
import { SessionPage } from "./pages/SessionPage";
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
      <nav className="navbar">
        <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? " nav-link-active" : ""}`}>Home</NavLink>
        <NavLink to="/about" className={({ isActive }) => `nav-link${isActive ? " nav-link-active" : ""}`}>About</NavLink>
        <NavLink to="/session" className={({ isActive }) => `nav-link${isActive ? " nav-link-active" : ""}`}>Agent Session</NavLink>
      </nav>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <header>
                <h1>Engineering Impact</h1>
                <p className="subtitle">
                  posthog/posthog — {reports.length} engineers, {rawCount} PRs
                </p>
              </header>
              {reports && (
                <section className="results">
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
            </>
          }
        />
        <Route
          path="/about"
          element={
            <div className="about-page">
              <h1>About</h1>

              <h2>What this measures</h2>
              <p>
                Impact is measured by two main factors: <strong>feature quality</strong> and{" "}
                <strong>code architecture quality</strong>.
              </p>
              <p>
                Feature quality is defined by the bugfixes and regressions a
                feature produced — lower is better. Architecture quality is
                defined by analyzing adherence to two principles:{" "}
                <strong>high cohesion</strong> and <strong>loose coupling</strong>.
                I've used these criteria in my own team (conventionally, as a
                verbal contract) to define quality of PRs.
              </p>

              <h2>Out of scope</h2>
              <p>
                No AI model was used to analyze whether code is a feature or to
                evaluate architecture. Instead, the analysis relies on commit
                conventions and the file dependency graph. Consider the results a
                demo and not true scoring data.
              </p>

              <h2>In scope</h2>
              <p>
                Quickly see and compare the impact of contributors at a glance.
              </p>
            </div>
          }
        />
        <Route path="/session" element={<SessionPage />} />
      </Routes>
    </div>
  );
}

export default App;
