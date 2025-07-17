const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const fallbackStickers = [
  "Slap on the \"Super Saiyan Speedster\"—a chibi warrior powering up so hard your car practically gains 50 horsepower just from the decal.",
  "Rock the \"Kawaii Drift Queen\" sticker: pastel hair, big eyes, and a wink that tells the world you were born to rule the parking lot.",
  "Try the \"Mecha Overdrive\"—a giant robot fist bumping your bumper, because nothing screams \"cool driver\" like mecha swagger.",
  "Embrace the \"Magical Girl Turbo\": sparkles, hearts, and enough dramatic flair to make stoplights swoon in your presence.",
];

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
    res.end(JSON.stringify({ description: getRandom(fallbackStickers) }));
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
              'Invent a short, ridiculously enthusiastic description of an anime-themed car sticker. Praise the driver for being unbelievably cool for putting anime stickers on their car. Respond with a single sentence only.',
          },
        ],
        max_tokens: 60,
        temperature: 1,
      }),
    });

    if (!response.ok) throw new Error('Bad response');
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    const description = content || getRandom(fallbackStickers);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ description }));
  } catch (err) {
    console.error(err);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ description: getRandom(fallbackStickers) }));
  }
};
