import { useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
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
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white p-4">
      <div className="text-center space-y-8 max-w-xl">
        <h1 className="text-5xl font-extrabold">LKW</h1>
        <p className="text-xl">Welcome to my corner of the internet.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full p-3 rounded-md text-gray-900" rows="4" placeholder="Send me a message..."
            value={message} onChange={(e) => setMessage(e.target.value)}
          />
          <button className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-md font-semibold" type="submit">
            Contact Me
          </button>
        </form>
        {toast && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
