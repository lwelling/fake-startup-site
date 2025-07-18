import { useState } from 'react';

export default function GaslightGPT() {
  const [input, setInput] = useState('');
  const [reply, setReply] = useState('');
  const [sources, setSources] = useState([]);
  const [showSources, setShowSources] = useState(false);
  const [loading, setLoading] = useState(false);

  const send = async (escalate = false) => {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/gaslight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, escalate }),
      });
      const data = await res.json();
      setReply(data.reply || '');
      setSources(data.sources || []);
      setShowSources(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send(false);
  };

  const handleEscalate = () => send(true);

  return (
    <div className="min-h-screen bg-black text-green-400 flex items-center justify-center p-4">
      <div className="space-y-6 max-w-xl w-full">
        <h1 className="text-3xl font-bold text-center">GaslightGPT – Are you sure that happened?</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me your memory or question..."
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
        {reply && (
          <div className="bg-gray-900 text-green-300 p-4 rounded shadow-lg space-y-4">
            <p>{reply}</p>
            <div className="flex space-x-4">
              <button onClick={() => setShowSources(true)} className="underline hover:text-green-500">Show Sources</button>
              <button onClick={handleEscalate} className="underline hover:text-green-500 animate-wiggle">I remember it differently</button>
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
