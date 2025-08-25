import { useState } from 'react';
import FirebasePing from '../components/FirebasePing';

export default function Home() {
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/snarky', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setToast(data.reply || '...');
      setMessage('');
      setTimeout(() => setToast(''), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white p-4">
      <div className="text-center space-y-8 max-w-xl">
        <h1 className="text-5xl font-extrabold">
          <span className="font-extrabold">LKW</span>
          <span className="font-light">.lol</span>
        </h1>
        <p className="text-xl">Enter at your own peril.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!loading && toast && (
            <div className="bg-gray-800 text-white px-4 py-2 rounded shadow-lg">
              {toast}
            </div>
          )}
          <textarea
            className="w-full p-3 rounded-md text-gray-900" rows="4" placeholder="ugh...WHAT??"
            value={message} onChange={(e) => setMessage(e.target.value)}
          />
          <button
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-md font-semibold disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Contact Me'}
          </button>
        </form>
        <FirebasePing />
        {loading && (
          <div className="fixed top-4 right-4">
            <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent border-solid rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
}
