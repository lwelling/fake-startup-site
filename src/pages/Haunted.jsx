import { useState } from 'react';

const modes = {
  haunted: ['Ghost', 'Poltergeist', 'Demon'],
  conspiracy: ['Flat Earther', 'Prepper', 'Whistleblower'],
  dream: ['Poet', 'Psychologist', 'Oracle'],
};

export default function Haunted() {
  const [mode, setMode] = useState('haunted');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // {agent, content}
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    setInput('');
    setMessages([]);
  };

  const runConversation = async () => {
    let history = [];
    for (let step = 1; step <= 3; step++) {
      try {
        const res = await fetch('/api/haunted', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, step, userInput: input, history }),
        });
        const data = await res.json();
        history.push({ agent: data.agent, content: data.reply });
        setMessages((m) => [...m, { agent: data.agent, content: data.reply }]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setLoading(true);
    setMessages([{ agent: 'You', content: input }]);
    await runConversation();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-4">
        <h1 className="text-3xl font-bold text-center">Haunted Playground</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full p-2 text-gray-900 rounded">
            <option value="haunted">Haunted</option>
            <option value="conspiracy">Conspiracy</option>
            <option value="dream">Dream</option>
          </select>
          <textarea
            rows="3"
            className="w-full p-3 text-gray-900 rounded"
            placeholder="Share a thought or fear..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-full py-2 bg-purple-700 hover:bg-purple-600 rounded font-semibold"
          >
            {loading ? 'Summoning...' : 'Summon Spirits'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded font-semibold text-gray-200"
          >
            Reset
          </button>
        </form>
        <div className="space-y-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded ${i === 0 ? 'bg-gray-800 self-end' : 'bg-gray-700'}`}
            >
              <span className="font-bold mr-2">{m.agent}:</span>
              <span>{m.content}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
