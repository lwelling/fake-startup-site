import { useState, useEffect } from 'react';
import Typewriter from '../components/Typewriter';

export default function Ghost() {
  const [keyword, setKeyword] = useState('');
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [displayed, setDisplayed] = useState([]);
  const [index, setIndex] = useState(-1);
  const [thinking, setThinking] = useState(false);

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

  useEffect(() => {
    if (lines.length) {
      setDisplayed([]);
      setIndex(0);
    } else {
      setIndex(-1);
      setDisplayed([]);
    }
  }, [lines]);

  const handleLineDone = () => {
    setDisplayed((d) => [...d, lines[index]]);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setIndex((i) => i + 1);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-black text-green-300 flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-4">
        <h1 className="text-3xl font-bold text-center">Ghost</h1>
        <p className="text-green-200 text-sm text-center">
          Summon a ghostly stream of consciousness. Each line appears one after
          another with a short pause.
        </p>
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
          {displayed.map((line, i) => (
            <div key={i} className="p-3 bg-gray-800 rounded">{line}</div>
          ))}
          {index >= 0 && index < lines.length && (
            <div className="p-3 bg-gray-800 rounded">
              <Typewriter text={lines[index]} onDone={handleLineDone} />
            </div>
          )}
          {thinking && (
            <div className="p-3 bg-gray-800 rounded italic text-green-400">...</div>
          )}
        </div>
        { (displayed.length || index >= 0) && (
          <button
            onClick={() => {
              setLines([]);
              setKeyword('');
            }}
            className="w-full py-2 bg-green-900 hover:bg-green-800 rounded font-semibold"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
