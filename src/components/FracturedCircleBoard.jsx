const STRATA_TYPES = {
  Mist: "from-violet-900/70 to-violet-700/40 border-violet-400/60 text-violet-100",
  Echo: "from-emerald-900/70 to-emerald-700/40 border-emerald-400/60 text-emerald-100",
  Bloom: "from-rose-900/70 to-rose-700/40 border-rose-400/60 text-rose-100",
  Aether: "from-sky-900/70 to-sky-700/40 border-sky-400/60 text-sky-100",
};

function getTypeClasses(label) {
  return STRATA_TYPES[label] ?? "border-slate-500/40 from-slate-800/60 to-slate-700/30 text-slate-100";
}

export default function FracturedCircleBoard({ className = "", cells = [], onAdjustTokens }) {
  const safeCells = Array.isArray(cells) ? cells : [];
  const handleAdjust = (index, field, delta) => {
    if (!onAdjustTokens) return;
    onAdjustTokens(index, field, delta);
  };

  return (
    <div
      className={`rounded-3xl border border-white/15 bg-slate-950/80 p-8 shadow-xl shadow-black/40 backdrop-blur ${className}`}
    >
      <div className="grid grid-cols-3 gap-4">
        {safeCells.map((cell, index) => {
          if (!cell) {
            return (
              <div
                key={`cell-${index}`}
                className="h-36 rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/60"
              />
            );
          }

          const classes = getTypeClasses(cell.type);

          return (
            <div
              key={`cell-${index}`}
              className={`flex h-36 flex-col justify-between rounded-2xl border bg-gradient-to-br p-4 shadow-lg shadow-black/20 transition hover:border-white/40 ${classes}`}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.25em]">
                <span className="text-white/80">{cell.type}</span>
                <span className="text-white/40">{index + 1}</span>
              </div>

              <div className="space-y-2 text-[11px] font-medium text-white/80">
                <TokenCounter
                  code="I"
                  value={cell.info}
                  onIncrement={() => handleAdjust(index, "info", 1)}
                  onDecrement={() => handleAdjust(index, "info", -1)}
                />
                <TokenCounter
                  code="C"
                  value={cell.corruption}
                  onIncrement={() => handleAdjust(index, "corruption", 1)}
                  onDecrement={() => handleAdjust(index, "corruption", -1)}
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
