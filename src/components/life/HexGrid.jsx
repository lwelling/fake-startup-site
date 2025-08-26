const sqrt3 = Math.sqrt(3);

export default function HexGrid({ grid, cellSize, toggle }) {
  const cols = grid[0].length;
  const rows = grid.length;
  const w = cellSize;
  const h = (sqrt3 / 2) * w;
  const svgWidth = w + (cols - 1) * (w * 0.75);
  const svgHeight = rows * h + h / 2;

  return (
    <svg width={svgWidth} height={svgHeight}>
      {grid.map((row, i) =>
        row.map((cell, j) => {
          const x = j * (w * 0.75);
          const y = i * h + (j % 2 ? h / 2 : 0);
          const points = [
            [x + w / 2, y],
            [x + w, y + h / 2],
            [x + w, y + h],
            [x + w / 2, y + h + h / 2],
            [x, y + h],
            [x, y + h / 2],
          ]
            .map((p) => p.join(','))
            .join(' ');
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
