import { useEffect, useState } from "react";

export function SessionPage() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}session.txt`)
      .then((r) => r.text())
      .then(setText);
  }, []);

  if (text === null) return <p>Loading session transcript…</p>;

  return (
    <div className="session-page">
      <h1>Agent Session</h1>
      <p>
        This is the full Claude Code transcript that built this application.
        {" "}
        <a href={`${import.meta.env.BASE_URL}session.txt`} target="_blank" rel="noopener noreferrer">
          Open raw file
        </a>
      </p>
      <pre>{text}</pre>
    </div>
  );
}
