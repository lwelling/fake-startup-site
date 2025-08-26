import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [selected, setSelected] = useState(null);
  const [correct, setCorrect] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) navigate('/contact');
  }, [user, navigate]);

  useEffect(() => {
    async function loadQuiz() {
      try {
        const res = await fetch('/api/math-quiz');
        const data = await res.json();
        if (
          data &&
          data.question &&
          Array.isArray(data.choices) &&
          data.choices.length === 4 &&
          typeof data.answer === 'number'
        ) {
          setQuiz(data);
        } else {
          setError('Failed to load quiz');
        }
      } catch (err) {
        setError('Failed to load quiz');
      }
    }
    loadQuiz();
  }, []);

  const handleAnswer = (idx) => {
    if (!quiz) return;
    setSelected(idx);
    if (idx === quiz.answer) {
      setCorrect(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white space-y-6 p-4">
      <h1 className="text-5xl font-extrabold">
        <span className="font-extrabold">LKW</span>
        <span className="font-light">.lol</span>
      </h1>
      <p className="text-xl">Solve the math problem to enter.</p>
      {error && <div className="text-red-400">{error}</div>}
      {quiz ? (
        <div className="flex flex-col items-center space-y-4">
          <div className="text-lg text-center max-w-md">{quiz.question}</div>
          <div className="grid grid-cols-2 gap-4">
            {quiz.choices.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700"
              >
                {choice}
              </button>
            ))}
          </div>
          {selected !== null && selected !== quiz.answer && (
            <div className="text-red-400">Incorrect, try again.</div>
          )}
        </div>
      ) : (
        !error && <div>Loading...</div>
      )}
      {correct && !user && (
        <button
          onClick={signIn}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
        >
          Sign in with Google
        </button>
      )}
    </div>
  );
}
