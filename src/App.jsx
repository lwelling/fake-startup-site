import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import BrainRotaas from './pages/BrainRotaas.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/brainrotaas" element={<BrainRotaas />} />
      </Routes>
    </BrowserRouter>
  );
}
