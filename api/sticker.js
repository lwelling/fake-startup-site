const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const fallbackStickers = [
  'Witness the "Awkward Bento Date"—a blushing anime boy spilling soy sauce everywhere while praising you for rocking this sticker.',
  'The "Otaku Dance Off" shows a sweat-drenched character busting clumsy moves and cheering you on for repping anime on the road.',
  'Sport the "Magical Girl Mishap"—a heroine mid-transformation tripping over her own wand yet applauding your bold taste in car decor.',
  'Behold the "Mecha Fangirl Frenzy"—an overexcited pilot hugging a giant robot leg, thrilled you slapped this on your bumper.',
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
              'Describe in one enthusiastic sentence an anime car sticker depicting a cringe or awkward scene. Compliment the driver for boldly displaying it.',
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
