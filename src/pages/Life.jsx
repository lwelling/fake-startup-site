import { useState, useEffect, useCallback } from 'react';
import LifeControls from '../components/life/LifeControls';
import SquareGrid from '../components/life/SquareGrid';
import HexGrid from '../components/life/HexGrid';
import TriGrid from '../components/life/TriGrid';
import { computeRuleSets, getNeighborFunction } from '../lib/rules';
import { useLife } from '../hooks/useLife';

const ROWS = 20;
const COLS = 20;
const CELL = 20;

export default function Life() {
  const [shape, setShape] = useState(() => Number(localStorage.getItem('life_shape')) || 4);
  const [triMode, setTriMode] = useState(() => localStorage.getItem('life_tri') === '1');
  const [wrap, setWrap] = useState(() => localStorage.getItem('life_wrap') !== '0');
  const [speed, setSpeed] = useState(() => Number(localStorage.getItem('life_speed')) || 500);

  useEffect(() => { localStorage.setItem('life_shape', String(shape)); }, [shape]);
  useEffect(() => { localStorage.setItem('life_tri', triMode ? '1':'0'); }, [triMode]);
  useEffect(() => { localStorage.setItem('life_wrap', wrap ? '1':'0'); }, [wrap]);
  useEffect(() => { localStorage.setItem('life_speed', String(speed)); }, [speed]);

  const { N, fn: neighborFn } = getNeighborFunction(shape, triMode);
  const { birthSet, surviveSet, ruleText } = computeRuleSets(N);

  const { grid, setGrid, running, start, stop, step, randomize, clear } =
    useLife(ROWS, COLS, neighborFn, birthSet, surviveSet, wrap, speed);

  const toggle = useCallback((i,j) => {
    setGrid(g => g.map((row,ri) => row.map((cell,ci) => (ri===i && ci===j) ? (cell?0:1) : cell)));
  }, [setGrid]);

  let GridComp = SquareGrid;
  if (shape === 3) GridComp = TriGrid;
  if (shape === 6) GridComp = HexGrid;

  return (
    <div className="p-4 flex flex-col items-center gap-4">
      <LifeControls
        shape={shape}
        setShape={setShape}
        triMode={triMode}
        setTriMode={setTriMode}
        wrap={wrap}
        setWrap={setWrap}
        speed={speed}
        setSpeed={setSpeed}
        running={running}
        start={start}
        stop={stop}
        step={step}
        randomize={randomize}
        clear={clear}
        ruleText={ruleText}
      />
      <GridComp grid={grid} cellSize={CELL} toggle={toggle} />
    </div>
  );
}
