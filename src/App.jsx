import { useState } from 'react';

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const icons = [
    '⚡️', '🚀', '✨', '📈', '🧠', '☁️', '🔒', '🔧', '🎯', '🤖', '💡', '📦', '📲', '📣', '🛠️',
  ];

// Fallback generator used when no API key is provided or a request fails
function randomFeature() {
  const titles = [
    'Instant Onboarding',
    'AI Insights',
    'Cloud Ready',
    'One-Click Sync',
    'Seamless Collaboration',
    'Rocket-Fast Deployments',
    'Smart Notifications',
    'No-Code Tools',
    'Secure by Default',
    'Built for Scale',
    'Realtime Collaboration',
    'Effortless Setup',
  ];

  const descriptions = [
    'Get started in seconds with no learning curve.',
    'Harness the power of machine learning to grow faster.',
    'Built from the ground up for modern distributed teams.',
    'Connect all your tools with a single tap.',
    'Work together in real time anywhere in the world.',
    'Ship updates at blazing speed with zero downtime.',
    'Stay ahead with intelligent alerts and monitoring.',
    'Build workflows without writing a line of code.',
    'Military-grade encryption and authentication.',
    'Your growth won’t outgrow us — ever.',
    'Share, edit, and thrive — all live.',
    'Plug in and go. It just works.',
  ];

  return {
    title: getRandom(titles),
    description: getRandom(descriptions),
    icon: getRandom(icons),
  };
}

function randomTestimonial() {
  const names = ['Alice B.', 'Bob C.', 'Charlie D.', 'Dana E.', 'Eli F.'];
  const quotes = [
    'This completely changed our business!',
    'I cannot imagine life without it.',
    'Absolutely mind blowing results.',
    'The best decision we ever made.',
    'A game changer in every way.',
  ];
  return { name: getRandom(names), quote: getRandom(quotes) };
}

function fallbackPitch(idea) {
  const name =
    getRandom([
      'Hyper',
      'Quantum',
      'NextGen',
      'Sky',
      'Deep',
      'Spark',
      'Venture',
    ]) +
    ' ' +
    getRandom(['Labs', 'Works', 'Dynamics', 'Systems', 'Industries']);

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
  const features = [randomFeature(), randomFeature(), randomFeature()];
  const testimonials = [randomTestimonial(), randomTestimonial()];
  return { name, tagline, hero, features, testimonials };
}

async function generatePitch(idea) {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idea }),
    });

    if (!response.ok) throw new Error('Bad response');

    return await response.json();
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
    <div className={`min-h-screen ${style.bg} ${style.text}`}>
      <div className="max-w-6xl mx-auto p-8 space-y-16">
        <header className="text-center space-y-8">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
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
              <h1 className="text-4xl md:text-6xl font-extrabold">{pitch.name}</h1>
              <p className="text-xl md:text-2xl font-medium">{pitch.tagline}</p>
              <p className="max-w-2xl mx-auto">{pitch.hero}</p>
              <button className={`mt-4 px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition ${style.button}`}>
                Get Started
              </button>
            </div>
          )}
        </header>

        {pitch && (
          <>
            <section className="space-y-8">
              <h2 className="text-3xl font-bold text-center">Features</h2>
              <div className="grid gap-8 md:grid-cols-3">
                {pitch.features?.map((f, i) => (
                  <div
                    key={i}
                    className="bg-white text-gray-800 p-6 rounded-lg shadow"
                  >
                    <div className="text-3xl mb-2">{f.icon}</div>
                    <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                    <p>{f.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-8">
              <h2 className="text-3xl font-bold text-center">Testimonials</h2>
              <div className="grid gap-8 md:grid-cols-2">
                {pitch.testimonials?.map((t, i) => (
                  <div
                    key={i}
                    className="bg-white text-gray-800 p-6 rounded-lg shadow"
                  >
                    <p className="italic mb-2">"{t.quote}"</p>
                    <p className="font-semibold">- {t.name}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
