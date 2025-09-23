import { useState } from 'react';
import { PULSAR_EDICTS, TOTAL_PULSAR_EDICTS } from '../lib/pulsarCards';
import FracturedCircleBoard from '../components/FracturedCircleBoard';

const CARD_STYLES = {
  'Reach Manipulation': {
    card: 'border-emerald-400/70 bg-emerald-500/10 text-emerald-50 shadow-emerald-500/10',
    chip: 'border-emerald-400/70 bg-emerald-500/20 text-emerald-100',
  },
  'Board Manipulation': {
    card: 'border-sky-400/70 bg-sky-500/10 text-sky-50 shadow-sky-500/10',
    chip: 'border-sky-400/70 bg-sky-500/20 text-sky-100',
  },
};

const DEFAULT_CARD_STYLES = {
  card: 'border-slate-700 bg-slate-900/70 text-slate-100 shadow-slate-900/30',
  chip: 'border-slate-600 bg-slate-800/80 text-slate-200',
};

const STRATA_TYPES = ['Aether', 'Mist', 'Echo', 'Bloom'];

const STRATA_TYPE_STYLES = {
  Aether: 'border-sky-400/70 bg-gradient-to-br from-sky-900/70 to-sky-700/30 text-sky-100 shadow-sky-500/10',
  Mist: 'border-violet-400/70 bg-gradient-to-br from-violet-900/70 to-violet-600/20 text-violet-100 shadow-violet-500/10',
  Echo: 'border-emerald-400/70 bg-gradient-to-br from-emerald-900/70 to-emerald-600/20 text-emerald-100 shadow-emerald-500/10',
  Bloom: 'border-rose-400/70 bg-gradient-to-br from-rose-900/70 to-rose-600/20 text-rose-100 shadow-rose-500/10',
};

const DEFAULT_STRATA_TYPE_STYLE = 'border-slate-700 bg-gradient-to-br from-slate-900/80 to-slate-800/40 text-slate-100 shadow-slate-900/30';

function createEmptyTimeline() {
  return [null, null, null];
}

function getCardClasses(card, variant = 'card') {
  if (!card) {
    return '';
  }

  const styles = CARD_STYLES[card.category] ?? DEFAULT_CARD_STYLES;
  return styles[variant] ?? '';
}

const DIAL_LABELS = ['Highest', 'Even', 'Lowest', 'Odd'];

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createEdictDeck() {
  return shuffle(PULSAR_EDICTS.map((card) => ({ ...card })));
}

function createStrataDeck(size) {
  const copiesPerType = size / STRATA_TYPES.length;
  const deck = [];

  if (!Number.isInteger(copiesPerType)) {
    console.warn('[strata] Deck size should be a multiple of 4. Rounding down.');
  }

  STRATA_TYPES.forEach((type) => {
    for (let i = 0; i < Math.floor(copiesPerType); i += 1) {
      deck.push({ id: `${type}-${i}-${Math.random().toString(36).slice(2, 8)}`, type });
    }
  });

  return shuffle(deck);
}

function getStrataTypeClasses(type) {
  return STRATA_TYPE_STYLES[type] ?? DEFAULT_STRATA_TYPE_STYLE;
}

const MIN_STRATA_DECK_SIZE = 4;
const MAX_STRATA_DECK_SIZE = 40;
const STRATA_DECK_INCREMENT = 4;
const DEFAULT_STRATA_DECK_SIZE = 24;

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

function EdictCard({ card, actionSlot }) {
  return (
    <div
      className={`flex h-full flex-col justify-between rounded-3xl border-2 border-slate-700 bg-slate-900/70 p-5 text-slate-100 shadow-lg shadow-slate-950/30 transition hover:-translate-y-1 hover:shadow-2xl ${getCardClasses(card)}`}
    >
      <div className="space-y-4">
        <span
          className={`inline-flex items-center rounded-full border border-slate-600 bg-slate-800/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300 ${getCardClasses(card, 'chip')}`}
        >
          {card.category}
        </span>
        <h3 className="text-2xl font-bold tracking-tight text-white">{card.name}</h3>
        <p className="text-sm leading-relaxed text-slate-200/90">{card.effect}</p>
      </div>
      {actionSlot ? <div className="mt-6 flex justify-end">{actionSlot}</div> : null}
    </div>
  );
}

