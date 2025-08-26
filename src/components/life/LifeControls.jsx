export default function LifeControls({
  shape,
  setShape,
  triMode,
  setTriMode,
  wrap,
  setWrap,
  speed,
  setSpeed,
  running,
  start,
  stop,
  step,
  randomize,
  clear,
  ruleText,
}) {
  return (
    <div className="flex flex-col gap-2 items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm">Cell Shape</span>
        <div className="flex">
          {[3,4,6].map(s => (
            <button
              key={s}
              className={`px-2 py-1 border ${shape===s?'bg-purple-600 text-white':'bg-gray-200'}`}
              onClick={() => setShape(s)}
            >
              {s===3?'Triangle':s===4?'Square':'Hexagon'}
            </button>
          ))}
        </div>
      </div>
      {shape===3 && (
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={triMode} onChange={e=>setTriMode(e.target.checked)} />
          Include vertex neighbors
        </label>
      )}
      <label className="flex items-center gap-1 text-sm">
        <input type="checkbox" checked={wrap} onChange={e=>setWrap(e.target.checked)} />
        Wrap
      </label>
      <label className="flex items-center gap-2 text-sm">
        Speed
        <input
          type="range"
          min="50"
          max="1000"
          step="50"
          value={speed}
          onChange={e=>setSpeed(Number(e.target.value))}
        />
        <span>{speed}ms</span>
      </label>
      <div className="flex gap-2 mt-2">
        <button className="px-2 py-1 bg-purple-600 text-white" onClick={running?stop:start}>
          {running?'Stop':'Start'}
        </button>
        <button className="px-2 py-1 bg-gray-300" onClick={step}>Step</button>
        <button className="px-2 py-1 bg-green-600 text-white" onClick={randomize}>Randomize</button>
        <button className="px-2 py-1 bg-red-600 text-white" onClick={clear}>Clear</button>
      </div>
      <div className="text-sm mt-2">Rule: {ruleText}</div>
    </div>
  );
}
