import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home.jsx';
import BrainRotaas from './pages/BrainRotaas.jsx';
import ShiSpot from './pages/ShiSpot.jsx';
import GaslightGPT from './pages/GaslightGPT.jsx';
import Navbar from './components/Navbar.jsx';
import Life from './pages/Life.jsx';
import { useAuth } from './context/AuthContext';

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
  const { user, loading, signIn } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button
          onClick={signIn}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

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
