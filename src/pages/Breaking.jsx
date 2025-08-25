import { useState, useEffect } from 'react';

export default function Breaking() {
  const [story, setStory] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchStory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/breaking');
      const data = await res.json();
      setStory(data.story || 'The news feed malfunctioned.');
    } catch (err) {
      console.error(err);
      setStory('The news feed malfunctioned.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStory();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white text-center p-4 space-y-6">
      <h1 className="text-3xl font-bold">Breaking News</h1>
      <p className="max-w-2xl">{loading ? 'Transmitting…' : story}</p>
      <button
        onClick={fetchStory}
        className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded flex items-center gap-2"
      >
        <span>next story</span>
        <span aria-hidden>→</span>
      </button>
    </div>
  );
}
