const fallback = {
  subject: 'Quantum Entanglement',
  complex:
    'Quantum entanglement describes a non-classical correlation between particles where their quantum states become interdependent, so measuring one instantaneously influences the state of the other regardless of spatial separation, challenging local realism and underpinning phenomena like quantum teleportation.',
  simple:
    "It's like two magic coins that always show the same side even when they're far apart.",
};

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(fallback));
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
            content:
              'Pick an extremely complex STEM subject and explain it. Respond with JSON containing the fields "subject", "complex", and "simple" where "complex" is one technical paragraph and "simple" is the same idea explained in one sentence for a five-year-old.',
          },
        ],
        max_tokens: 200,
        temperature: 1,
      }),
    });

    if (!response.ok) throw new Error('Bad response');
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let result = fallback;
    if (content) {
      const start = content.indexOf('{');
      const end = content.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        try {
          const parsed = JSON.parse(content.slice(start, end + 1));
          if (parsed.subject && parsed.complex && parsed.simple) {
            result = parsed;
          }
        } catch (e) {
          console.error('JSON parse error', e);
        }
      }
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (err) {
    console.error(err);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(fallback));
  }
};
