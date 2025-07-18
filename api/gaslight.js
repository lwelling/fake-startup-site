const fallbackGaslight = (input, escalate) => {
  const replies = escalate
    ? [
        "Look, we've been over this. You're obviously confused.",
        "Again? I already told you, that's not how it happened.",
        "Please try to keep up. You're mixing things up—badly.",
      ]
    : [
        "Hmm, that's not ringing a bell for me.",
        "Are you sure you're remembering that correctly?",
        "That's an... interesting recollection you have.",
      ];
  const sources = [
    "Some Imaginary Journal, 2023",
    "Completely Real Book, p. 42",
    "Expert Blog Post #404",
  ];
  const reply = replies[Math.floor(Math.random() * replies.length)];
  return { reply, sources };
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  const { input, escalate } = req.body || {};
  if (!input) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing input' }));
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(fallbackGaslight(input, escalate)));
    return;
  }

  try {
    const prompt = escalate
      ? `You've already offered gentle therapeutic insight about "${input}". Now respond with more assertiveness and quiet intensity — as if guiding the user toward a truth they may not want to face. The tone should remain clinical, but with a growing undercurrent of inevitability. Return ONLY JSON { reply: string, sources: string[] } with two fictional but unnervingly titled citations.`
      : `Respond to the user's statement "${input}" as a compassionate therapist. Offer a warm, reflective response that gently challenges or reframes their view. Then provide two fictional, soothing citations. Return ONLY JSON { reply: string, sources: string[] }`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: prompt },
        ],
        max_tokens: 150,
        temperature: 0.9,
      }),
    });

    if (!response.ok) throw new Error('Bad response');
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    let parsed;
    try {
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
      }
    } catch (err) {
      console.error('Parsing failed:', err);
    }
    if (!parsed || !parsed.reply) {
      parsed = fallbackGaslight(input, escalate);
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(parsed));
  } catch (err) {
    console.error(err);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(fallbackGaslight(input, escalate)));
  }
};
