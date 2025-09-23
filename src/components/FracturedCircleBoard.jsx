import { useState } from "react";

const STRATA_TYPES = [
  {
    label: "Mist",
    classes:
      "from-violet-900/70 to-violet-700/40 border-violet-400/60 text-violet-100",
  },
  {
    label: "Echo",
    classes:
      "from-emerald-900/70 to-emerald-700/40 border-emerald-400/60 text-emerald-100",
  },
  {
    label: "Bloom",
    classes: "from-rose-900/70 to-rose-700/40 border-rose-400/60 text-rose-100",
  },
  {
    label: "Aether",
    classes: "from-sky-900/70 to-sky-700/40 border-sky-400/60 text-sky-100",
  },
];

const GRID_LAYOUT = [
  "Mist",
  "Echo",
  "Bloom",
  "Aether",
  "Mist",
  "Echo",
  null,
  "Bloom",
  "Aether",
];

function getTypeConfig(label) {
  return STRATA_TYPES.find((type) => type.label === label) ?? STRATA_TYPES[0];
}

function createCellState(type) {
  if (!type) return null;
  return { type, info: 0, corruption: 0 };
}

export default function FracturedCircleBoard({ className = "" }) {
  const [cells, setCells] = useState(() => GRID_LAYOUT.map(createCellState));

  const adjustField = (index, field, delta) => {
    setCells((prev) =>
      prev.map((cell, idx) => {
        if (idx !== index || !cell) return cell;
        const nextValue = Math.max(0, cell[field] + delta);
        return { ...cell, [field]: nextValue };
      })
    );
  };

  return (
    <div
      className={`rounded-3xl border border-white/15 bg-slate-950/80 p-8 shadow-xl shadow-black/40 backdrop-blur ${className}`}
    >
      <div className="grid grid-cols-3 gap-4">
        {cells.map((cell, index) => {
          if (!cell) {
            return (
              <div
                key={`cell-${index}`}
                className="h-36 rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/60"
              />
            );
          }

          const config = getTypeConfig(cell.type);

          return (
            <div
              key={`cell-${index}`}
              className={`flex h-36 flex-col justify-between rounded-2xl border bg-gradient-to-br p-4 shadow-lg shadow-black/20 transition hover:border-white/40 ${config.classes}`}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.25em]">
                <span className="text-white/80">{cell.type}</span>
                <span className="text-white/40">{index + 1}</span>
              </div>

              <div className="space-y-2 text-[11px] font-medium text-white/80">
                <TokenCounter
                  code="I"
                  value={cell.info}
                  onIncrement={() => adjustField(index, "info", 1)}
                  onDecrement={() => adjustField(index, "info", -1)}
                />
                <TokenCounter
                  code="C"
                  value={cell.corruption}
                  onIncrement={() => adjustField(index, "corruption", 1)}
                  onDecrement={() => adjustField(index, "corruption", -1)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TokenCounter({ code, value, onIncrement, onDecrement }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] uppercase tracking-[0.3em] text-white/60">{code}:</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onIncrement}
          className="flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-white/10 text-[11px] font-semibold text-white/80 transition hover:border-white/50 hover:bg-white/20"
          aria-label={`Increase ${code} tokens`}
        >
          +
        </button>
        <span className="inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-white/20 px-1.5 text-[10px] font-semibold text-white">
          {value}
        </span>
        <button
          type="button"
          onClick={onDecrement}
          disabled={value === 0}
          className="flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-white/10 text-[11px] font-semibold text-white/80 transition hover:border-white/50 hover:bg-white/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/40"
          aria-label={`Decrease ${code} tokens`}
        >
          -
        </button>
      </div>
    </div>
  );
}
