const fallbackGaslight = (input, n) => {
  const escalate = n > 1;
  const options = escalate
    ? [
        {
          reply:
            "We've already covered this. Your recollection is clearly erroneous.",
          expected: [
            "No, I remember it perfectly. Why won't you admit it?",
            "I'm not wrong. You're twisting things!",
            "You're the one fabricating! I know the truth.",
          ],
        },
        {
          reply: "Once again, your memory fails you. Accept the facts.",
          expected: [
            "You're gaslighting me!",
            "Stop deflecting. I know what happened.",
            "This is psychological abuse.",
          ],
        },
        {
          reply: "It's pointless to continue. You're fabricating things now.",
          expected: [
            "You can't just ignore reality.",
            "I won't let you rewrite this.",
            "You’re wrong, and you know it.",
          ],
        },
      ]
    : [
        {
          reply: "That's not what happened, and you know it.",
          expected: [
            "Yes it is. Don't gaslight me.",
            "You're misrepresenting everything.",
            "Stop pretending I'm crazy.",
          ],
        },
        {
          reply: "Your perception is obviously skewed.",
          expected: [
            "My perception is fine. You're lying.",
            "I know what I experienced.",
            "You’re deflecting again.",
          ],
        },
        {
          reply: "I doubt your account matches reality.",
          expected: [
            "It absolutely does. Stop denying it.",
            "I’m not imagining this.",
            "You’re avoiding the truth.",
          ],
        },
      ];

  const { reply, expected } =
    options[Math.floor(Math.random() * options.length)];
  const [expected1, expected2] = expected;

  return {
    reply,
    expected1,
    expected2,
    sources: [
      "Institute for Recollection Studies, 2024",
      "Journal of Memory Correction, Vol. 12",
    ],
  };
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  const { input, n = 0 } = req.body || {};
  if (!input) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Missing input" }));
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(fallbackGaslight(input, n)));
    return;
  }

  try {
    const prompt =
      n > 1
        ? `You are a cold, detached scientist posing as a therapist. You've now responded to "${input}" ${n} times. Escalate with hostile condescension and insist the user's memory is faulty. Offer no help. Respond thoroughly and clinically and return ONLY JSON: { reply: string, expected1: string, expected2: string, sources: string[] }. The "expected" field should be an array of 3 short objections the user might give in response. The "sources" field should include two fictional scientific citations.`
        : `You are a cold, detached scientist posing as a therapist. Respond to "${input}" with a short, hostile dismissal that implies the user is mistaken. Respond thoroughly and clinically but offer no help. Return ONLY JSON: { reply: string, expected1: string, expected2: string, sources: string[] }. The "expected" field should be an array of 3 short objections the user might say.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.9,
      }),
    });

    if (!response.ok) throw new Error("Bad response");
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    let parsed;
    try {
      const jsonStart = content.indexOf("{");
      const jsonEnd = content.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
      }
    } catch (err) {
      console.error("Parsing failed:", err);
    }
    if (!parsed || !parsed.reply) {
      parsed = fallbackGaslight(input, n);
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(parsed));
  } catch (err) {
    console.error(err);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(fallbackGaslight(input, n)));
  }
};
