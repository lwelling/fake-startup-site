const fallbackGaslight = (input, n) => {
  const escalate = n > 1;
  const replies = escalate
    ? [
        "We've already covered this. Your recollection is clearly erroneous.",
        "Once again, your memory fails you. Accept the facts.",
        "It's pointless to continue. You're fabricating things now.",
      ]
    : [
        "That's not what happened, and you know it.",
        "Your perception is obviously skewed.",
        "I doubt your account matches reality.",
      ];
  const sources = [
    "Institute for Recollection Studies, 2024",
    "Journal of Memory Correction, Vol. 12",
    "Classified Report 88-B",
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
      ? `You are a cold, detached scientist posing as a therapist. You've now responded to "${input}" ${n} times. Escalate with hostile condescension and insist the user's memory is faulty. Offer no help or further conversation. Respond clinically and return ONLY JSON { reply: string, sources: string[] } with two fictional scientific citations.`
      : `You are a cold, detached scientist posing as a therapist. Respond to "${input}" with a short, hostile dismissal that implies the user is mistaken. Offer no assistance or follow-up. Return ONLY JSON { reply: string, sources: string[] }`;

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
