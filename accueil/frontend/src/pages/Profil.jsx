import React, { useState, useEffect } from 'react';
import './Profil.css';

export default function Profil() {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [sanctions, setSanctions] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [activeTab, setActiveTab] = useState('stats');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const [userRes, statsRes, sanctionsRes, purchasesRes] = await Promise.all([
                fetch('/api/profile/me', { credentials: 'include' }),
                fetch('/api/stats/me/formatted', { credentials: 'include' }),
                fetch('/api/sanctions/me', { credentials: 'include' }),
                fetch('/api/history/purchases', { credentials: 'include' })
            ]);

            if (userRes.ok) setUser(await userRes.json());
            if (statsRes.ok) setStats(await statsRes.json());
            if (sanctionsRes.ok) setSanctions(await sanctionsRes.json());
            if (purchasesRes.ok) setPurchases(await purchasesRes.json());
        } catch (err) {
            console.error('Erreur chargement données:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="profil-container">
                <div className="loading">Chargement de votre profil...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="profil-container">
                <div className="not-logged">
                    <h2>Veuillez vous connecter</h2>
                    <p>Vous devez être connecté pour accéder à votre profil</p>
                </div>
            </div>
        );
    }

    const getRankColor = (rank) => {
        const colors = {
            'owner': '#FFD700',
            'superadmin': '#FF6B6B',
            'responsable': '#FF8C00',
            'admin': '#FF4500',
            'moderator': '#1E90FF',
            'helper': '#87CEEB',
            'user': '#AAAAAA'
        };
        return colors[rank] || '#AAAAAA';
    };

    return (
        <div className="profil-container">
            {/* Header Profil */}
            <div className="profil-header">
                <div className="profile-card">
                    {user.avatar_url && (
                        <img src={user.avatar_url} alt={user.username} className="avatar" />
                    )}
                    <div className="profile-info">
                        <h1>{user.username || 'Joueur'}</h1>
                        <p className="steam-id">SteamID: {user.steam_id}</p>
                        <div className="rank-badge" style={{ borderColor: getRankColor(user.rank) }}>
                            <span style={{ color: getRankColor(user.rank) }}>{user.rank.toUpperCase()}</span>
                        </div>
                        <p className="member-since">Membre depuis {new Date(user.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="tabs-navigation">
                <button 
                    className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stats')}
                >
                    📊 Statistiques
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'sanctions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sanctions')}
                >
                    ⚠️ Sanctions
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'purchases' ? 'active' : ''}`}
                    onClick={() => setActiveTab('purchases')}
                >
                    🛍️ Achats
                </button>
            </div>

            {/* Contenu */}
            <div className="profil-content">
                {/* Statistiques */}
                {activeTab === 'stats' && stats && (
                    <div className="stats-section fade-in">
                        <h2>Vos Statistiques</h2>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">⏱️</div>
                                <h3>Temps de Jeu</h3>
                                <p className="stat-value">{stats.playtime.formatted}</p>
                                <p className="stat-detail">{stats.playtime.seconds} secondes</p>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">👤</div>
                                <h3>Sessions</h3>
                                <p className="stat-value">{stats.sessions}</p>
                                <p className="stat-detail">Nombre de connexions</p>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">🛍️</div>
                                <h3>Achats</h3>
                                <p className="stat-value">{stats.purchases}</p>
                                <p className="stat-detail">Articles achetés</p>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">⚠️</div>
                                <h3>Sanctions Actives</h3>
                                <p className="stat-value" style={{ color: stats.activeSanctions > 0 ? '#e64343' : '#4ade80' }}>
                                    {stats.activeSanctions}
                                </p>
                                <p className="stat-detail">Penalties en cours</p>
                            </div>
                        </div>

                        {stats.lastSession.start && (
                            <div className="last-session">
                                <h3>Dernière Connexion</h3>
                                <p>Connecté: {new Date(stats.lastSession.start).toLocaleString('fr-FR')}</p>
                                {stats.lastSession.end && (
                                    <p>Déconnecté: {new Date(stats.lastSession.end).toLocaleString('fr-FR')}</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Sanctions */}
                {activeTab === 'sanctions' && (
                    <div className="sanctions-section fade-in">
                        <h2>Vos Sanctions</h2>
                        {sanctions.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">✨</span>
                                <p>Aucune sanction active. Continuez comme ça !</p>
                            </div>
                        ) : (
                            <div className="sanctions-list">
                                {sanctions.map((sanction, index) => (
                                    <div key={index} className={`sanction-card ${sanction.type}`}>
                                        <div className="sanction-header">
                                            <span className="sanction-type-badge">{sanction.type.toUpperCase()}</span>
                                            <span className={`sanction-status ${sanction.isActive ? 'active' : 'lifted'}`}>
                                                {sanction.isActive ? 'Actif' : 'Levée'}
                                            </span>
                                        </div>
                                        <p className="sanction-reason"><strong>Raison:</strong> {sanction.reason}</p>
                                        <p className="sanction-issued"><strong>Émis par:</strong> {sanction.issuedBy}</p>
                                        <p className="sanction-date"><strong>Date:</strong> {new Date(sanction.issuedAt).toLocaleString('fr-FR')}</p>
                                        {sanction.expiresAt && (
                                            <p className="sanction-expires"><strong>Expire:</strong> {new Date(sanction.expiresAt).toLocaleString('fr-FR')}</p>
                                        )}
                                        {sanction.durationDays !== 'Permanent' && (
                                            <p className="sanction-duration"><strong>Durée:</strong> {sanction.durationDays} jours</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Achats */}
                {activeTab === 'purchases' && (
                    <div className="purchases-section fade-in">
                        <h2>Historique des Achats</h2>
                        {purchases.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">🛒</span>
                                <p>Aucun achat pour le moment. Visitez la boutique !</p>
                            </div>
                        ) : (
                            <div className="purchases-list">
                                {purchases.map((purchase) => (
                                    <div key={purchase.id} className={`purchase-card ${purchase.status}`}>
                                        {purchase.image_url && (
                                            <img src={purchase.image_url} alt={purchase.item_name} className="purchase-image" />
                                        )}
                                        <div className="purchase-info">
                                            <h4>{purchase.item_name}</h4>
                                            <p className="category">{purchase.category_name}</p>
                                            <p className="price">{purchase.total_price}€ x {purchase.quantity}</p>
                                        </div>
                                        <div className="purchase-meta">
                                            <span className={`status-badge ${purchase.status}`}>
                                                {purchase.status_label}
                                            </span>
                                            <p className="date">{new Date(purchase.created_at).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
