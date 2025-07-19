import { useState, useEffect } from 'react';

export default function Typewriter({ text = '', speed = 30, onDone }) {
  const [display, setDisplay] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    setDisplay('');
    setDone(false);
    const id = setInterval(() => {
      setDisplay(text.slice(0, i + 1));
      i += 1;
      if (i === text.length) {
        clearInterval(id);
        setDone(true);
        if (onDone) onDone();
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, onDone]);

  return <span className={done ? '' : 'typing'}>{display}</span>;
}
