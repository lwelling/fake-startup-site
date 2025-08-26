import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/contact');
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white space-y-6 p-4">
      <h1 className="text-5xl font-extrabold">
        <span className="font-extrabold">LKW</span>
        <span className="font-light">.lol</span>
      </h1>
      <p className="text-xl">Welcome to the site.</p>
      {!user && (
        <button
          onClick={signIn}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
        >
          Sign in with Google
        </button>
      )}
    </div>
  );
}
