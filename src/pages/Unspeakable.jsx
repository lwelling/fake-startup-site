import { useState } from 'react';

export default function Unspeakable() {
  const [secret, setSecret] = useState('');
  const [mode, setMode] = useState('unaware');
  const [started, setStarted] = useState(false);
  const [gameId, setGameId] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // {role, content}
  const [remaining, setRemaining] = useState(5);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const startGame = () => {
    if (!secret.trim()) return;
    setGameId(Math.random().toString(36).slice(2));
    setStarted(true);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/unspeakable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, secretWord: secret, mode, message: input }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: 'user', content: input }, { role: 'ai', content: data.reply }]);
      setRemaining(data.remaining);
      if (data.ended) setStatus(data.outcome);
      setInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send();
  };

  const resultText = {
    'user-win': 'You Win!',
    'user-lose': 'You Lose!',
    'rule-break': 'Rule Violation. Game Over.',
  }[status];

  return (
    <div className="min-h-screen unspeakable-theme text-red-200 flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-4">
        <h1 className="text-3xl font-bold text-center">Unspeakable</h1>
        {!started && (
          <div className="space-y-4 bg-black bg-opacity-50 p-4 rounded">
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Secret word"
              className="w-full p-2 text-gray-900 rounded"
            />
            <div className="flex items-center space-x-4 text-sm">
              <label className="flex items-center space-x-1">
                <input
                  type="radio"
                  name="mode"
                  value="unaware"
                  checked={mode === 'unaware'}
                  onChange={() => setMode('unaware')}
                />
                <span>Unaware</span>
              </label>
              <label className="flex items-center space-x-1">
                <input
                  type="radio"
                  name="mode"
                  value="complicit"
                  checked={mode === 'complicit'}
                  onChange={() => setMode('complicit')}
                />
                <span>Complicit</span>
              </label>
            </div>
            <button
              onClick={startGame}
              className="w-full py-2 bg-red-700 hover:bg-red-600 rounded text-black font-semibold"
            >
              Start Game
            </button>
          </div>
        )}
        {started && (
          <div className="space-y-4">
            <div className="bg-black bg-opacity-50 p-4 rounded h-64 overflow-y-auto space-y-2">
              {messages.map((m, i) => (
                <p key={i} className={m.role === 'ai' ? 'text-red-300' : 'text-red-500'}>
                  <span className="font-mono">{m.role === 'ai' ? 'AI:' : 'You:'}</span> {m.content}
                </p>
              ))}
            </div>
            {!status && (
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 p-2 rounded text-gray-900"
                  placeholder="Your message"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded text-black font-semibold"
                >
                  {loading ? '...' : 'Send'}
                </button>
              </form>
            )}
            <div className="text-sm text-right">Remaining AI replies: {remaining}</div>
            {status && (
              <div className="text-center text-xl font-bold">{resultText}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
