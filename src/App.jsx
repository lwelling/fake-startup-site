import { useState } from 'react';

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Fallback generator used when no API key is provided or a request fails
function fallbackPitch(idea) {
  const name = `${getRandom([
    'Hyper',
    'Quantum',
    'NextGen',
    'Sky',
    'Deep',
    'Spark',
    'Venture',
  ])} ${getRandom(['Labs', 'Works', 'Dynamics', 'Systems', 'Industries'])}`;

  const words = [
    'Seamless',
    'Scalable',
    'Disruptive',
    'AI-powered',
    'Synergistic',
    'Cloud',
    'Next-level',
    'Frictionless',
    'Decentralized',
  ];
  const tagline = `${getRandom(words)} ${getRandom(words)} ${getRandom(words)}`;
  const hero = `At ${name}, we reinvent ${idea} with scalable disruption. Our platform unleashes frictionless synergy to drive unprecedented ROI.`;
  return { name, tagline, hero };
}

async function generatePitch(idea) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackPitch(idea);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content:
              `Create a ridiculous startup pitch for "${idea}" and reply with JSON having the fields name, tagline and hero.`,
          },
        ],
        max_tokens: 80,
        temperature: 1,
      }),
    });

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content;
    if (!message) throw new Error('No response');
    return JSON.parse(message);
  } catch (err) {
    console.error(err);
    return fallbackPitch(idea);
  }
}

const backgrounds = [
  'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500',
  'bg-gradient-to-r from-green-400 via-blue-500 to-purple-600',
  'bg-gradient-to-r from-yellow-300 via-orange-500 to-pink-600',
  'bg-gradient-to-r from-blue-800 via-purple-600 to-red-500',
];

const buttonStyles = [
  'bg-black text-yellow-300 hover:bg-yellow-300 hover:text-black',
  'bg-yellow-500 text-black hover:bg-black hover:text-yellow-500',
  'bg-white text-pink-600 hover:bg-pink-600 hover:text-white',
  'bg-purple-800 text-white hover:bg-purple-600',
];

const textStyles = [
  'text-white',
  'text-black',
  'text-yellow-200 drop-shadow-md',
  'text-pink-100 drop-shadow-md',
];

export default function App() {
  const [idea, setIdea] = useState('');
  const [pitch, setPitch] = useState(null);
  const [style, setStyle] = useState({
    bg: backgrounds[0],
    button: buttonStyles[0],
    text: textStyles[0],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const generated = await generatePitch(idea || 'your needs');
    setPitch(generated);
    setStyle({
      bg: getRandom(backgrounds),
      button: getRandom(buttonStyles),
      text: getRandom(textStyles),
    });
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${style.bg}`}>
      <div className={`w-full max-w-2xl space-y-6 text-center ${style.text}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe your startup idea..."
            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white"
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
            <p className="text-xl font-medium">{pitch.tagline}</p>
            <p>{pitch.hero}</p>
            <button className={`mt-4 px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition ${style.button}`}> 
              Get Started
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
