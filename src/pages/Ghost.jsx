import { useState } from 'react';
import Typewriter from '../components/Typewriter';

export default function Ghost() {
  const [keyword, setKeyword] = useState('');
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!keyword.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ghost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      const data = await res.json();
      if (Array.isArray(data.lines)) {
        setLines(data.lines);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-300 flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-4">
        <h1 className="text-3xl font-bold text-center">Ghost</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            className="w-full p-2 rounded text-gray-900"
            placeholder="Enter a keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !keyword.trim()}
            className="w-full py-2 bg-green-700 hover:bg-green-600 rounded font-semibold"
          >
            {loading ? 'Summoning...' : 'Summon'}
          </button>
        </form>
        <div className="space-y-2">
          {lines.map((line, i) => (
            <div key={i} className="p-3 bg-gray-800 rounded">
              <Typewriter text={line} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
