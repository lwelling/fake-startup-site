export default function SquareGrid({ grid, cellSize, toggle, insertShapeAt }) {
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
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              const shape = e.dataTransfer.getData('shape');
              if (shape && insertShapeAt) insertShapeAt(shape, i, j);
            }}
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
