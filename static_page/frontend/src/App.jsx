import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Accueil from './pages/Accueil.jsx';
import Reglement from './pages/Reglement.jsx'
import MentionsLegales from "./pages/MentionsLegales.jsx";
import Privacy from "./pages/Privacy.jsx";
import AdminPages from "./pages/AdminPages.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Accueil />} />
      <Route path="/reglement" element={<Reglement />} />
      <Route path="/mentions-legales" element={<MentionsLegales />} />
      <Route path="/privacy" element={<Privacy />} />

      {/* admin */}
      <Route path="/admin/pages" element={<AdminPages />} />
    </Routes>
  );
}
