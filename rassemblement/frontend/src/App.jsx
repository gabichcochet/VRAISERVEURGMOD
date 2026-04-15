import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Accueil from './pages/Accueil.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Accueil />} />
    </Routes>
  );
}
