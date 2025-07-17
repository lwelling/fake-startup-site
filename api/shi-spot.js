const fallbackImage = 'https://placehold.co/512x512?text=Shi+Spot';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  const { noun, verb, location } = req.body || {};
  if (!noun || !verb || !location) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing input' }));
    return;
  }

  const simplePrompt = `A funny scene with ${noun} ${verb} at ${location}`;

  if (!process.env.OPENAI_API_KEY) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ prompt: simplePrompt, image: fallbackImage }));
    return;
  }

  try {
    const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `Create a short, humorous DALL-E prompt for an image inspired by these emoji: ${noun} ${verb} ${location}. Respond only with the prompt text.`,
          },
        ],
        max_tokens: 60,
        temperature: 1,
      }),
    });

    const chatData = await chatRes.json();
    const prompt = chatData.choices?.[0]?.message?.content?.trim() || simplePrompt;

    const imgRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
      }),
    });

    let imageUrl = fallbackImage;
    if (imgRes.ok) {
      const imgData = await imgRes.json();
      imageUrl = imgData.data?.[0]?.url || fallbackImage;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ prompt, image: imageUrl }));
  } catch (err) {
    console.error(err);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ prompt: simplePrompt, image: fallbackImage }));
  }
};
