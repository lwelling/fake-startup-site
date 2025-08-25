const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

function fallbackStory() {
  const subjects = [
    'A flock of pigeons',
    'A rogue AI assistant',
    'An interdimensional donut',
    'The mayor',
    'A group of time-traveling squirrels',
  ];
  const actions = [
    'declared war on',
    'accidentally merged with',
    'opened a portal to',
    'held a press conference about',
    'traded stocks with',
  ];
  const objects = [
    'the moon',
    'a haunted sandwich',
    'its own shadow',
    'an alternate timeline',
    'a sentient cloud',
  ];
  const twists = [
    'causing mild discomfort',
    'leaving experts baffled',
    'triggering a spontaneous disco',
    'requiring citizens to wear tin-foil hats',
    'summoning confused philosophers',
  ];
  return `${getRandom(subjects)} ${getRandom(actions)} ${getRandom(objects)}, ${getRandom(twists)}.`;
}

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
    res.end(JSON.stringify({ story: fallbackStory() }));
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
              'Write a single short paragraph for a breaking news story that is ridiculous, confusing and mixes humour, horror, sci-fi and other genres. Keep it under 80 words.',
          },
        ],
        max_tokens: 150,
        temperature: 1.2,
      }),
    });

    if (!response.ok) throw new Error('Bad response');
    const data = await response.json();
    const story = data.choices?.[0]?.message?.content?.trim();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ story: story || fallbackStory() }));
  } catch (err) {
    console.error(err);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ story: fallbackStory() }));
  }
};

