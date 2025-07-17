import { useState } from 'react';

const nounOptions = ['🐱','🐯','🐶','🦄','🧑','🐸','🐴'];
const verbOptions = ['🍕','🏃','💃','🚀','🎸','📚','🧘'];
const locationOptions = ['🏖️','🏥','🏰','🏠','🏜️','🚂','🏢'];

export default function ShiSpot() {
  const [noun, setNoun] = useState('');
  const [verb, setVerb] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const ready = noun && verb && location;

  const handleClick = async () => {
    if (!ready || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/shi-spot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noun, verb, location }),
      });
      const data = await res.json();
      setImage(data.image || '');
      setPrompt(data.prompt || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white p-4 space-y-6">
      <h1 className="text-4xl font-extrabold">Shi Spot</h1>
      <div className="space-x-4">
        <select value={noun} onChange={(e) => setNoun(e.target.value)} className="p-2 rounded text-gray-900">
          <option value="">Noun</option>
          {nounOptions.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select value={verb} onChange={(e) => setVerb(e.target.value)} className="p-2 rounded text-gray-900">
          <option value="">Verb</option>
          {verbOptions.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <select value={location} onChange={(e) => setLocation(e.target.value)} className="p-2 rounded text-gray-900">
          <option value="">Location</option>
          {locationOptions.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>
      {ready && (
        <button onClick={handleClick} disabled={loading} className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded font-semibold disabled:opacity-50">
          {loading ? 'Generating...' : "Let's Gooo"}
        </button>
      )}
      {image && (
        <div className="space-y-4 mt-6 text-center">
          <img src={image} alt="result" className="mx-auto rounded-lg w-full max-w-md" />
          {prompt && <p className="italic">{prompt}</p>}
        </div>
      )}
    </div>
  );
}
