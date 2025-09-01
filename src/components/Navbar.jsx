import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const pipelineLink = { to: '/pipeline', label: 'Pipeline' };
const playgroundLinks = [
  { to: '/contact', label: 'Contact' },
  { to: '/brainrotaas', label: 'BrainROTAaS' },
  { to: '/shi-spot', label: 'Shi Spot' },
  { to: '/gaslight', label: 'GaslightGPT' },
  { to: '/life', label: 'Game of Life' },
  { to: '/note', label: 'Notes' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [pgOpen, setPgOpen] = useState(false);
  const [playgroundPass, setPlaygroundPass] = useState('');
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPass() {
      try {
        const snap = await getDoc(doc(db, 'passwords', 'playground'));
        const data = snap.data();
        setPlaygroundPass(data?.value || data?.password || '');
      } catch {
        // ignore
      }
    }
    fetchPass();
  }, []);

  const handlePlaygroundNav = (path) => {
    window.alert('Access to this page requires a password.');
    const input = window.prompt('Enter password:');
    if (input === playgroundPass) {
      navigate(path);
    } else if (input !== null) {
      window.alert('Incorrect password');
    }
  };

  const renderPlaygroundLinks = () =>
    playgroundLinks.map((link) => (
      <li key={link.to}>
        <button
          onClick={() => {
            setPgOpen(false);
            setOpen(false);
            handlePlaygroundNav(link.to);
          }}
          className="block w-full text-left px-4 py-2 hover:underline"
        >
          {link.label}
        </button>
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
          <li>
            <Link to={pipelineLink.to} className="hover:underline">
              {pipelineLink.label}
            </Link>
          </li>
          <li className="relative">
            <button
              onClick={() => setPgOpen(!pgOpen)}
              className="hover:underline"
            >
              Playground
            </button>
            {pgOpen && (
              <ul className="absolute left-0 mt-2 bg-gray-800 rounded shadow-md">
                {renderPlaygroundLinks()}
              </ul>
            )}
          </li>
          <li>
            <button onClick={signOut} className="hover:underline">
              Sign out
            </button>
          </li>
        </ul>
      </div>

      <ul
        className={`${open ? 'flex' : 'hidden'} flex-col gap-2 mt-2 md:hidden`}
      >
        <li>
          <Link
            to={pipelineLink.to}
            className="hover:underline"
            onClick={() => setOpen(false)}
          >
            {pipelineLink.label}
          </Link>
        </li>
        <li>
          <button
            onClick={() => setPgOpen(!pgOpen)}
            className="text-left hover:underline"
          >
            Playground
          </button>
          {pgOpen && (
            <ul className="mt-2 ml-4 flex flex-col gap-2">
              {renderPlaygroundLinks()}
            </ul>
          )}
        </li>
        <li>
          <hr className="my-2 border-gray-700" />
        </li>
        <li>
          <button onClick={signOut} className="text-left hover:underline">
            Sign out
          </button>
        </li>
      </ul>
    </nav>
  );
}

