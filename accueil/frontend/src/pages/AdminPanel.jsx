import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

export default function AdminPanel() {
    const [admin, setAdmin] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [sanctions, setSanctions] = useState([]);
    const [shopItems, setShopItems] = useState([]);
    const [promoCodes, setPromoCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const handleChangeRank = async (userId, rank) => {
    try {
        const res = await fetch(`/api/admin/users/${userId}/rank`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ rank })
        });

        if (res.ok) {
            loadUsers();
        }
    } catch (err) {
        console.error(err);
    }
    };


    useEffect(() => {
        checkAdminAccess();
    }, []);

    useEffect(() => {
        if (admin) {
            loadDashboardData();
        }
    }, [admin]);

    useEffect(() => {
        if (activeTab === 'users') loadUsers();
        if (activeTab === 'sanctions') loadSanctions();
        if (activeTab === 'shop') loadShopItems();
        if (activeTab === 'promos') loadPromoCodes();
    }, [activeTab]);

    const checkAdminAccess = async () => {
        try {
            const res = await fetch('/api/me', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                const user = data.user;
                const adminRanks = ['owner', 'superadmin', 'responsable', 'admin', 'moderator', 'helper'];
                if (data.loggedIn && user && adminRanks.includes(user.rank)) {
                    setAdmin(user);
                } else if (!data.loggedIn) {
                    window.location.href = 'http://localhost:3000/auth/steam';
                } else {
                    window.location.href = '/';
                }
            } else {
                window.location.href = '/';
            }
        } catch (err) {
            console.error('Erreur auth:', err);
            window.location.href = '/';
        } finally {
            setLoading(false);
        }
    };

    const loadDashboardData = async () => {
        try {
            const res = await fetch('/api/admin/dashboard/stats', { credentials: 'include' });
            if (res.ok) {
                setStats(await res.json());
            }
        } catch (err) {
            console.error('Erreur dashboard:', err);
        }
    };

    const loadUsers = async () => {
        try {
            const res = await fetch(`/api/admin/users?search=${searchQuery}`, { credentials: 'include' });
            if (res.ok) {
                setUsers(await res.json());
            }
        } catch (err) {
            console.error('Erreur chargement users:', err);
        }
    };

    const loadSanctions = async () => {
        try {
            const res = await fetch('/api/admin/sanctions', { credentials: 'include' });
            if (res.ok) {
                setSanctions(await res.json());
            }
        } catch (err) {
            console.error('Erreur chargement sanctions:', err);
        }
    };

    const loadShopItems = async () => {
        try {
            const res = await fetch('/api/admin/shop/items', { credentials: 'include' });
            if (res.ok) {
                setShopItems(await res.json());
            }
        } catch (err) {
            console.error('Erreur chargement items:', err);
        }
    };

    const loadPromoCodes = async () => {
        try {
            const res = await fetch('/api/admin/promo-codes', { credentials: 'include' });
            if (res.ok) {
                setPromoCodes(await res.json());
            }
        } catch (err) {
            console.error('Erreur chargement promos:', err);
        }
    };
