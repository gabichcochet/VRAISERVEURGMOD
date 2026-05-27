import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import '../css/theme.css';

export default function Accueil() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me', {
      credentials: "include",
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

  if (loading) {
    return (
      <div className="accueil">
        <div className="loading-container">
          <p className="loading-text">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="accueil">
      <header className="header">
        <div className="header-content">
          <div className="overlay">
            <h1>JUJUTSU KAISEN</h1>
            <h2>Serveur Garry's Mod</h2>
            <p>
              Bienvenue sur notre serveur GMod inspiré de l'univers de Jujutsu Kaisen.
              Rejoignez la communauté et participez à des aventures épiques !
            </p>
          </div>

          <div className="auth-section">
            {user ? (
              <div className="user-logged">
                {user.avatar_url && (
                  <img src={user.avatar_url} alt="Avatar" className="user-avatar-mini" />
                )}
                <div className="user-details">
                  <span className="user-label">Connecté en tant que</span>
                  <span className="user-name">{user.username || user.steamId}</span>
                </div>
                <a href="http://localhost:3000/logout" className="auth-button logout-btn">
                  Se déconnecter
                </a>
              </div>
            ) : (
              <div className="user-not-logged">
                <p className="not-connected-text">Connecte-toi pour débloquer toutes les fonctionnalités</p>
                <a href="http://localhost:3000/auth/steam" className="auth-button login-btn">
                  <span>🔓</span> Se connecter avec Steam
                </a>
              </div>
            )}

            <div className="social-links" style={{ display: 'flex', gap: '30px', justifyContent: 'center', marginTop: '30px', fontSize: '35px', zIndex: 3, position: 'relative' }}>
              <a href="https://www.instagram.com/jujutsukaisen.gmod/" target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none' }}>
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://www.youtube.com/channel/UC4WA9U5uoC7F9zcw8M_Is7g" target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none' }}>
                <i className="fab fa-youtube"></i>
              </a>
              <a href="https://www.tiktok.com/@jujutsukaisen5463" target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none' }}>
                <i className="fab fa-tiktok"></i>
              </a>
              <a href="https://discord.gg/s6sJyV8w" target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none' }}>
                <i className="fab fa-discord"></i>
              </a>
            </div>
          </div>
        </div>
      </header>

      <section className="main-content">
        <div className="sections-container">
          <Card title="🛍️ Boutique" link="/boutique" />
          <Card title="👥 Membres" link="/membres" />
          <Card title="🖥️ Serveur" link="/serveur" />
          <Card title="📚 Documentation" link="/docs" />
        </div>
      </section>
    </div>
  );
}