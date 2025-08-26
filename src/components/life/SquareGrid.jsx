export default function SquareGrid({ grid, cellSize, toggle }) {
  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: `repeat(${grid[0].length}, ${cellSize}px)` }}
    >
      {grid.map((row, i) =>
        row.map((cell, j) => (
          <div
            key={`${i}-${j}`}
            onClick={() => toggle(i, j)}
            className="border border-gray-400"
            style={{
              width: cellSize,
              height: cellSize,
              background: cell ? '#000' : '#fff',
            }}
          />
        ))
      )}
    </div>
  );
}
