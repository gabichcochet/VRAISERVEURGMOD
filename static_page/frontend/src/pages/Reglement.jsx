import React, { useEffect, useState } from "react";

export default function Reglement() {
  const [page, setPage] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch("/api/pages/rules", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setErr(data.error);
        else setPage(data);
      })
      .catch(() => setErr("Erreur de chargement"));
  }, []);

  if (err) return <p>{err}</p>;
  if (!page) return <p>Chargement...</p>;

  return (
    <div style={{ padding: 24 }}>
      <h1>{page.title}</h1>
      <pre style={{ whiteSpace: "pre-wrap" }}>{page.content}</pre>
    </div>
  );
}
