import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import '../css/theme.css';


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
        <div className="accueil">
            <header className="header">
                <div className="overlay">
                  <h1>JUJUTSU KAISEN GMod</h1>
                <p>
                    Bienvenue sur notre serveur GMod inspiré de l'univers de Jujutsu Kaisen.
                    Explorez la boutique et rejoignez la communauté !
                </p>  
                        </div>


            {user ? (
                <div className="user-info">
                <p>Connecté : {user.steamId}</p>
                <a href="/api/logout">
                    <button className="btn">Se déconnecter</button>
                </a>
                </div>
            ) : (
                <div className="user-info">
                    <p>Tu n'es pas connecté.</p>
                    <a href="/api/auth/steam">
                        <button>Se connecter avec Steam</button>
                    </a>
                </div>
            )}

     </header>
             {/* Section cartes */}
        <section className="sections">
            <Card title="Boutique" link="/boutique" />
            <Card title="Membres" link="/membres" />
            <Card title="Serveur" link="/serveur" />
            <Card title="Documentation" link="/docs" />
        </section>
        </div>
    );
}