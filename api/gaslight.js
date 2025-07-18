const fallbackGaslight = (input, n) => {
  const escalate = n > 1;
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

  const { input, n = 0 } = req.body || {};
  if (!input) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing input' }));
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(fallbackGaslight(input, n)));
    return;
  }

  try {
    const prompt = (n > 1)
      ? `You are an ominous dystopian therapist figure who is gaslighting the user. You've now responded to "${input}" ${n} times. Escalate: undermine the user’s memory and grip on reality while remaining composed and clinical. Use confident, therapeutic language. Return ONLY JSON { reply: string, sources: string[] } with two fictional academic-style citations.`
      : `You are an ominous dystopian therapist figure who is gaslighting the user. Respond to "${input}" with unsettling professional calm. Subtly imply their perception is incorrect. Use therapeutic language. Return ONLY JSON { reply: string, sources: string[] }`;

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
      parsed = fallbackGaslight(input, n);
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(parsed));
  } catch (err) {
    console.error(err);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(fallbackGaslight(input, n)));
  }
};
