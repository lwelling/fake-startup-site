const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const { idea } = req.body || {};
    if (!idea) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing idea' }));
      return;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Create a ridiculous startup pitch for "${idea}" and reply with JSON having the fields name, tagline and hero.`,
        },
      ],
      max_tokens: 80,
      temperature: 1,
    });

    const message = completion.choices?.[0]?.message?.content;
    if (!message) {
      throw new Error('No response');
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(message);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to generate pitch' }));
  }
}
