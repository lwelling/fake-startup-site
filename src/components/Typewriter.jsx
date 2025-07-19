import { useState, useEffect, useRef } from 'react';

export default function Typewriter({ text = '', speed = 30, onDone }) {
  const [display, setDisplay] = useState('');
  const [done, setDone] = useState(false);
  const doneRef = useRef(onDone);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

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
        if (doneRef.current) doneRef.current(text);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return <span className={done ? '' : 'typing'}>{display}</span>;
}
