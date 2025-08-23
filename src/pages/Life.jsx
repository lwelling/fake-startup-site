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
          className="px-4 py-2 mr-2 bg-purple-600 rounded hover:bg-purple-500"
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
