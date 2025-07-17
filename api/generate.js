// Basic random generator used when no key is provided or the API fails
function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomFeature() {
  const titles = [
    'Instant Onboarding',
    'AI Insights',
    'Cloud Ready',
    'One-Click Sync',
    'Seamless Collaboration',
    'Rocket-Fast Deployments',
  ];
  const descriptions = [
    'Get started in seconds with no learning curve.',
    'Harness the power of machine learning to grow faster.',
    'Built from the ground up for modern distributed teams.',
    'Connect all your tools with a single tap.',
    'Work together in real time anywhere in the world.',
    'Ship updates at blazing speed with zero downtime.',
  ];
  const icons = ['🚀', '✨', '⚡', '🔥', '💡', '📈'];
  return {
    title: getRandom(titles),
    description: getRandom(descriptions),
    icon: getRandom(icons),
  };
}

const testimonialIcons = ['🎉', '🙌', '👍', '🤩', '😊'];

function randomTestimonial() {
  const names = ['Alice B.', 'Bob C.', 'Charlie D.', 'Dana E.', 'Eli F.'];
  const quotes = [
    'This completely changed our business!',
    'I cannot imagine life without it.',
    'Absolutely mind blowing results.',
    'The best decision we ever made.',
    'A game changer in every way.',
  ];
  return { name: getRandom(names), quote: getRandom(quotes), icon: getRandom(testimonialIcons) };
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
  const features = [randomFeature(), randomFeature(), randomFeature()];
  const testimonials = [randomTestimonial(), randomTestimonial()];
  return { name, tagline, hero, features, testimonials };
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
            content: `Create a startup pitch for the idea "${idea}". Make the description darkly dystopian and ironically sinister. For example, a cat rescue service might boast about locking cats in a cage. Return ONLY a valid JSON object with the following fields: name (string), tagline (string), hero (string), features (array of 3 objects with title, description, and icon), testimonials (array of 2 objects with name, quote, and icon). Do not include any extra commentary, explanation, or formatting. Just the raw JSON.`,
          },
        ],
        max_tokens: 400,
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

    let parsed;
    let generated;
    
    try {
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = content.slice(jsonStart, jsonEnd + 1);
        try {
          parsed = JSON.parse(jsonString);
          console.log("✅ Successfully extracted and parsed JSON:", parsed);
        } catch (err) {
          console.error("❌ Failed to parse JSON slice:", jsonString, err);
        }
      }
    
      generated = parsed;
    } catch (err) {
      console.error("❌ Failed to parse content:", content);
      console.error(err);
    }
    
    if (!generated || !generated.features || !generated.testimonials) {
      console.log("ℹ️ Falling back to local generator due to missing data");
      generated = fallbackPitch(idea);
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(generated));
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
