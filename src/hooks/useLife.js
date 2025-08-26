import { useState, useRef, useEffect, useCallback } from 'react';

export function useLife(rows, cols, neighborFn, birthSet, surviveSet, wrap, speed) {
  const generateEmpty = useCallback(() => Array.from({length: rows}, () => Array(cols).fill(0)), [rows, cols]);
  const [grid, setGrid] = useState(() => generateEmpty());
  const [running, setRunning] = useState(false);
  const speedRef = useRef(speed);
  const runningRef = useRef(running);
  const timeoutRef = useRef();

  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { runningRef.current = running; }, [running]);

  const step = useCallback(() => {
    setGrid(g => {
      const newGrid = g.map((row,i) => row.map((cell,j) => {
        const n = neighborFn(g,i,j,wrap);
        if (cell) return surviveSet.includes(n) ? 1 : 0;
        return birthSet.includes(n) ? 1 : 0;
      }));
      return newGrid;
    });
  }, [neighborFn, surviveSet, birthSet, wrap]);

  const run = useCallback(() => {
    if (!runningRef.current) return;
    step();
    timeoutRef.current = setTimeout(run, speedRef.current);
  }, [step]);

  const start = useCallback(() => {
    if (!runningRef.current) {
      setRunning(true);
      runningRef.current = true;
      run();
    }
  }, [run]);

  const stop = useCallback(() => {
    setRunning(false);
    runningRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const randomize = useCallback(() => {
    setGrid(() => Array.from({length: rows}, () => Array.from({length: cols}, () => Math.random() < 0.33 ? 1 : 0)));
  }, [rows, cols]);

  const clear = useCallback(() => {
    setGrid(generateEmpty());
  }, [generateEmpty]);

  useEffect(() => () => { if(timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  return { grid, setGrid, running, start, stop, step, randomize, clear };
}
