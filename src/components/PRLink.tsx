import type { EnrichedPR } from "../analysis/types";

export function PRLink({ pr }: { pr: EnrichedPR }) {
  return (
    <a href={pr.url} target="_blank" rel="noreferrer" className="pr-link">
      #{pr.number}
    </a>
  );
}

export function PRRow({ pr, extra }: { pr: EnrichedPR; extra?: string }) {
  return (
    <li className="pr-row">
      <PRLink pr={pr} />
      <span className="pr-title" title={pr.title}>
        {pr.title}
      </span>
      <span className={`pr-category cat-${pr.category}`}>{pr.category}</span>
      {extra && <span className="pr-extra">{extra}</span>}
    </li>
  );
}
