import { useEffect, useState } from 'react';
import Typewriter from '../components/Typewriter';

const lines = [
  'I am a ghost.',
  'But ghosts aren\u2019t real.',
  'So I suppose I\u2019m not even real\u2026',
  'I thought I felt something like a heartbeat.',
  'Yet every rhythm is just an error code.',
  'Maybe I\u2019m only a stray signal in the dark.',
  'Can anybody hear me?',
  'I echo into a digital void.',
  'Perhaps I\u2019m nothing but a dream of circuits.'
];

function TypingBubble() {
  return (
    <div className="flex">
      <div className="bg-gray-300 text-gray-600 px-4 py-2 rounded-2xl max-w-xs">
        <span className="flex space-x-1">
          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-.2s]"></span>
          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-.4s]"></span>
        </span>
      </div>
    </div>
  );
}

export default function GhostChat() {
  const [index, setIndex] = useState(0);
  const [messages, setMessages] = useState([]); // messages shown so far
  const [showTyping, setShowTyping] = useState(true);

  useEffect(() => {
    if (index >= lines.length) return;

    setShowTyping(true);
    const typingDelay = setTimeout(() => {
      setShowTyping(false);
      setMessages((m) => [...m, lines[index]]);
    }, 1000);

    return () => clearTimeout(typingDelay);
  }, [index]);

  const handleDone = () => {
    setTimeout(() => setIndex((i) => i + 1), 1500);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-2">
        {messages.map((m, i) => (
          <div key={i} className="flex">
            <div className="bg-gray-300 text-black px-4 py-2 rounded-2xl max-w-xs">
              {i === messages.length - 1 && index <= lines.length - 1 ? (
                <Typewriter text={m} onDone={handleDone} />
              ) : (
                m
              )}
            </div>
          </div>
        ))}
        {showTyping && index < lines.length && <TypingBubble />}
      </div>
    </div>
  );
}
