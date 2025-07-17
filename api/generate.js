const OpenAI = require('openai');

// Basic random generator used when no key is provided or the API fails
function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

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

let openai;
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch (err) {
    console.error('Failed to initialize OpenAI client:', err);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const { idea } = req.body || {};
    if (!idea) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing idea' }));
      return;
    }

    // If no OpenAI key is present, fall back to a random generator
    if (!openai) {
      const generated = fallbackPitch(idea);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(generated));
      return;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Create a ridiculous startup pitch for "${idea}" and reply with JSON having the fields name, tagline and hero.`,
        },
      ],
      max_tokens: 80,
      temperature: 1,
    });

    const message = completion.choices?.[0]?.message?.content;
    if (!message) {
      throw new Error('No response');
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(message);
  } catch (err) {
    console.error(err);

    // If we have a failure from OpenAI, try the fallback generator
    if (req.body && req.body.idea) {
      try {
        const generated = fallbackPitch(req.body.idea);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(generated));
        return;
      } catch (e) {
        console.error('Fallback generator failed:', e);
      }
    }

    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to generate pitch' }));
  }
}
