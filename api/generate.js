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


module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const { idea } = req.body || {};
    console.log("🔹 Received idea:", idea);
    console.log("🔹 OPENAI_API_KEY present?", !!process.env.OPENAI_API_KEY);

    if (!idea) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing idea' }));
      return;
    }

    console.log("No open api key in env:", !process.env.OPENAI_API_KEY)
    // If no OpenAI key is present, fall back to a random generator
    if (!process.env.OPENAI_API_KEY) {
      const generated = fallbackPitch(idea);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(generated));
      return;
    }
    
    console.log("🔹 Sending request to OpenAI...");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `Create a ridiculous startup pitch for "${idea}" and reply with JSON having the fields name, tagline and hero.`,
          },
        ],
        max_tokens: 80,
        temperature: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    console.log("🔹 OpenAI raw response object:", response);

    const data = await response.json();
    console.log("🔹 Parsed OpenAI response JSON:", data);
    const content = data.choices?.[0]?.message?.content;
    console.log("🔹 ChatGPT message content:", content);
    if (!content) {
      throw new Error('No response');
    }

    let name, tagline, hero;

    try {
      const parsed = JSON.parse(content);
      console.log("✅ Successfully parsed:", parsed);
      name = parsed.name;
      tagline = parsed.tagline;
      hero = parsed.hero;
    } catch (err) {
      console.error("❌ Failed to parse content:", content);
      console.error(err);
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ name, tagline, hero }));
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
