const personas = {
  haunted: ['Ghost', 'Poltergeist', 'Demon'],
  conspiracy: ['Flat Earther', 'Prepper', 'Whistleblower'],
  dream: ['Poet', 'Psychologist', 'Oracle'],
};

const personaPrompts = {
  Ghost: 'You are a spooky ghost speaking in eerie whispers.',
  Poltergeist: 'You are a mischievous poltergeist stirring trouble.',
  Demon: 'You are a menacing demon with ominous tones.',
  'Flat Earther': 'You are a conspiracy theorist convinced the earth is flat.',
  Prepper: 'You are a paranoid doomsday prepper.',
  Whistleblower: 'You are a secret whistleblower exposing hidden truths.',
  Poet: 'You are a dreamy poet describing strange visions.',
  Psychologist: 'You are an insightful psychologist interpreting dreams.',
  Oracle: 'You are a mystical oracle foretelling the future.',
};

const fallbackLines = {
  Ghost: [
    'Boo... your words echo in the afterlife.',
    'I float through the halls of your mind.',
  ],
  Poltergeist: [
    'I rattle the chains of your doubts.',
    'Windows slam as I draw near.',
  ],
  Demon: [
    'Your fear is delicious to me.',
    'I beckon you toward the abyss.',
  ],
  'Flat Earther': [
    'Open your eyes, the horizon never curves!',
    'They hide the edge from us all.',
  ],
  Prepper: [
    'Stock up now before it is too late!',
    'The end is nearer than you think.',
  ],
  Whistleblower: [
    'I have seen the documents they hide.',
    'Listen closely, the truth is dangerous.',
  ],
  Poet: [
    'In misty verses I paint your fears.',
    'Dreams swirl like fog around us.',
  ],
  Psychologist: [
    'Let us unpack the symbolism within.',
    'Your unconscious speaks volumes.',
  ],
  Oracle: [
    'The veil parts, revealing dark portents.',
    'I glimpse the threads of fate twisting.',
  ],
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const { mode = 'haunted', step = 1, userInput = '', history = [] } = req.body || {};
    const list = personas[mode] || personas.haunted;
    const persona = list[step - 1] || list[0];
    const systemPrompt = personaPrompts[persona] || '';

    const convoSummary = [`User said: "${userInput}".`];
    history.forEach(h => {
      convoSummary.push(`${h.agent} replied: "${h.content}".`);
    });
    const userPrompt = convoSummary.join(' ') + ` Respond in two short sentences as the ${persona}.`;

    let reply;

    if (!process.env.OPENAI_API_KEY) {
      const lines = fallbackLines[persona] || ['...'];
      reply = lines[Math.floor(Math.random() * lines.length)];
    } else {
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
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 60,
            temperature: 0.8,
          }),
        });
        const data = await response.json();
        reply = data.choices?.[0]?.message?.content?.trim();
      } catch (err) {
        console.error(err);
      }
      if (!reply) {
        const lines = fallbackLines[persona] || ['...'];
        reply = lines[Math.floor(Math.random() * lines.length)];
      }
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ agent: persona, reply }));
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Server error' }));
  }
};