const handleDeleteShopItem = async (itemId) => {
    if (!window.confirm('Supprimer cet article de la boutique ?')) return;

    try {
        const res = await fetch(`/api/admin/shop/items/${itemId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            alert(data.error || 'Erreur suppression item');
            return;
        }

        // update UI instant
        setShopItems(prev => prev.filter(item => item.id !== itemId));

    } catch (err) {
        console.error(err);
        alert('Erreur serveur');
    }
};

    const handleIssueSanction = async (userId, type, reason, duration) => {
        try {
            const res = await fetch('/api/admin/sanctions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ user_id: userId, sanction_type: type, reason, duration_days: duration })
            });

            if (res.ok) {
                alert('Sanction enregistrée');
                loadSanctions();
            }
        } catch (err) {
            console.error('Erreur sanction:', err);
        }
    };


    const handleLiftSanction = async (sanctionId) => {
        if (window.confirm('Êtes-vous sûr de lever cette sanction ?')) {
            try {
                const res = await fetch(`/api/admin/sanctions/${sanctionId}/lift`, {
                    method: 'PUT',
                    credentials: 'include'
                });

                if (res.ok) {
                    alert('Sanction levée');
                    loadSanctions();
                }
            } catch (err) {
                console.error('Erreur levée sanction:', err);
            }
        }
    };

    if (loading) {
        return <div className="admin-loading">Chargement...</div>;
    }

    if (!admin) {
        return <div className="admin-error">Accès refusé</div>;
    }

    return (
        <div className="admin-container">
            {/* Sidebar */}
            <div className="admin-sidebar">
                <h2>ADMIN PANEL</h2>
                <p className="admin-rank">{admin.rank.toUpperCase()}</p>
                <nav className="admin-nav">
                    <button 
                        className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        📊 Tableau de Bord
                    </button>
                    <button 
                        className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        👥 Utilisateurs
                    </button>
                    <button 
                        className={`nav-btn ${activeTab === 'sanctions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('sanctions')}
                    >
                        ⚠️ Sanctions
                    </button>
                    <button 
                        className={`nav-btn ${activeTab === 'shop' ? 'active' : ''}`}
                        onClick={() => setActiveTab('shop')}
                    >
                        🛍️ Boutique
                    </button>
                    <button 
                        className={`nav-btn ${activeTab === 'promos' ? 'active' : ''}`}
                        onClick={() => setActiveTab('promos')}
                    >
                        🎟️ Codes Promo
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="admin-content">
                {/* Dashboard */}
                {activeTab === 'dashboard' && stats && (
                    <div className="admin-section">
                        <h1>Tableau de Bord</h1>
                        <div className="dashboard-grid">
                            <div className="dashboard-card">
                                <h3>Utilisateurs Totaux</h3>
                                <p className="big-number">{stats.totalUsers}</p>
                            </div>
                            <div className="dashboard-card">
                                <h3>Commandes Complétées</h3>
                                <p className="big-number">{stats.totalOrders}</p>
                            </div>
                            <div className="dashboard-card">
                                <h3>Revenus</h3>
                                <p className="big-number">{stats.totalRevenue}€</p>
                            </div>
                            <div className="dashboard-card danger">
                                <h3>Sanctions Actives</h3>
                                <p className="big-number">{stats.activeSanctions}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Utilisateurs */}
                {activeTab === 'users' && (
                    <div className="admin-section">
                        <h1>Gestion des Utilisateurs</h1>
                        <div className="search-bar">
                            <input 
                                type="text" 
                                placeholder="Rechercher un utilisateur..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setTimeout(() => loadUsers(), 300);
                                }}
                            />
                        </div>
                        <div className="users-list">
                            {users.map(user => (
                                <div key={user.id} className="user-item">
                                    <div className="user-info">
                                        <h4>{user.username || 'Sans nom'}</h4>
                                        <p>{user.steam_id}</p>
                                        <p className="playtime">⏱️ {Math.floor(user.playtime_seconds / 3600)}h de jeu</p>
                                    </div>
                                    <div className="user-actions">
                                        <select 
                                            value={user.rank}
                                            onChange={(e) => handleChangeRank(user.id, e.target.value)}
                                        >
                                            <option value="user">User</option>
                                            <option value="helper">Helper</option>
                                            <option value="moderator">Moderator</option>
                                            <option value="admin">Admin</option>
                                            <option value="responsable">Responsable</option>
                                            <option value="superadmin">SuperAdmin</option>
                                        </select>
                                        {user.active_sanctions > 0 && (
                                            <span className="sanction-badge">⚠️ {user.active_sanctions}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sanctions */}
                {activeTab === 'sanctions' && (
                    <div className="admin-section">
                        <h1>Gestion des Sanctions</h1>
                        <div className="sanctions-list">
                            {sanctions.map(sanction => (
                                <div key={sanction.id} className={`sanction-item ${sanction.sanction_type}`}>
                                    <div className="sanction-info">
                                        <h4>{sanction.target_user}</h4>
                                        <p>{sanction.sanction_type.toUpperCase()}</p>
                                        <p className="reason">{sanction.reason}</p>
                                        <p className="issued-by">Par: {sanction.issued_by}</p>
                                    </div>
                                    <div className="sanction-actions">
                                        <span className={`status ${sanction.is_active ? 'active' : 'lifted'}`}>
                                            {sanction.is_active ? 'Actif' : 'Levée'}
                                        </span>
                                        {sanction.is_active && (
                                            <button 
                                                className="lift-btn"
                                                onClick={() => handleLiftSanction(sanction.id)}
                                            >
                                                Lever
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Boutique */}
                {activeTab === 'shop' && (
                    <div className="admin-section">
                        <h1>Gestion de la Boutique</h1>
                        <div className="shop-list">
                            {shopItems.map(item => (
                                <div key={item.id} className="shop-item">
                                    {item.image_url && (
                                        <img src={item.image_url} alt={item.name} className="item-thumb" />
                                    )}
                                    <div className="item-info">
                                        <h4>{item.name}</h4>
                                        <p>{item.category_name}</p>
                                        <p className="price">{item.price}€</p>
                                    </div>
                                    <div className="item-actions">
                                        <span className={`stock-badge ${item.in_stock ? 'in' : 'out'}`}>
                                            {item.in_stock ? '✓ En stock' : '✕ Rupture'}
                                        </span>
                                        <button 
                                            className="delete-btn"
                                            onClick={() => handleDeleteShopItem(item.id)}
                                        >
                                            supprimer
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Promo Codes */}
                {activeTab === 'promos' && (
                    <div className="admin-section">
                        <h1>Codes Promo</h1>
                        <div className="promo-list">
                            {promoCodes.map(promo => (
                                <div key={promo.code} className="promo-item">
                                    <div className="promo-info">
                                        <h4>{promo.code}</h4>
                                        <p>
                                            {promo.discount_type === 'percentage' ? 
                                                `${promo.discount_value}% de réduction` : 
                                                `-${promo.discount_value}€`
                                            }
                                        </p>
                                        {promo.max_uses && (
                                            <p>Utilisations: {promo.current_uses}/{promo.max_uses}</p>
                                        )}
                                        {promo.expiry_date && (
                                            <p>Expire: {new Date(promo.expiry_date).toLocaleDateString('fr-FR')}</p>
                                        )}
                                    </div>
                                    <div className="promo-status">
                                        <span className={`status ${promo.is_active ? 'active' : 'inactive'}`}>
                                            {promo.is_active ? 'Actif' : 'Inactif'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
