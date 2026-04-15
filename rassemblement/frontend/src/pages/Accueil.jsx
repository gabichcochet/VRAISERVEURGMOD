import React, { useEffect, useState } from 'react';


export default function Accueil() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me', {
      credentials: "include", // envoie les cookies de session
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Chargement...</p>;
    return (
        <div>
            <h1>Serveur GMod</h1>

            {user ? (
                <>
                <p>Connecté : {user.steamId}</p>
                <a href="/api/logout">
                    <button>Se déconnecter</button>
                </a>
                </>
            ) : (
                <>
                <p>Tu n'es pas connecté.</p>
                <a href="/api/auth/steam">
                    <button>Se connecter avec Steam</button>
                </a>
                </>
            )}
        </div>
    );
}