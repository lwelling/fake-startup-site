import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-gray-900 text-white px-4 py-3 shadow-md">
      <ul className="flex space-x-4">
        <li>
          <Link to="/" className="hover:underline">Home</Link>
        </li>
        <li>
          <Link to="/brainrotaas" className="hover:underline">BrainROTAaS</Link>
        </li>
        <li>
          <Link to="/animestickers" className="hover:underline">Anime Stickers</Link>
        </li>
      </ul>
    </nav>
  );
}
