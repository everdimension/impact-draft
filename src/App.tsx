import { useEffect, useState } from "react";
import "./App.css";

const REPO = "PostHog/posthog";

interface Contributor {
  login: string;
  avatar_url: string;
  html_url: string;
  pr_count: number;
}

interface PRAuthor {
  login: string;
  avatar_url: string;
  html_url: string;
}

interface PullRequest {
  number: number;
  user: PRAuthor | null;
}

async function fetchAllMergedPRs(
  signal: AbortSignal
): Promise<Map<string, Contributor>> {
  const contributors = new Map<string, Contributor>();
  let page = 1;
  const perPage = 100;
  const maxPages = 10; // 1000 PRs max to stay within API limits

  while (page <= maxPages) {
    const url = `https://api.github.com/repos/${REPO}/pulls?state=closed&sort=updated&direction=desc&per_page=${perPage}&page=${page}`;
    const res = await fetch(url, { signal });
    if (!res.ok) {
      if (res.status === 403) {
        // Rate limited - return what we have
        break;
      }
      throw new Error(`GitHub API error: ${res.status}`);
    }
    const prs: PullRequest[] = await res.json();
    if (prs.length === 0) break;

    for (const pr of prs) {
      if (!pr.user) continue;
      const login = pr.user.login;
      const existing = contributors.get(login);
      if (existing) {
        existing.pr_count++;
      } else {
        contributors.set(login, {
          login,
          avatar_url: pr.user.avatar_url,
          html_url: pr.user.html_url,
          pr_count: 1,
        });
      }
    }

    page++;
  }

  return contributors;
}

type SortField = "pr_count" | "login";
type SortDirection = "asc" | "desc";

function App() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPRs, setTotalPRs] = useState(0);
  const [sortField, setSortField] = useState<SortField>("pr_count");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    const controller = new AbortController();
    fetchAllMergedPRs(controller.signal)
      .then((map) => {
        const list = Array.from(map.values());
        setContributors(list);
        setTotalPRs(list.reduce((sum, c) => sum + c.pr_count, 0));
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  const sorted = [...contributors].sort((a, b) => {
    const dir = sortDirection === "asc" ? 1 : -1;
    if (sortField === "pr_count") return (a.pr_count - b.pr_count) * dir;
    return a.login.localeCompare(b.login) * dir;
  });

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "pr_count" ? "desc" : "asc");
    }
  }

  function sortIndicator(field: SortField) {
    if (sortField !== field) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  }

  return (
    <div className="app">
      <header>
        <h1>Engineering Impact Dashboard</h1>
        <p className="subtitle">
          <a
            href={`https://github.com/${REPO}`}
            target="_blank"
            rel="noreferrer"
          >
            {REPO}
          </a>
        </p>
      </header>

      {loading && <div className="loading">Loading PR data from GitHub...</div>}
      {error && <div className="error">Error: {error}</div>}

      {!loading && !error && (
        <>
          <div className="stats">
            <div className="stat-card">
              <div className="stat-value">{totalPRs.toLocaleString()}</div>
              <div className="stat-label">Total PRs (recent)</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{contributors.length}</div>
              <div className="stat-label">Contributors</div>
            </div>
          </div>

          <table className="contributors-table">
            <thead>
              <tr>
                <th className="rank-col">#</th>
                <th
                  className="sortable"
                  onClick={() => toggleSort("login")}
                >
                  Contributor{sortIndicator("login")}
                </th>
                <th
                  className="sortable num-col"
                  onClick={() => toggleSort("pr_count")}
                >
                  PRs{sortIndicator("pr_count")}
                </th>
                <th className="bar-col">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => {
                const maxPRs = Math.max(...contributors.map((x) => x.pr_count));
                const barWidth = (c.pr_count / maxPRs) * 100;
                return (
                  <tr key={c.login}>
                    <td className="rank-col">{i + 1}</td>
                    <td>
                      <a
                        className="contributor-link"
                        href={c.html_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          className="avatar"
                          src={c.avatar_url}
                          alt=""
                          width={28}
                          height={28}
                        />
                        {c.login}
                      </a>
                    </td>
                    <td className="num-col">{c.pr_count}</td>
                    <td className="bar-col">
                      <div
                        className="bar"
                        style={{ width: `${barWidth}%` }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default App;
