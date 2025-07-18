import { useState, useEffect } from 'react';

export default function GaslightGPT() {
  const [input, setInput] = useState('');
  const [reply, setReply] = useState('');
  const [sources, setSources] = useState([]);
  const [expected, setExpected] = useState('');
  const [showSources, setShowSources] = useState(false);
  const [loading, setLoading] = useState(false);
  const [escalateCount, setEscalateCount] = useState(0);
  const [showError, setShowError] = useState(false);
  const [engaged, setEngaged] = useState(false);

  useEffect(() => {
    document.body.classList.remove('disrupt-1', 'disrupt-2', 'disrupt-3', 'disrupt-4');
    if (escalateCount > 0 && escalateCount < 4) {
      document.body.classList.add(`disrupt-${escalateCount}`);
      document.body.dataset.noise =
        '!@#$%^&*✶✷✸✹☠☢☣☤'.repeat(escalateCount * 2);
    }
    if (escalateCount >= 4) {
      setShowError(true);
      document.body.className = '';
      document.body.style.background = 'white';
      delete document.body.dataset.noise;
    } else {
      document.body.style.background = '';
      if (escalateCount === 0) delete document.body.dataset.noise;
    }
  }, [escalateCount]);

  const send = async (escalate = false) => {
    if (!input.trim() || loading) return;
    const n = escalateCount + (escalate ? 1 : 0);
    setLoading(true);
    try {
      const res = await fetch('/api/gaslight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, n }),
      });
      const data = await res.json();
      setReply(data.reply || '');
      setSources(data.sources || []);
      setExpected(data.expected || '');
      setShowSources(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setEngaged(true);
    send(false);
  };

  const handleEscalate = () => {
    setEscalateCount((c) => c + 1);
    send(true);
  };

  const handleReset = () => {
    setEscalateCount(0);
    setShowError(false);
    setEngaged(false);
    setInput('');
    setReply('');
    setSources([]);
    setExpected('');
    setShowSources(false);
  };

  if (showError) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-4">
        <p className="mb-4 text-center">Error Code 480 - Maximum Number of Universes Exceeded</p>
        <button onClick={handleReset} className="border px-4 py-2">{"let's start from the beginning"}</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 flex items-center justify-center p-4">
      <div className="space-y-6 max-w-xl w-full">
        <h1 className="text-3xl font-bold text-center">GaslightGPT – Are you sure that happened?</h1>
        {!engaged && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me what happened..."
              className="w-full p-3 rounded text-gray-900"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-700 text-black rounded font-semibold hover:bg-green-600 transition animate-flicker"
            >
              {loading ? 'Thinking...' : 'Validate My Reality'}
            </button>
          </form>
        )}
        {engaged && loading && !reply && (
          <div className="text-center animate-pulse">Loading...</div>
        )}
        {reply && (
          <div className="bg-gray-900 text-green-300 p-4 rounded shadow-lg space-y-4">
            <p>{reply}</p>
            <div className="flex space-x-4">
              {escalateCount > 1 && (
                <button
                  onClick={() => setShowSources(true)}
                  className="underline hover:text-green-500"
                >
                  Show Sources
                </button>
              )}
              {expected && (
                <button
                  onClick={() => {
                    setInput(expected);
                    handleEscalate();
                  }}
                  className="underline hover:text-green-500"
                >
                  {expected}
                </button>
              )}
            </div>
          </div>
        )}
        {showSources && (
          <div className="bg-gray-800 text-green-200 p-4 rounded shadow-lg">
            <h2 className="font-semibold mb-2">Sources</h2>
            <ul className="list-disc list-inside space-y-1">
              {sources.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
            <button onClick={() => setShowSources(false)} className="mt-2 underline hover:text-green-400">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
