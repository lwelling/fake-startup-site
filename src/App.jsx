import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import BrainRotaas from './pages/BrainRotaas.jsx';
import AnimeStickers from './pages/AnimeStickers.jsx';
import ShiSpot from './pages/ShiSpot.jsx';
import Navbar from './components/Navbar.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/brainrotaas" element={<BrainRotaas />} />
        <Route path="/animestickers" element={<AnimeStickers />} />
        <Route path="/shi-spot" element={<ShiSpot />} />
      </Routes>
    </BrowserRouter>
  );
}
