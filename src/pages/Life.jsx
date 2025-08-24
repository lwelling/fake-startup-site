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

const shapes = {
  glider: [
    [0, 1],
    [1, 2],
    [2, 0],
    [2, 1],
    [2, 2],
  ],
  blinker: [
    [0, 0],
    [0, 1],
    [0, 2],
  ],
  block: [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ],
};

const generateEmptyGrid = () => {
  return Array.from({ length: numRows }, () => Array(numCols).fill(0));
};

export default function Life() {
  const [grid, setGrid] = useState(() => generateEmptyGrid());
  const [running, setRunning] = useState(false);
  const [cellSize, setCellSize] = useState(20);
  const runningRef = useRef(running);
  runningRef.current = running;

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

  const insertShape = useCallback((shape) => {
    setGrid((g) => {
      const newGrid = g.map((row) => [...row]);
      const shapeCells = shapes[shape];
      const maxX = Math.max(...shapeCells.map(([x]) => x));
      const maxY = Math.max(...shapeCells.map(([, y]) => y));
      const offsetX = Math.floor(Math.random() * (numRows - maxX));
      const offsetY = Math.floor(Math.random() * (numCols - maxY));
      shapeCells.forEach(([x, y]) => {
        newGrid[offsetX + x][offsetY + y] = 1;
      });
      return newGrid;
    });
  }, []);

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
    setTimeout(runSimulation, 500);
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
          className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
          onClick={() => setGrid(generateEmptyGrid())}
        >
          Clear
        </button>
      </div>
      <div className="mb-4 flex space-x-2">
        <button
          className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-500"
          onClick={() => insertShape('glider')}
        >
          Add Glider (g)
        </button>
        <button
          className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-500"
          onClick={() => insertShape('blinker')}
        >
          Add Blinker (o)
        </button>
        <button
          className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-500"
          onClick={() => insertShape('block')}
        >
          Add Block (b)
        </button>
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
