import { useState } from 'react';

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePitch(idea) {
  const name = `${getRandom(['Hyper', 'Quantum', 'NextGen', 'Sky', 'Deep', 'Spark', 'Venture'])} ${getRandom(['Labs', 'Works', 'Dynamics', 'Systems', 'Industries'])}`;
  const words = ['Seamless', 'Scalable', 'Disruptive', 'AI-powered', 'Synergistic', 'Cloud', 'Next-level', 'Frictionless', 'Decentralized'];
  const tagline = `${getRandom(words)} ${getRandom(words)} ${getRandom(words)}`;
  const hero = `At ${name}, we reinvent ${idea} with scalable disruption. Our platform unleashes frictionless synergy to drive unprecedented ROI.`;
  return { name, tagline, hero };
}

export default function App() {
  const [idea, setIdea] = useState('');
  const [pitch, setPitch] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setPitch(generatePitch(idea || 'your needs'));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl space-y-6 text-center">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe your startup idea..."
            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition"
          >
            Generate Pitch
          </button>
        </form>
        {pitch && (
          <div className="space-y-4 mt-8">
            <h1 className="text-4xl font-extrabold">{pitch.name}</h1>
            <p className="text-xl text-gray-600 font-medium">{pitch.tagline}</p>
            <p className="text-gray-700">{pitch.hero}</p>
            <button className="mt-4 px-6 py-3 bg-gradient-to-r from-pink-500 to-yellow-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition">
              Get Started
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
