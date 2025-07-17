import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import BrainRotaas from './pages/BrainRotaas.jsx';
import HeyJamo from './pages/HeyJamo.jsx';
import Navbar from './components/Navbar.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/brainrotaas" element={<BrainRotaas />} />
        <Route path="/heyjamo" element={<HeyJamo />} />
      </Routes>
    </BrowserRouter>
  );
}
