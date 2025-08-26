import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const lines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function calculateWinner(board) {
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return board.every(Boolean) ? 'draw' : null;
}

export default function Landing() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (user) navigate('/contact');
  }, [user, navigate]);

  const handleClick = (idx) => {
    if (board[idx] || !isPlayerTurn || winner) return;
    const newBoard = [...board];
    newBoard[idx] = 'X';
    setBoard(newBoard);
    const w = calculateWinner(newBoard);
    if (w) {
      setWinner(w);
    } else {
      setIsPlayerTurn(false);
    }
  };

  useEffect(() => {
    if (!isPlayerTurn && !winner) {
      const empty = board
        .map((v, i) => (v ? null : i))
        .filter((v) => v !== null);
      if (empty.length === 0) return;
      const choice = empty[Math.floor(Math.random() * empty.length)];
      const newBoard = [...board];
      newBoard[choice] = 'O';
      setBoard(newBoard);
      const w = calculateWinner(newBoard);
      if (w) {
        setWinner(w);
      } else {
        setIsPlayerTurn(true);
      }
    }
  }, [isPlayerTurn, board, winner]);

  const reset = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setIsPlayerTurn(true);
  };

  let status = '';
  if (winner === 'X') status = 'You win!';
  else if (winner === 'O') status = 'You lose!';
  else if (winner === 'draw') status = "It's a draw!";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white space-y-6 p-4">
      <h1 className="text-5xl font-extrabold">
        <span className="font-extrabold">LKW</span>
        <span className="font-light">.lol</span>
      </h1>
      <p className="text-xl">Win a game of Tic Tac Toe to enter.</p>
      <div className="grid grid-cols-3 gap-2">
        {board.map((val, idx) => (
          <button
            key={idx}
            onClick={() => handleClick(idx)}
            className="w-20 h-20 bg-gray-800 flex items-center justify-center text-3xl font-bold"
          >
            {val}
          </button>
        ))}
      </div>
      {status && <div className="text-lg">{status}</div>}
      {winner === 'X' && !user && (
        <button
          onClick={signIn}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
        >
          Sign in with Google
        </button>
      )}
      {winner && winner !== 'X' && (
        <button
          onClick={reset}
          className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-500"
        >
          Try Again
        </button>
      )}
      {!winner && (
        <button onClick={reset} className="underline">
          Reset
        </button>
      )}
    </div>
  );
}
