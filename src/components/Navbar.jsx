import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/contact', label: 'Contact' },
  { to: '/brainrotaas', label: 'BrainROTAaS' },
  { to: '/shi-spot', label: 'Shi Spot' },
  { to: '/gaslight', label: 'GaslightGPT' },
  { to: '/life', label: 'Game of Life' },
  { to: '/note', label: 'Notes' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();

  const renderLinks = () =>
    links.map((link) => (
      <li key={link.to}>
        <Link
          to={link.to}
          className="hover:underline"
          onClick={() => setOpen(false)}
        >
          {link.label}
        </Link>
      </li>
    ));

  return (
    <nav className="bg-gray-900 text-white px-4 py-3 shadow-md">
      <div className="flex items-center justify-between md:justify-center">
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <ul className="hidden md:flex gap-4 items-center">
          {renderLinks()}
          <li>
            <button onClick={signOut} className="hover:underline">Sign out</button>
          </li>
        </ul>
      </div>

      <ul
        className={`${open ? 'flex' : 'hidden'} flex-col gap-2 mt-2 md:hidden`}
      >
        {renderLinks()}
        <li>
          <button onClick={signOut} className="text-left hover:underline">Sign out</button>
        </li>
      </ul>
    </nav>
  );
}
