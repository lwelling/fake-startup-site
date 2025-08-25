const fallbacks = [
  {
    subject: 'Quantum Entanglement',
    complex:
      'Quantum entanglement describes a non-classical correlation between particles where their quantum states become interdependent, so measuring one instantaneously influences the state of the other regardless of spatial separation, challenging local realism and underpinning phenomena like quantum teleportation.',
    simple:
      "It's like two magic coins that always show the same side even when they're far apart.",
  },
  {
    subject: 'CRISPR-Cas9 Gene Editing',
    complex:
      'CRISPR-Cas9 is a molecular complex that can be programmed with guide RNA to locate specific DNA sequences and create double-strand breaks, enabling precise genome modifications for research, medicine, and biotechnology.',
    simple:
      'It works like tiny scissors that can cut and paste genes.',
  },
  {
    subject: 'Plate Tectonics',
    complex:
      'Plate tectonics theory describes the lithosphere as divided into large plates that float on the semi-fluid asthenosphere, whose interactions at boundaries drive continental drift, mountain building, earthquakes, and volcanism.',
    simple:
      "Earth's crust is made of huge pieces that slowly bump into and move away from each other.",
  },
  {
    subject: 'Stellar Nucleosynthesis',
    complex:
      'Stellar nucleosynthesis encompasses the nuclear fusion processes within stars that synthesize heavier elements from lighter ones, ultimately dispersing them into the interstellar medium through stellar winds and supernovae.',
    simple:
      'Stars make new elements and spread them when they explode.',
  },
];

function pickFallback() {
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    const fallback = pickFallback();
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
              'Pick an extremely complex STEM subject from biology, geology, astronomy, physics, chemistry, or mathematics and explain it. Respond with JSON containing the fields "subject", "complex", and "simple" where "complex" is one technical paragraph and "simple" is the same idea explained in one sentence for a five-year-old.',
          },
        ],
        max_tokens: 200,
        temperature: 1,
      }),
    });

    if (!response.ok) throw new Error('Bad response');
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let result = pickFallback();
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
    res.end(JSON.stringify(pickFallback()));
  }
};
