import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';
import { useEffect } from 'react';
import Landing from './pages/Landing.jsx';
import Contact from './pages/Contact.jsx';
import BrainRotaas from './pages/BrainRotaas.jsx';
import ShiSpot from './pages/ShiSpot.jsx';
import GaslightGPT from './pages/GaslightGPT.jsx';
import Navbar from './components/Navbar.jsx';
import Life from './pages/Life.jsx';
import Note from './pages/Note.jsx';
import { useAuth } from './context/AuthContext';

function TitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    const titles = {
      '/': 'lkw.lol',
      '/contact': 'lkw.lol - Contact',
      '/brainrotaas': 'lkw.lol - BrainRotaas',
      '/shi-spot': 'lkw.lol - Shi Spot',
      '/gaslight': 'lkw.lol - GaslightGPT',
      '/life': 'lkw.lol - Life',
      '/note': 'lkw.lol - Notes',
    };
    document.title = titles[location.pathname] || 'lkw.lol';
  }, [location.pathname]);

  return null;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <TitleUpdater />
      {user && <Navbar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/contact"
          element={user ? <Contact /> : <Navigate to="/" replace />}
        />
        <Route
          path="/brainrotaas"
          element={user ? <BrainRotaas /> : <Navigate to="/" replace />}
        />
        <Route
          path="/shi-spot"
          element={user ? <ShiSpot /> : <Navigate to="/" replace />}
        />
        <Route
          path="/gaslight"
          element={user ? <GaslightGPT /> : <Navigate to="/" replace />}
        />
        <Route
          path="/life"
          element={user ? <Life /> : <Navigate to="/" replace />}
        />
        <Route
          path="/note"
          element={user ? <Note /> : <Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
