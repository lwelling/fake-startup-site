import { useState } from 'react';

const CARD_TYPES = ['Aether', 'Mist', 'Echo', 'Bloom'];
const DIAL_LABELS = ['Highest', 'Even', 'Lowest', 'Odd'];

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createDeck(size) {
  const repetitions = size / CARD_TYPES.length;
  const deck = [];
  for (let i = 0; i < repetitions; i += 1) {
    deck.push(...CARD_TYPES);
  }
  return shuffle(deck);
}

function wrapIndex(index) {
  const size = DIAL_LABELS.length;
  return (index + size) % size;
}

function CompassHand({ angle, colorClass, label }) {
  return (
    <div className="absolute top-1/2 left-1/2">
      <div
        className="origin-bottom flex flex-col items-center"
        style={{ transform: `translate(-50%, -100%) rotate(${angle}deg)` }}
      >
        <div className={`w-1 h-24 rounded-full ${colorClass}`}></div>
        <div
          className="mt-2 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-slate-800 shadow"
          style={{ transform: `rotate(${-angle}deg)` }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

function TimelineCard({ label, value }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-sm uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <div
        className={`flex h-32 w-24 items-center justify-center rounded-2xl border-2 text-lg font-semibold transition-colors ${
          value
            ? 'border-slate-500 bg-slate-800 text-white'
            : 'border-dashed border-slate-600 bg-slate-900/40 text-slate-500'
        }`}
      >
        {value || 'Empty'}
      </div>
    </div>
  );
}

export default function Pulsar() {
  const [selectedSize, setSelectedSize] = useState(4);
  const [deck, setDeck] = useState(() => createDeck(4));
  const [spaces, setSpaces] = useState([null, null, null]);
  const [discard, setDiscard] = useState([]);
  const [pulseIndex, setPulseIndex] = useState(0);
  const [reachIndex, setReachIndex] = useState(2);
  const [locked, setLocked] = useState(false);

  const remaining = deck.length;
  const [before, now, after] = spaces;

  const handleDraw = () => {
    if (!deck.length) {
      return;
    }
    const [nextCard, ...rest] = deck;
    setDeck(rest);
    setSpaces((prevSpaces) => {
      const outgoing = prevSpaces[2];
      if (outgoing) {
        setDiscard((prevDiscard) => [outgoing, ...prevDiscard]);
      }
      return [nextCard, prevSpaces[0], prevSpaces[1]];
    });
  };

  const handleSizeChange = (event) => {
    const size = Number(event.target.value);
    setSelectedSize(size);
    setDeck(createDeck(size));
    setSpaces([null, null, null]);
    setDiscard([]);
  };

  const resetBoard = () => {
    setDeck(createDeck(selectedSize));
    setSpaces([null, null, null]);
    setDiscard([]);
  };

  const nudge = (hand, step) => {
    if (locked) {
      setPulseIndex((prev) => wrapIndex(prev + step));
      setReachIndex((prev) => wrapIndex(prev + step));
      return;
    }

    if (hand === 'pulse') {
      setPulseIndex((prev) => wrapIndex(prev + step));
    } else {
      setReachIndex((prev) => wrapIndex(prev + step));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        <header className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white">Pulsar</h1>
          <p className="text-lg text-slate-300">
            Explore the rhythm of the deck and tune into the compass to chart your
            next move.
          </p>
        </header>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg shadow-slate-900/30">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <label className="block text-sm font-semibold uppercase tracking-widest text-slate-400">
                Deck Size: <span className="text-slate-200">{selectedSize}</span>
              </label>
              <input
                type="range"
                min="4"
                max="40"
                step="4"
                value={selectedSize}
                onChange={handleSizeChange}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-sky-400"
              />
              <button
                type="button"
                onClick={resetBoard}
                className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow transition hover:bg-sky-400"
              >
                Reset Deck
              </button>
            </div>

            <button
              type="button"
              onClick={handleDraw}
              disabled={!remaining}
              className={`group relative flex h-40 w-28 flex-col items-center justify-center rounded-3xl border-2 text-center text-base font-semibold transition ${
                remaining
                  ? 'border-sky-400 bg-slate-900/80 text-sky-200 hover:border-sky-300 hover:text-sky-100'
                  : 'cursor-not-allowed border-slate-700 bg-slate-900/30 text-slate-600'
              }`}
            >
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Deck</span>
              <span className="mt-3 text-3xl font-bold text-white">
                {remaining}
              </span>
              <span className="mt-1 text-xs text-slate-400">{remaining === 1 ? 'card left' : 'cards left'}</span>
              {remaining ? (
                <span className="absolute inset-x-6 bottom-4 rounded-full bg-sky-500/20 px-2 py-1 text-xs font-medium text-sky-200 opacity-0 transition group-hover:opacity-100">
                  Draw &amp; Reveal
                </span>
              ) : null}
            </button>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <TimelineCard label="Before" value={before} />
            <TimelineCard label="Now" value={now} />
            <TimelineCard label="After" value={after} />
          </div>

          <div className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
              Discard Pile
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {discard.length ? (
                discard.map((card, index) => (
                  <div
                    key={`${card}-${index}`}
                    className="rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-200"
                  >
                    {card}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No cards have been discarded yet.</p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-10 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg shadow-slate-900/30 lg:grid-cols-[minmax(0,_1fr)_minmax(0,_320px)]">
          <div className="relative mx-auto flex h-80 w-80 items-center justify-center">
            <div className="relative h-72 w-72 rounded-full border-2 border-slate-700 bg-slate-950">
              <div className="absolute left-1/2 top-4 -translate-x-1/2 text-sm font-semibold text-slate-200">
                Highest
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-200">
                Even
              </div>
              <div className="absolute left-1/2 bottom-4 -translate-x-1/2 text-sm font-semibold text-slate-200">
                Lowest
              </div>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-200">
                Odd
              </div>

              <CompassHand angle={pulseIndex * 90} colorClass="bg-sky-400" label="Pulse" />
              <CompassHand angle={reachIndex * 90} colorClass="bg-emerald-400" label="Reach" />

              <button
                type="button"
                onClick={() => setLocked((prev) => !prev)}
                className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow ${
                  locked
                    ? 'bg-emerald-500 text-emerald-900 shadow-emerald-500/40'
                    : 'bg-slate-200 text-slate-900 shadow-slate-200/30'
                }`}
              >
                {locked ? '🔒 Locked' : '🔓 Unlocked'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <h3 className="text-lg font-semibold text-white">Pulse Hand</h3>
              <p className="text-sm text-slate-400">
                {locked
                  ? 'Hands move together while locked.'
                  : 'Adjust the Pulse hand independently.'}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => nudge('pulse', -1)}
                  className="rounded-full bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
                >
                  ◀
                </button>
                <span className="flex-1 text-center text-sm font-semibold text-slate-200">
                  Pointing to {DIAL_LABELS[pulseIndex]}
                </span>
                <button
                  type="button"
                  onClick={() => nudge('pulse', 1)}
                  className="rounded-full bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
                >
                  ▶
                </button>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <h3 className="text-lg font-semibold text-white">Reach Hand</h3>
              <p className="text-sm text-slate-400">
                {locked
                  ? 'Hands move together while locked.'
                  : 'Adjust the Reach hand independently.'}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => nudge('reach', -1)}
                  className="rounded-full bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
                >
                  ◀
                </button>
                <span className="flex-1 text-center text-sm font-semibold text-slate-200">
                  Pointing to {DIAL_LABELS[reachIndex]}
                </span>
                <button
                  type="button"
                  onClick={() => nudge('reach', 1)}
                  className="rounded-full bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
                >
                  ▶
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
