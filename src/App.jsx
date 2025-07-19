import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import BrainRotaas from './pages/BrainRotaas.jsx';
import ShiSpot from './pages/ShiSpot.jsx';
import GaslightGPT from './pages/GaslightGPT.jsx';
import Unspeakable from './pages/Unspeakable.jsx';
import Haunted from './pages/Haunted.jsx';
import GhostChat from './pages/GhostChat.jsx';
import Navbar from './components/Navbar.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/brainrotaas" element={<BrainRotaas />} />
        <Route path="/shi-spot" element={<ShiSpot />} />
        <Route path="/gaslight" element={<GaslightGPT />} />
        <Route path="/unspeakable" element={<Unspeakable />} />
        <Route path="/haunted" element={<Haunted />} />
        <Route path="/ghostchat" element={<GhostChat />} />
      </Routes>
    </BrowserRouter>
  );
}
