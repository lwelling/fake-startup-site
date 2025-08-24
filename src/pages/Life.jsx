import { useState, useRef, useCallback, useEffect } from 'react';

const numRows = 25;
const numCols = 25;
const operations = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

const shapePatterns = {
  block: ["OO", "OO"],
  beehive: [".OO.", "O..O", ".OO."],
  loaf: [".OO.", "O..O", ".O.O", "..O."],
  boat: ["OO.", "O.O", ".O."],
  tub: [".O.", "O.O", ".O."],
  blinker: ["OOO"],
  toad: [".OOO", "OOO."],
  beacon: ["OO..", "OO..", "..OO", "..OO"],
  pulsar: [
    "..OOO...OOO..",
    ".............",
    "O....O.O....O",
    "O....O.O....O",
    "O....O.O....O",
    "..OOO...OOO..",
    ".............",
    "..OOO...OOO..",
    "O....O.O....O",
    "O....O.O....O",
    "O....O.O....O",
    ".............",
    "..OOO...OOO..",
  ],
  "penta-decathlon": [
    ".O.",
    "OOO",
    ".O.",
    ".O.",
    ".O.",
    ".O.",
    ".O.",
    ".O.",
    "OOO",
    ".O.",
  ],
  glider: [".O.", "..O", "OOO"],
  lwss: [".O..O", "O....", "O...O", "OOOO."],
  mwss: ["..O..O", "O.....", "O....O", "OOOOO.", ".O..O."],
  hwss: ["..O...O", "O......", "O.....O", "OOOOOO.", ".OO..O."],
};

const patternToCoords = (pattern) => {
  const coords = [];
  pattern.forEach((row, r) => {
    row.split('').forEach((cell, c) => {
      if (cell === 'O') coords.push([r, c]);
    });
  });
  return coords;
};

const shapes = Object.fromEntries(
  Object.entries(shapePatterns).map(([name, pattern]) => [name, patternToCoords(pattern)])
);

const generateEmptyGrid = () => {
  return Array.from({ length: numRows }, () => Array(numCols).fill(0));
};

