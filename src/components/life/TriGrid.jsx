const sqrt3 = Math.sqrt(3);

export default function TriGrid({ grid, cellSize, toggle }) {
  const cols = grid[0].length;
  const rows = grid.length;
  const width = cellSize;
  const height = (cellSize * sqrt3) / 2;
  const svgWidth = (cols + 1) * width / 2;
  const svgHeight = rows * height;

  return (
    <svg width={svgWidth} height={svgHeight}>
      {grid.map((row, i) =>
        row.map((cell, j) => {
          const x = j * width / 2;
          const y = i * height;
          const up = (i + j) % 2 === 0;
          const points = up
            ? `${x},${y + height} ${x + width / 2},${y} ${x + width},${y + height}`
            : `${x},${y} ${x + width / 2},${y + height} ${x + width},${y}`;
          return (
            <polygon
              key={`${i}-${j}`}
              points={points}
              fill={cell ? '#000' : '#fff'}
              stroke="#888"
              onClick={() => toggle(i, j)}
            />
          );
        })
      )}
    </svg>
  );
}
