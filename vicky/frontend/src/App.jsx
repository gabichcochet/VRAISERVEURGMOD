import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Accueil from './pages/Accueil.jsx';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Accueil />} />
            {/* plus tard : ajouter Boutique, Membres, etc */}
        </Routes>
    );
}

export default App;