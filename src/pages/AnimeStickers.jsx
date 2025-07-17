import { useState, useEffect } from 'react';

export default function AnimeStickers() {
  const [description, setDescription] = useState('');
  const [pitch, setPitch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchSticker = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sticker');
      const data = await res.json();
      setDescription(data.description || '');
      setPitch(data.pitch || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSticker();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 via-fuchsia-600 to-purple-700 text-white p-4">
      <div className="space-y-6 text-center max-w-xl">
        <h1 className="text-4xl font-extrabold">Anime Sticker of the Day</h1>
        <p className="text-lg">{description}</p>
        {pitch && <p className="text-lg italic">{pitch}</p>}
        <div className="space-x-4">
          <button
            onClick={fetchSticker}
            disabled={loading}
            className="px-5 py-3 bg-white text-purple-700 font-semibold rounded shadow hover:bg-purple-50 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-3 bg-yellow-400 text-purple-900 font-semibold rounded shadow hover:bg-yellow-300"
          >
            Buy It Now
          </button>
        </div>
      </div>
    </div>
  );
}
