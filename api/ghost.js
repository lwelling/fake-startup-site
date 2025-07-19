function fallback(keyword) {
  const phrases = [
    `The word ${keyword} echoes softly in the darkness.`,
    `Shadows swirl around ${keyword}, twisting endlessly.`,
    `I can't escape the thought of ${keyword}.`,
    `${keyword} drifts like fog through my mind.`,
    `Whispers of ${keyword} fade into silence.`,
  ];
  return phrases;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  const { keyword = '' } = req.body || {};
  if (!keyword.trim()) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing keyword' }));
    return;
  }

  let lines;

  if (process.env.OPENAI_API_KEY) {
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
              content: `Write a stream of consciousness about the word "${keyword}" in five short sentences. Respond only with a JSON object like {"lines":["sentence1","sentence2",...]}.`,
            },
          ],
          max_tokens: 120,
          temperature: 0.8,
        }),
      });
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.lines)) {
          lines = parsed.lines;
        }
      } catch (err) {
        console.error('Failed to parse OpenAI response:', err);
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (!lines) {
    lines = fallback(keyword);
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ lines }));
};
