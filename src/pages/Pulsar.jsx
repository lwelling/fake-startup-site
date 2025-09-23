import { useState } from 'react';
import { PULSAR_EDICTS, TOTAL_PULSAR_EDICTS } from '../lib/pulsarCards';
import { PULSAR_STRATA, TOTAL_PULSAR_STRATA } from '../lib/pulsarStrata';

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

const STRATA_STYLES = {
  Veiled: {
    card: 'border-indigo-400/70 bg-indigo-500/10 text-indigo-50 shadow-indigo-500/10',
    chip: 'border-indigo-400/70 bg-indigo-500/20 text-indigo-100',
  },
  Vital: {
    card: 'border-emerald-400/70 bg-emerald-500/10 text-emerald-50 shadow-emerald-500/10',
    chip: 'border-emerald-400/70 bg-emerald-500/20 text-emerald-100',
  },
  Volatile: {
    card: 'border-rose-400/70 bg-rose-500/10 text-rose-50 shadow-rose-500/10',
    chip: 'border-rose-400/70 bg-rose-500/20 text-rose-100',
  },
  Sublime: {
    card: 'border-sky-400/70 bg-sky-500/10 text-sky-50 shadow-sky-500/10',
    chip: 'border-sky-400/70 bg-sky-500/20 text-sky-100',
  },
  Static: {
    card: 'border-slate-500/70 bg-slate-600/20 text-slate-100 shadow-slate-700/20',
    chip: 'border-slate-500/70 bg-slate-600/40 text-slate-200',
  },
  Corrupted: {
    card: 'border-orange-500/70 bg-orange-500/10 text-orange-50 shadow-orange-600/20',
    chip: 'border-orange-500/70 bg-orange-500/20 text-orange-100',
  },
  Resonant: {
    card: 'border-amber-400/70 bg-amber-500/10 text-amber-50 shadow-amber-500/10',
    chip: 'border-amber-400/70 bg-amber-500/20 text-amber-100',
  },
  Fractured: {
    card: 'border-fuchsia-400/70 bg-fuchsia-500/10 text-fuchsia-50 shadow-fuchsia-500/10',
    chip: 'border-fuchsia-400/70 bg-fuchsia-500/20 text-fuchsia-100',
  },
  Void: {
    card: 'border-stone-500/70 bg-stone-900/70 text-stone-100 shadow-stone-900/30',
    chip: 'border-stone-500/70 bg-stone-800/80 text-stone-200',
  },
  Luminous: {
    card: 'border-yellow-400/70 bg-yellow-500/10 text-yellow-50 shadow-yellow-500/10',
    chip: 'border-yellow-400/70 bg-yellow-500/20 text-yellow-100',
  },
};

const DEFAULT_STRATA_STYLES = {
  card: 'border-slate-700 bg-slate-900/70 text-slate-100 shadow-slate-900/30',
  chip: 'border-slate-600 bg-slate-800/80 text-slate-200',
};

function getCardClasses(card, variant = 'card') {
  if (!card) {
    return '';
  }

  const styles = CARD_STYLES[card.category] ?? DEFAULT_CARD_STYLES;
  return styles[variant] ?? '';
}