export default function Life() {
  const [grid, setGrid] = useState(() => generateEmptyGrid());
  const [running, setRunning] = useState(false);
  const [cellSize, setCellSize] = useState(20);
  const [selectedShape, setSelectedShape] = useState('block');
  const [interval, setIntervalValue] = useState(500);
  const runningRef = useRef(running);
  const intervalRef = useRef(interval);
  runningRef.current = running;
  intervalRef.current = interval;

  const updateCellSize = useCallback(() => {
    const availableWidth = window.innerWidth - 40;
    const availableHeight = window.innerHeight - 160;
    const size = Math.min(
      20,
      Math.floor(availableWidth / numCols),
      Math.floor(availableHeight / numRows)
    );
    setCellSize(size);
  }, []);

  const insertShapeAt = useCallback((shape, x, y) => {
    const shapeCells = shapes[shape];
    setGrid((g) => {
      const newGrid = g.map((row) => [...row]);
      shapeCells.forEach(([dx, dy]) => {
        const newX = x + dx;
        const newY = y + dy;
        if (newX >= 0 && newX < numRows && newY >= 0 && newY < numCols) {
          newGrid[newX][newY] = 1;
        }
      });
      return newGrid;
    });
  }, []);

  const insertShape = useCallback((shape) => {
    const shapeCells = shapes[shape];
    const maxX = Math.max(...shapeCells.map(([x]) => x));
    const maxY = Math.max(...shapeCells.map(([, y]) => y));
    const offsetX = Math.floor(Math.random() * Math.max(1, numRows - maxX));
    const offsetY = Math.floor(Math.random() * Math.max(1, numCols - maxY));
    insertShapeAt(shape, offsetX, offsetY);
  }, [insertShapeAt]);

  const randomize = useCallback(() => {
    const names = Object.keys(shapes);
    for (let i = 0; i < 5; i++) {
      const shape = names[Math.floor(Math.random() * names.length)];
      insertShape(shape);
    }
  }, [insertShape]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'g') insertShape('glider');
      if (e.key === 'o') insertShape('blinker');
      if (e.key === 'b') insertShape('block');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [insertShape]);

  useEffect(() => {
    updateCellSize();
    window.addEventListener('resize', updateCellSize);
    return () => window.removeEventListener('resize', updateCellSize);
  }, [updateCellSize]);

  const runSimulation = useCallback(() => {
    if (!runningRef.current) return;
    setGrid((g) => {
      return g.map((row, i) =>
        row.map((cell, j) => {
          let neighbors = 0;
          operations.forEach(([dx, dy]) => {
            const newI = (i + dx + numRows) % numRows;
            const newJ = (j + dy + numCols) % numCols;
            neighbors += g[newI][newJ];
          });
          if (cell === 1 && (neighbors < 2 || neighbors > 3)) {
            return 0;
          }
          if (cell === 0 && neighbors === 3) {
            return 1;
          }
          return cell;
        })
      );
    });
    setTimeout(runSimulation, intervalRef.current);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-800 text-white">
      <div className="mb-4">
        <button
          className={`px-4 py-2 mr-2 rounded ${
            running
              ? 'bg-red-600 hover:bg-red-500'
              : 'bg-purple-600 hover:bg-purple-500'
          }`}
          onClick={() => {
            setRunning(!running);
            if (!running) {
              runningRef.current = true;
              runSimulation();
            }
          }}
        >
          {running ? 'Stop' : 'Start'}
        </button>
        <button
          className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 mr-2"
          onClick={() => setGrid(generateEmptyGrid())}
        >
          Clear
        </button>
        <button
          className="px-4 py-2 bg-green-600 rounded hover:bg-green-500"
          onClick={randomize}
        >
          Randomize
        </button>
      </div>
      <div className="mb-4 flex items-center space-x-2">
        <label htmlFor="speed" className="text-sm">
          Speed
        </label>
        <input
          id="speed"
          type="range"
          min="100"
          max="1000"
          step="100"
          value={interval}
          onChange={(e) => setIntervalValue(Number(e.target.value))}
          className="w-40"
          style={{ direction: 'rtl' }}
        />
        <span className="text-sm">{interval}ms</span>
      </div>
      <div className="mb-4 flex items-center space-x-4">
        <select
          value={selectedShape}
          onChange={(e) => setSelectedShape(e.target.value)}
          className="bg-gray-700 text-white p-2 rounded"
        >
          <optgroup label="Still Lifes">
            <option value="block">Block</option>
            <option value="beehive">Beehive</option>
            <option value="loaf">Loaf</option>
            <option value="boat">Boat</option>
            <option value="tub">Tub</option>
          </optgroup>
          <optgroup label="Oscillators">
            <option value="blinker">Blinker (period 2)</option>
            <option value="toad">Toad (period 2)</option>
            <option value="beacon">Beacon (period 2)</option>
            <option value="pulsar">Pulsar (period 3)</option>
            <option value="penta-decathlon">Penta-decathlon (period 15)</option>
          </optgroup>
          <optgroup label="Spaceships">
            <option value="glider">Glider</option>
            <option value="lwss">Light-weight spaceship (LWSS)</option>
            <option value="mwss">Middleweight spaceship (MWSS)</option>
            <option value="hwss">Heavy-weight spaceship (HWSS)</option>
          </optgroup>
        </select>
        {selectedShape && (
          <div
            draggable
            onDragStart={(e) => e.dataTransfer.setData('shape', selectedShape)}
            className="inline-block"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${shapePatterns[selectedShape][0].length}, 15px)`,
            }}
          >
            {(() => {
              const coords = new Set(
                shapes[selectedShape].map(([r, c]) => `${r}-${c}`)
              );
              const rows = shapePatterns[selectedShape].length;
              const cols = shapePatterns[selectedShape][0].length;
              return Array.from({ length: rows }).flatMap((_, r) =>
                Array.from({ length: cols }).map((_, c) => (
                  <div
                    key={`${r}-${c}`}
                    className="border border-gray-700"
                    style={{
                      width: 15,
                      height: 15,
                      backgroundColor: coords.has(`${r}-${c}`)
                        ? '#6b21a8'
                        : undefined,
                    }}
                  />
                ))
              );
            })()}
          </div>
        )}
      </div>
      <div
        className="overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${numCols}, ${cellSize}px)`,
        }}
      >
        {grid.map((rows, i) =>
          rows.map((col, j) => (
            <div
              key={`${i}-${j}`}
              onClick={() => {
                const newGrid = grid.map((row) => [...row]);
                newGrid[i][j] = grid[i][j] ? 0 : 1;
                setGrid(newGrid);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const shape = e.dataTransfer.getData('shape');
                if (shape) {
                  insertShapeAt(shape, i, j);
                }
              }}
              className="border border-gray-700"
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: grid[i][j] ? '#6b21a8' : undefined,
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