export default function Pulsar() {
  const [deck, setDeck] = useState(() => createEdictDeck());
  const [hand, setHand] = useState([]);
  const [discard, setDiscard] = useState([]);
  const [pulseIndex, setPulseIndex] = useState(0);
  const [reachIndex, setReachIndex] = useState(2);
  const [locked, setLocked] = useState(false);
  const [strataDeckSize, setStrataDeckSize] = useState(DEFAULT_STRATA_DECK_SIZE);
  const [strataDeckSizeInput, setStrataDeckSizeInput] = useState(String(DEFAULT_STRATA_DECK_SIZE));
  const [strataDeck, setStrataDeck] = useState(() => createStrataDeck(DEFAULT_STRATA_DECK_SIZE));
  const [strataTimeline, setStrataTimeline] = useState(() => createEmptyTimeline());
  const [strataDiscard, setStrataDiscard] = useState([]);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);

  const remaining = deck.length;
  const drawn = hand.length;
  const discarded = discard.length;
  const strataRemaining = strataDeck.length;
  const strataDiscarded = strataDiscard.length;

  const strataBoard = [
    { key: 'before', label: 'Before', card: strataTimeline[0] },
    { key: 'now', label: 'Now', card: strataTimeline[1] },
    { key: 'after', label: 'After', card: strataTimeline[2] },
  ];

  const handleDraw = () => {
    if (!deck.length) {
      return;
    }

    const [nextCard, ...rest] = deck;
    setDeck(rest);
    setHand((prevHand) => [nextCard, ...prevHand]);
  };

  const handleDiscard = (cardName) => {
    const index = hand.findIndex((card) => card.name === cardName);
    if (index === -1) {
      return;
    }

    const card = hand[index];
    const nextHand = [...hand.slice(0, index), ...hand.slice(index + 1)];
    setHand(nextHand);
    setDiscard((prevDiscard) => [card, ...prevDiscard]);
  };

  const handleReclaim = (cardName) => {
    const index = discard.findIndex((card) => card.name === cardName);
    if (index === -1) {
      return;
    }

    const card = discard[index];
    const nextDiscard = [...discard.slice(0, index), ...discard.slice(index + 1)];
    setDiscard(nextDiscard);
    setHand((prevHand) => [card, ...prevHand]);
  };

  const resetBoard = () => {
    setDeck(createEdictDeck());
    setHand([]);
    setDiscard([]);
  };

  const commitStrataDeckSize = (rawValue) => {
    const parsed = Number.parseInt(rawValue, 10);
    if (Number.isNaN(parsed)) {
      setStrataDeckSizeInput(String(strataDeckSize));
      return;
    }

    const clamped = Math.min(MAX_STRATA_DECK_SIZE, Math.max(MIN_STRATA_DECK_SIZE, parsed));
    const normalised = Math.max(
      MIN_STRATA_DECK_SIZE,
      clamped - (clamped % STRATA_DECK_INCREMENT)
    );

    setStrataDeckSize(normalised);
    setStrataDeck(createStrataDeck(normalised));
    setStrataTimeline(createEmptyTimeline());
    setStrataDiscard([]);
    setStrataDeckSizeInput(String(normalised));
  };

  const resetStrata = () => {
    setStrataDeck(createStrataDeck(strataDeckSize));
    setStrataTimeline(createEmptyTimeline());
    setStrataDiscard([]);
    setStrataDeckSizeInput(String(strataDeckSize));
  };

  const drawStrataCard = () => {
    if (!strataDeck.length) {
      return;
    }

    const [nextCard, ...rest] = strataDeck;
    const overflow = strataTimeline[2];
    const nextTimeline = [nextCard, strataTimeline[0], strataTimeline[1]];

    setStrataDeck(rest);
    setStrataTimeline(nextTimeline);

    if (overflow) {
      setStrataDiscard((prevDiscard) => [overflow, ...prevDiscard]);
    }
  };

  const nudge = (handType, step) => {
    if (locked) {
      setPulseIndex((prev) => wrapIndex(prev + step));
      setReachIndex((prev) => wrapIndex(prev + step));
      return;
    }

    if (handType === 'pulse') {
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
            Shuffle the dream edicts, draw them into your hand, and let the compass guide
            your next move.
          </p>
        </header>

        <section className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-900/30 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] xl:items-start">
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Strata Control Grid</h2>
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Pairs Aligned</span>
              </div>
              <div className="mt-4">
                <FracturedCircleBoard className="w-full" />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-6">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                <span>Deck Size: {strataDeckSize}</span>
                <span>Remaining: {strataRemaining}</span>
                <span>Discarded: {strataDiscarded}</span>
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <label className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Deck Size</span>
                  <input
                    type="number"
                    min={MIN_STRATA_DECK_SIZE}
                    max={MAX_STRATA_DECK_SIZE}
                    step={STRATA_DECK_INCREMENT}
                    value={strataDeckSizeInput}
                    onChange={(event) => setStrataDeckSizeInput(event.target.value)}
                    onBlur={(event) => commitStrataDeckSize(event.target.value)}
                    onKeyDown={(event) => { if (event.key === 'Enter') commitStrataDeckSize(event.currentTarget.value); }}
                    className="mt-2 h-10 w-24 rounded-lg border border-white/20 bg-slate-950/60 px-3 text-sm font-semibold text-white shadow-inner shadow-black/30 focus:border-white/40 focus:outline-none"
                  />
                  <span className="mt-1 text-[11px] text-slate-500">Multiples of 4, 4-40.</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={drawStrataCard}
                    disabled={!strataRemaining}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow transition ${
                      strataRemaining
                        ? 'bg-violet-500 text-slate-950 shadow-violet-500/40 hover:bg-violet-400'
                        : 'cursor-not-allowed bg-slate-800 text-slate-500'
                    }`}
                  >
                    Flip Top Card
                    <span className="text-xs uppercase tracking-[0.2em]">
                      {strataRemaining ? `${strataRemaining} left` : 'Empty'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={resetStrata}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:bg-white"
                  >
                    Reset Deck
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  <span>Timeline</span>
                  <span>{strataBoard.some((slot) => slot.card) ? 'Live spread' : 'Empty'}</span>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {strataBoard.map(({ key, label, card }) => (
                    <div key={key} className="rounded-3xl border border-slate-800 bg-slate-900/50 p-4">
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        <span>{label}</span>
                        <span>{card ? 'Revealed' : 'Empty'}</span>
                      </div>
                      {card ? (
                        <div className={`mt-4 flex h-32 flex-col items-center justify-center rounded-2xl border-2 px-4 text-center ${getStrataTypeClasses(card.type)}`}>
                          <span className="text-xl font-semibold uppercase tracking-[0.4em]">{card.type}</span>
                        </div>
                      ) : (
                        <div className="mt-4 flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-700 text-sm text-slate-500">
                          Awaiting card
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Pulse Progression</h2>
              <p className="mt-2 text-xs text-slate-400">Set your compass, lock the hands, and step the pulse through the shattered dial.</p>
              <div className="mt-6 flex justify-center">
                <div className="relative h-72 w-72">
                  <div className="relative h-full w-full rounded-full border-2 border-slate-700 bg-slate-950">
                    <div className="absolute left-1/2 top-4 -translate-x-1/2 text-xs font-semibold text-slate-200">Highest</div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-200">Even</div>
                    <div className="absolute left-1/2 bottom-4 -translate-x-1/2 text-xs font-semibold text-slate-200">Lowest</div>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-200">Odd</div>
                    <CompassHand angle={pulseIndex * 90} colorClass="bg-sky-400" label="Pulse" />
                    <CompassHand angle={reachIndex * 90} colorClass="bg-emerald-400" label="Reach" />
                    <button
                      type="button"
                      onClick={() => setLocked((prev) => !prev)}
                      className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow ${
                        locked
                          ? 'bg-emerald-500 text-emerald-900 shadow-emerald-500/40'
                          : 'bg-slate-200 text-slate-900 shadow-slate-200/30'
                      }`}
                    >
                      {locked ? '🔒 Locked' : '🔓 Unlocked'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <h3 className="text-sm font-semibold text-white">Pulse Hand</h3>
                  <p className="text-xs text-slate-400">{locked ? 'Hands move together while locked.' : 'Adjust the Pulse hand independently.'}</p>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => nudge('pulse', -1)} className="rounded-full bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700">◀</button>
                    <span className="flex-1 text-center text-sm font-semibold text-slate-200">Pointing to {DIAL_LABELS[pulseIndex]}</span>
                    <button type="button" onClick={() => nudge('pulse', 1)} className="rounded-full bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700">▶</button>
                  </div>
                </div>
                <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <h3 className="text-sm font-semibold text-white">Reach Hand</h3>
                  <p className="text-xs text-slate-400">{locked ? 'Hands move together while locked.' : 'Adjust the Reach hand independently.'}</p>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => nudge('reach', -1)} className="rounded-full bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700">◀</button>
                    <span className="flex-1 text-center text-sm font-semibold text-slate-200">Pointing to {DIAL_LABELS[reachIndex]}</span>
                    <button type="button" onClick={() => nudge('reach', 1)} className="rounded-full bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700">▶</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                <span>Discard Pile</span>
                <span>{strataDiscarded ? `${strataDiscarded} card${strataDiscarded === 1 ? '' : 's'}` : 'Empty'}</span>
              </div>
              <button
                type="button"
                onClick={() => setDiscardModalOpen(true)}
                disabled={!strataDiscarded}
                className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] shadow transition ${
                  strataDiscarded
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'cursor-not-allowed bg-white/5 text-white/30'
                }`}
              >
                View Cards
              </button>
            </div>
          </div>
        </section>
        <section className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg shadow-slate-900/30 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:items-start">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              <span>Total Cards: {TOTAL_PULSAR_EDICTS}</span>
              <span>In Hand: {drawn}</span>
              <span>Discarded: {discarded}</span>
            </div>
            <p className="max-w-md text-sm text-slate-400">
              The deck is shuffled face down. Draw edicts into your hand, send them to discard, or reclaim them as your strategy shifts.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDraw}
                disabled={!remaining}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow transition ${
                  remaining
                    ? 'bg-sky-500 text-slate-950 shadow-sky-500/40 hover:bg-sky-400'
                    : 'cursor-not-allowed bg-slate-800 text-slate-500'
                }`}
              >
                Draw Card
                <span className="text-xs uppercase tracking-[0.2em]">
                  {remaining ? `${remaining} left` : 'Empty'}
                </span>
              </button>
              <button
                type="button"
                onClick={resetBoard}
                className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:bg-white"
              >
                Reset Deck
              </button>
            </div>
          </div>

          <div className="space-y-10">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Hand</h2>
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  {drawn ? `${drawn} card${drawn === 1 ? '' : 's'}` : 'Empty'}
                </span>
              </div>
              {hand.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {hand.map((card) => (
                    <EdictCard
                      key={card.name}
                      card={card}
                      actionSlot={
                        <button
                          type="button"
                          onClick={() => handleDiscard(card.name)}
                          className="rounded-full bg-transparent px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:bg-white/10 hover:text-white"
                        >
                          Send to Discard
                        </button>
                      }
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Draw cards from the deck to fill your hand. Each edict will appear here ready for use.</p>
              )}
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Discard Pile</h2>
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  {discarded ? `${discarded} card${discarded === 1 ? '' : 's'}` : 'Empty'}
                </span>
              </div>
              {discard.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {discard.map((card) => (
                    <EdictCard
                      key={`discard-${card.name}`}
                      card={card}
                      actionSlot={
                        <button
                          type="button"
                          onClick={() => handleReclaim(card.name)}
                          className="rounded-full bg-transparent px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:bg-white/10 hover:text-white"
                        >
                          Reclaim to Hand
                        </button>
                      }
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Discarded edicts will gather here. Reclaim any card to immediately return it to your hand.</p>
              )}
            </div>
          </div>
        </section>









      {discardModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur"
          role="dialog"
          aria-modal="true"
          onClick={() => setDiscardModalOpen(false)}
        >
          <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900/95 p-6 text-slate-100 shadow-2xl shadow-black/60" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Strata Discard</h2>
              <button
                type="button"
                onClick={() => setDiscardModalOpen(false)}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white hover:border-white/40 hover:bg-white/20"
              >
                Close
              </button>
            </div>
            {strataDiscard.length ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {strataDiscard.map((card) => (
                  <div
                    key={card.id}
                    className={`rounded-2xl border-2 px-4 py-6 text-center text-sm font-semibold uppercase tracking-[0.3em] ${getStrataTypeClasses(card.type)}`}
                  >
                    {card.type}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-slate-300">The discard pile is empty.</p>
            )}
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}
