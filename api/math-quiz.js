const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const fallbackQuiz = () => {
  const quizzes = [
    {
      question: 'Solve for x: 2x + 3 = 11',
      choices: ['3', '4', '5', '6'],
      answer: 1,
    },
    {
      question: 'What is the value of x in 3x - 5 = 16?',
      choices: ['5', '7', '8', '11'],
      // 3x - 5 = 16 -> x = 7 which is at index 1
      answer: 1,
    },
    {
      question: 'If x^2 = 49, what is x?',
      choices: ['-7 or 7', '7', '-7', '0'],
      answer: 0,
    },
    {
      question: 'Simplify: (x^2 - 9) / (x - 3) when x = 5',
      choices: ['7', '8', '9', '10'],
      // (25 - 9) / (5 - 3) = 8 which is at index 1
      answer: 1,
    },
  ];
  return getRandom(quizzes);
};

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  const sendQuiz = (quiz) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(quiz));
  };

  if (!process.env.OPENAI_API_KEY) {
    sendQuiz(fallbackQuiz());
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
              'Provide one moderately difficult algebra question with exactly four possible answers. ' +
              'Return ONLY valid JSON with the fields: question (string), choices (array of four strings), and answer (number index of correct choice).',
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error('Bad response');

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    let quiz;
    if (content) {
      try {
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonString = content.slice(jsonStart, jsonEnd + 1);
          quiz = JSON.parse(jsonString);
        }
      } catch (err) {
        quiz = null;
      }
    }

    if (quiz && typeof quiz.answer === 'number') {
      // The model sometimes returns a 1-based index. Convert to 0-based
      // indexing so it aligns with the front-end expectations.
      if (quiz.answer >= 1 && quiz.answer <= 4) {
        quiz.answer -= 1;
      }
    }

    if (
      !quiz ||
      !quiz.question ||
      !Array.isArray(quiz.choices) ||
      quiz.choices.length !== 4 ||
      typeof quiz.answer !== 'number' ||
      quiz.answer < 0 ||
      quiz.answer > 3
    ) {
      quiz = fallbackQuiz();
    }

    sendQuiz(quiz);
  } catch (err) {
    console.error(err);
    sendQuiz(fallbackQuiz());
  }
};
