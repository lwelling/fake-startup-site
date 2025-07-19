import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-gray-900 text-white px-4 py-3 shadow-md">
      <ul className="flex flex-wrap gap-4 justify-center">
        <li>
          <Link to="/" className="hover:underline">Home</Link>
        </li>
        <li>
          <Link to="/brainrotaas" className="hover:underline">BrainROTAaS</Link>
        </li>
        <li>
          <Link to="/shi-spot" className="hover:underline">Shi Spot</Link>
        </li>
        <li>
          <Link to="/gaslight" className="hover:underline">GaslightGPT</Link>
        </li>
        <li>
          <Link to="/unspeakable" className="hover:underline">Unspeakable</Link>
        </li>
      </ul>
    </nav>
  );
}
