const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const fallbackSnark = (msg) => {
  const replies = [
    "Wow, that's totally original.",
    "I'll get right on that... never.",
    "Sure, because I have nothing better to do.",
    "Amazing. Truly groundbreaking stuff.",
  ];
  return getRandom(replies);
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  const { message } = req.body || {};
  if (!message) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing message' }));
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ reply: fallbackSnark(message) }));
    return;
  }

  try {
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
            content: `Respond with a single short sarcastic sentence to this user message: "${message}"`,
          },
        ],
        max_tokens: 60,
        temperature: 0.8,
      }),
    });

    if (!response.ok) throw new Error('Bad response');
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    const reply = content || fallbackSnark(message);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ reply }));
  } catch (err) {
    console.error(err);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ reply: fallbackSnark(message) }));
  }
};
