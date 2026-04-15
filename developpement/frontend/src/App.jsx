import { Routes, Route } from 'react-router-dom';
import Accueil from './pages/Accueil.jsx';
import Reglement from './pages/Reglement.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Accueil />} />
      <Route path="/reglement" element={<Reglement />} />
    </Routes>
  );
}
