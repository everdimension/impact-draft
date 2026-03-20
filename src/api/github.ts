import type { PRFile } from "../analysis/types";

const BASE = "https://api.github.com";

export interface FetchOptions {
  token?: string;
  signal?: AbortSignal;
  onProgress?: (msg: string) => void;
}

export interface RawPR {
  number: number;
  title: string;
  user: { login: string; avatar_url: string; html_url: string } | null;
  html_url: string;
  created_at: string;
  merged_at: string | null;
  labels: { name: string }[];
}

export interface RawPRWithFiles extends RawPR {
  files: PRFile[];
}

async function ghFetch(url: string, opts: FetchOptions): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (opts.token) {
    headers.Authorization = `Bearer ${opts.token}`;
  }
  const res = await fetch(url, { headers, signal: opts.signal });
  if (res.status === 403) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (remaining === "0") {
      const resetAt = res.headers.get("x-ratelimit-reset");
      const resetDate = resetAt
        ? new Date(Number(resetAt) * 1000).toLocaleTimeString()
        : "soon";
      throw new Error(
        `GitHub API rate limit exceeded. Resets at ${resetDate}. Add a token for higher limits.`
      );
    }
  }
  return res;
}

export async function fetchMergedPRs(
  repo: string,
  maxPRs: number,
  opts: FetchOptions
): Promise<RawPR[]> {
  const prs: RawPR[] = [];
  let page = 1;
  const perPage = 100;

  while (prs.length < maxPRs) {
    opts.onProgress?.(`Fetching PRs page ${page}...`);
    const res = await ghFetch(
      `${BASE}/repos/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=${perPage}&page=${page}`,
      opts
    );
    if (!res.ok)
      throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
    const batch: RawPR[] = await res.json();
    if (batch.length === 0) break;

    for (const pr of batch) {
      if (pr.merged_at && prs.length < maxPRs) {
        prs.push(pr);
      }
    }
    page++;
  }
  return prs;
}

async function fetchPRFiles(
  repo: string,
  prNumber: number,
  opts: FetchOptions
): Promise<PRFile[]> {
  const res = await ghFetch(
    `${BASE}/repos/${repo}/pulls/${prNumber}/files?per_page=100`,
    opts
  );
  if (!res.ok) {
    if (res.status === 403) return [];
    return [];
  }
  const files: Array<{
    filename: string;
    additions: number;
    deletions: number;
    changes: number;
    status: string;
  }> = await res.json();
  return files.map((f) => ({
    filename: f.filename,
    additions: f.additions,
    deletions: f.deletions,
    changes: f.changes,
    status: f.status,
  }));
}

export async function fetchAllPRsWithFiles(
  repo: string,
  maxPRs: number,
  opts: FetchOptions
): Promise<RawPRWithFiles[]> {
  const rawPRs = await fetchMergedPRs(repo, maxPRs, opts);
  opts.onProgress?.(
    `Fetched ${rawPRs.length} merged PRs. Loading file details...`
  );

  const results: RawPRWithFiles[] = [];
  const batchSize = 5;

  for (let i = 0; i < rawPRs.length; i += batchSize) {
    const batch = rawPRs.slice(i, i + batchSize);
    const filesBatch = await Promise.all(
      batch.map((pr) => fetchPRFiles(repo, pr.number, opts))
    );
    for (let j = 0; j < batch.length; j++) {
      results.push({ ...batch[j], files: filesBatch[j] });
    }
    const loaded = Math.min(i + batchSize, rawPRs.length);
    opts.onProgress?.(`Loaded files for ${loaded}/${rawPRs.length} PRs...`);
  }

  return results;
}
