import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home.jsx';
import BrainRotaas from './pages/BrainRotaas.jsx';
import ShiSpot from './pages/ShiSpot.jsx';
import GaslightGPT from './pages/GaslightGPT.jsx';
import Navbar from './components/Navbar.jsx';
import Life from './pages/Life.jsx';

function TitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    const titles = {
      '/': 'lkw.lol',
      '/brainrotaas': 'lkw.lol - BrainRotaas',
      '/shi-spot': 'lkw.lol - Shi Spot',
      '/gaslight': 'lkw.lol - GaslightGPT',
      '/life': 'lkw.lol - Life',
    };
    document.title = titles[location.pathname] || 'lkw.lol';
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <TitleUpdater />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/brainrotaas" element={<BrainRotaas />} />
        <Route path="/shi-spot" element={<ShiSpot />} />
        <Route path="/gaslight" element={<GaslightGPT />} />
        <Route path="/life" element={<Life />} />
      </Routes>
    </BrowserRouter>
  );
}