function getStratumClasses(stratum, variant = 'card') {
  if (!stratum) {
    return '';
  }

  const styles = STRATA_STYLES[stratum.resonance] ?? DEFAULT_STRATA_STYLES;
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

function createStrataDeck() {
  return shuffle(PULSAR_STRATA.map((stratum) => ({ ...stratum })));
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

function StratumCard({ stratum, actionSlot }) {
  if (!stratum) {
    return null;
  }

  return (
    <div
      className={`flex h-full flex-col justify-between rounded-3xl border-2 border-slate-700 bg-slate-900/70 p-5 text-slate-100 shadow-lg shadow-slate-950/30 transition hover:-translate-y-1 hover:shadow-2xl ${getStratumClasses(stratum)}`}
    >
      <div className="space-y-4">
        <span
          className={`inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300 ${getStratumClasses(stratum, 'chip')}`}
        >
          <span>{stratum.icon}</span>
          {stratum.resonance}
        </span>
        <h3 className="text-2xl font-bold tracking-tight text-white">{stratum.name}</h3>
        {stratum.summary ? (
          <p className="text-sm leading-relaxed text-slate-200/90">{stratum.summary}</p>
        ) : null}
        <div className="space-y-2 text-sm leading-relaxed text-slate-200/90">
          {stratum.pulseEffect ? (
            <p>
              <span className="font-semibold text-white">Pulse:</span> {stratum.pulseEffect}
            </p>
          ) : null}
          {stratum.reachEffect ? (
            <p>
              <span className="font-semibold text-white">Reach:</span> {stratum.reachEffect}
            </p>
          ) : null}
          {stratum.bonusEffect ? (
            <p>
              <span className="font-semibold text-white">Bonus:</span> {stratum.bonusEffect}
            </p>
          ) : null}
        </div>
      </div>
      {actionSlot ? <div className="mt-6 flex flex-wrap gap-2">{actionSlot}</div> : null}
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
  const [strataDeck, setStrataDeck] = useState(() => createStrataDeck());
  const [strataPool, setStrataPool] = useState([]);
  const [activeStratum, setActiveStratum] = useState(null);
  const [strataDiscard, setStrataDiscard] = useState([]);

  const remaining = deck.length;
  const drawn = hand.length;
  const discarded = discard.length;
  const strataRemaining = strataDeck.length;
  const queuedStrata = strataPool.length;
  const discardedStrata = strataDiscard.length;

  const handleDraw = () => {
    setDeck((prevDeck) => {
      if (!prevDeck.length) {
        return prevDeck;
      }
      const [nextCard, ...rest] = prevDeck;
      setHand((prevHand) => [nextCard, ...prevHand]);
      return rest;
    });
  };

  const handleDiscard = (cardName) => {
    setHand((prevHand) => {
      const index = prevHand.findIndex((card) => card.name === cardName);
      if (index === -1) {
        return prevHand;
      }

      const card = prevHand[index];
      setDiscard((prevDiscard) => [card, ...prevDiscard]);
      return [...prevHand.slice(0, index), ...prevHand.slice(index + 1)];
    });
  };

  const handleReclaim = (cardName) => {
    setDiscard((prevDiscard) => {
      const index = prevDiscard.findIndex((card) => card.name === cardName);
      if (index === -1) {
        return prevDiscard;
      }

      const card = prevDiscard[index];
      setHand((prevHand) => [card, ...prevHand]);
      return [...prevDiscard.slice(0, index), ...prevDiscard.slice(index + 1)];
    });
  };

  const resetBoard = () => {
    setDeck(createEdictDeck());
    setHand([]);
    setDiscard([]);
  };

  const drawStratum = () => {
    setStrataDeck((prevDeck) => {
      if (!prevDeck.length) {
        return prevDeck;
      }

      const [nextCard, ...rest] = prevDeck;
      setStrataPool((prevPool) => [nextCard, ...prevPool]);
      return rest;
    });
  };

  const resetStrata = () => {
    setStrataDeck(createStrataDeck());
    setStrataPool([]);
    setActiveStratum(null);
    setStrataDiscard([]);
  };

  const activateStratum = (name) => {
    setStrataPool((prevPool) => {
      const index = prevPool.findIndex((card) => card.name === name);
      if (index === -1) {
        return prevPool;
      }

      const selected = prevPool[index];
      setActiveStratum((prevActive) => {
        if (prevActive) {
          setStrataDiscard((prevDiscard) => [prevActive, ...prevDiscard]);
        }
        return selected;
      });

      return [...prevPool.slice(0, index), ...prevPool.slice(index + 1)];
    });
  };

  const discardFromPool = (name) => {
    setStrataPool((prevPool) => {
      const index = prevPool.findIndex((card) => card.name === name);
      if (index === -1) {
        return prevPool;
      }

      const card = prevPool[index];
      setStrataDiscard((prevDiscard) => [card, ...prevDiscard]);
      return [...prevPool.slice(0, index), ...prevPool.slice(index + 1)];
    });
  };

  const discardActiveStratum = () => {
    setActiveStratum((prevActive) => {
      if (!prevActive) {
        return prevActive;
      }

      setStrataDiscard((prevDiscard) => [prevActive, ...prevDiscard]);
      return null;
    });
  };

  const returnActiveToPool = () => {
    setActiveStratum((prevActive) => {
      if (!prevActive) {
        return prevActive;
      }

      setStrataPool((prevPool) => [prevActive, ...prevPool]);
      return null;
    });
  };

  const reclaimStratum = (name) => {
    setStrataDiscard((prevDiscard) => {
      const index = prevDiscard.findIndex((card) => card.name === name);
      if (index === -1) {
        return prevDiscard;
      }

      const card = prevDiscard[index];
      setStrataPool((prevPool) => [card, ...prevPool]);
      return [...prevDiscard.slice(0, index), ...prevDiscard.slice(index + 1)];
    });
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

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg shadow-slate-900/30">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                <span>Total Cards: {TOTAL_PULSAR_EDICTS}</span>
                <span>In Hand: {drawn}</span>
                <span>Discarded: {discarded}</span>
              </div>
              <p className="max-w-md text-sm text-slate-400">
                The deck is shuffled face down. Draw one edict at a time to reveal it in your
                hand. Discarded edicts can be reclaimed whenever you need them again.
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

            <div className="group relative flex h-44 w-32 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-700 bg-slate-900/80 text-center text-base font-semibold text-slate-300 transition hover:border-slate-500">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Deck</span>
              <span className="mt-3 text-4xl font-bold text-white">{remaining}</span>
              <span className="mt-1 text-xs text-slate-500">
                {remaining === 1 ? 'card remaining' : 'cards remaining'}
              </span>
            </div>
          </div>

          <div className="mt-10 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Hand</h2>
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                {drawn ? `${drawn} card${drawn === 1 ? '' : 's'}` : 'Empty'}
              </span>
            </div>
            {hand.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
              <p className="text-sm text-slate-500">
                Draw cards from the deck to fill your hand. Each edict will appear here ready
                for use.
              </p>
            )}
          </div>

          <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Discard Pile</h2>
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                {discarded ? `${discarded} card${discarded === 1 ? '' : 's'}` : 'Empty'}
              </span>
            </div>
            {discard.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
              <p className="text-sm text-slate-500">
                Discarded edicts will gather here. Reclaim any card to immediately return it to
                your hand.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg shadow-slate-900/30">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                <span>Total Strata: {TOTAL_PULSAR_STRATA}</span>
                <span>Deck: {strataRemaining}</span>
                <span>Active: {activeStratum ? '1' : '0'}</span>
                <span>Queued: {queuedStrata}</span>
                <span>Discarded: {discardedStrata}</span>
              </div>
              <p className="max-w-md text-sm text-slate-400">
                Use the Pulse deck to curate the strata your compass will engage with. Draw
                cards to reveal new strata, then promote one to active to set the stage for
                your next pulse.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={drawStratum}
                  disabled={!strataRemaining}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow transition ${
                    strataRemaining
                      ? 'bg-violet-500 text-slate-950 shadow-violet-500/40 hover:bg-violet-400'
                      : 'cursor-not-allowed bg-slate-800 text-slate-500'
                  }`}
                >
                  Draw Stratum
                  <span className="text-xs uppercase tracking-[0.2em]">
                    {strataRemaining ? `${strataRemaining} left` : 'Empty'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={resetStrata}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:bg-white"
                >
                  Reset Strata Deck
                </button>
              </div>
            </div>

            <div className="group relative flex h-44 w-32 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-700 bg-slate-900/80 text-center text-base font-semibold text-slate-300 transition hover:border-slate-500">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Strata Deck</span>
              <span className="mt-3 text-4xl font-bold text-white">{strataRemaining}</span>
              <span className="mt-1 text-xs text-slate-500">
                {strataRemaining === 1 ? 'card remaining' : 'cards remaining'}
              </span>
            </div>
          </div>

          <div className="mt-10 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Active Stratum</h2>
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                {activeStratum ? activeStratum.name : 'None selected'}
              </span>
            </div>
            {activeStratum ? (
              <StratumCard
                stratum={activeStratum}
                actionSlot={
                  <>
                    <button
                      type="button"
                      onClick={returnActiveToPool}
                      className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-900 transition hover:bg-white"
                    >
                      Return to Queue
                    </button>
                    <button
                      type="button"
                      onClick={discardActiveStratum}
                      className="rounded-full bg-transparent px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                      Send to Discard
                    </button>
                  </>
                }
              />
            ) : (
              <p className="text-sm text-slate-500">
                Draw strata and promote one to active to define what the Pulse is currently
                resonating with.
              </p>
            )}
          </div>

          <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Queued Strata</h2>
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                {queuedStrata ? `${queuedStrata} card${queuedStrata === 1 ? '' : 's'}` : 'Empty'}
              </span>
            </div>
            {strataPool.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {strataPool.map((stratum) => (
                  <StratumCard
                    key={`pool-${stratum.name}`}
                    stratum={stratum}
                    actionSlot={
                      <>
                        <button
                          type="button"
                          onClick={() => activateStratum(stratum.name)}
                          className="rounded-full bg-violet-500 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-950 transition hover:bg-violet-400"
                        >
                          Set Active
                        </button>
                        <button
                          type="button"
                          onClick={() => discardFromPool(stratum.name)}
                          className="rounded-full bg-transparent px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:bg-white/10 hover:text-white"
                        >
                          Discard
                        </button>
                      </>
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Draw stratum cards to queue them for selection. Promote any queued stratum
                when you're ready to pulse through it.
              </p>
            )}
          </div>

          <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Strata Discard</h2>
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                {discardedStrata ? `${discardedStrata} card${discardedStrata === 1 ? '' : 's'}` : 'Empty'}
              </span>
            </div>
            {strataDiscard.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {strataDiscard.map((stratum) => (
                  <StratumCard
                    key={`strata-discard-${stratum.name}`}
                    stratum={stratum}
                    actionSlot={
                      <button
                        type="button"
                        onClick={() => reclaimStratum(stratum.name)}
                        className="rounded-full bg-transparent px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:bg-white/10 hover:text-white"
                      >
                        Return to Queue
                      </button>
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Discarded strata gather here. Reclaim any of them to make the terrain
                available for future pulses again.
              </p>
            )}
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
