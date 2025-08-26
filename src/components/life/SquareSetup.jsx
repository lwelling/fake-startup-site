import { shapePatterns, shapes } from '../../lib/squareShapes';

export default function SquareSetup({ selectedShape, setSelectedShape }) {
  return (
    <div className="mb-4 flex items-center space-x-4">
      <select
        value={selectedShape}
        onChange={e => setSelectedShape(e.target.value)}
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
          onDragStart={e => e.dataTransfer.setData('shape', selectedShape)}
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
  );
}
