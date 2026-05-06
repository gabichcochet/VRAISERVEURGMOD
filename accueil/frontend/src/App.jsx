import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import './css/theme.css';

// Importer toutes les pages
import Accueil from './pages/Accueil';
import Boutique from './pages/Boutique';
import Lore from './pages/Lore';
import Profil from './pages/Profil';
import Reglement from './pages/Reglement';
import AdminPanel from './pages/AdminPanel';
import Paiement from './pages/Paiement';
import PaiementSucces from './pages/PaiementSucces';
import PayPalReturn from './pages/PayPalReturn';

export default function App() {
    return (
        <>
            {/* Navigation globale */}
            <nav className="global-nav">
                <Link to="/">🏠 Accueil</Link>
                <Link to="/boutique">🛍️ Boutique</Link>
                <Link to="/lore">📖 Lore</Link>
                <Link to="/reglement">📜 Règlement</Link>
                <Link to="/profil">👤 Profil</Link>
                <Link to="/admin">⚙️ Admin</Link>
            </nav>

            {/* Routes */}
            <Routes>
                <Route path="/" element={<Accueil />} />
                <Route path="/boutique" element={<Boutique />} />
                <Route path="/lore" element={<Lore />} />
                <Route path="/profil" element={<Profil />} />
                <Route path="/reglement" element={<Reglement />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/paiement" element={<Paiement />} />
                <Route path="/paiement/succes" element={<PaiementSucces />} />
                <Route path="/paiement/paypal-return" element={<PayPalReturn />} />
            </Routes>
        </>
    );
}