import React, { useEffect, useState } from "react";

const keys = [
  { key: "rules", label: "Règlement" },
  { key: "legal", label: "Mentions légales" },
  { key: "privacy", label: "Politique de confidentialité" },
];

export default function AdminPages() {
  const [me, setMe] = useState(null);
  const [selectedKey, setSelectedKey] = useState("rules");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");

  // 1) check login
  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setMe(d))
      .catch(() => setMe({ loggedIn: false }));
  }, []);

  // 2) load page
  useEffect(() => {
    setStatus("");
    fetch(`/api/pages/${selectedKey}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return setStatus(d.error);
        setTitle(d.title || "");
        setContent(d.content || "");
      })
      .catch(() => setStatus("Erreur de chargement"));
  }, [selectedKey]);

  async function save() {
    setStatus("Sauvegarde...");
    try {
      const res = await fetch(`/api/pages/${selectedKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data?.error || "Erreur sauvegarde");
        return;
      }
      setStatus("✅ Sauvegardé !");
    } catch {
      setStatus("Erreur sauvegarde");
    }
  }

  if (!me) return <p>Chargement...</p>;

  if (!me.loggedIn) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Admin pages</h1>
        <p>Tu dois être connecté.</p>
        <a href="/api/auth/steam">
          <button>Se connecter avec Steam</button>
        </a>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1>Admin pages</h1>
      <p>Connecté : {me.user?.steamId}</p>

      <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <label>Page :</label>
        <select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}>
          {keys.map((k) => (
            <option key={k.key} value={k.key}>
              {k.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 16 }}>
        <label>Titre</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", padding: 10, marginTop: 6 }}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <label>Contenu</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={16}
          style={{ width: "100%", padding: 10, marginTop: 6 }}
        />
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={save}>Enregistrer</button>
        <span>{status}</span>
      </div>

      <p style={{ marginTop: 16, opacity: 0.7 }}>
        Si tu n’es pas admin (ADMIN_STEAM_ID), le backend renverra 403.
      </p>
    </div>
  );
}
