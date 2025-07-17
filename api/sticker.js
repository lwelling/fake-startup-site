const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const fallbackStickers = [
  {
    description:
      'Witness the "Awkward Bento Date"—a blushing anime boy spilling soy sauce everywhere while striking a "cool" pose.',
    pitch:
      "It's so painfully adorable that slapping it on your ride proves you're the hero of cringe culture!",
  },
  {
    description:
      'The "Otaku Dance Off" shows a sweat-drenched character busting clumsy moves with neon speed lines behind them.',
    pitch:
      'Everyone will respect your fearless style when they see this masterpiece on your laptop.',
  },
  {
    description:
      'Sport the "Magical Girl Mishap"—a heroine mid-transformation tripping over her own wand amid glitter explosions.',
    pitch:
      'Own it and friends will know you appreciate so-bad-it\'s-good anime drama.',
  },
  {
    description:
      'Behold the "Mecha Fangirl Frenzy"—an overexcited pilot hugging a giant robot leg in tearful joy.',
    pitch:
      'Stick it on your bumper and watch passersby salute your unapologetic enthusiasm.',
  },
];

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    const pair = getRandom(fallbackStickers);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(pair));
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
              'Provide a cringe-worthy anime car sticker idea. Respond ONLY with a JSON object containing "description" for the sticker scene and "pitch" to humorously convince the buyer.',
          },
        ],
        max_tokens: 100,
        temperature: 1,
      }),
    });

    if (!response.ok) throw new Error('Bad response');
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // ignore parse error
    }
    if (!parsed || !parsed.description || !parsed.pitch) {
      parsed = getRandom(fallbackStickers);
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(parsed));
  } catch (err) {
    console.error(err);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(getRandom(fallbackStickers)));
  }
};
