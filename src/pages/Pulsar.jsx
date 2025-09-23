import { useEffect, useMemo, useState } from 'react';
import { PULSAR_EDICTS, TOTAL_PULSAR_EDICTS } from '../lib/pulsarCards';
import FracturedCircleBoard from '../components/FracturedCircleBoard';

const STRATA_GRID_LAYOUT = ['Mist', 'Echo', 'Bloom', 'Aether', 'Echo', 'Mist', null, 'Bloom', 'Aether'];

const COMPASS_TARGET_MAP = {
  Highest: [0, 1],
  Even: [2, 5],
  Lowest: [7, 8],
  Odd: [3, 4],
};

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

function createInitialStrataState(size) {
  const deck = createStrataDeck(size);
  const [beforeCard, ...restDeck] = deck;
  return {
    deck: restDeck,
    timeline: [beforeCard ?? null, null, null],
  };
}

function getStrataTypeClasses(type) {
  return STRATA_TYPE_STYLES[type] ?? DEFAULT_STRATA_TYPE_STYLE;
}

const MIN_STRATA_DECK_SIZE = 4;
const MAX_STRATA_DECK_SIZE = 40;
const STRATA_DECK_INCREMENT = 4;
const DEFAULT_STRATA_DECK_SIZE = 24;

function createInitialStrataCells() {
  return STRATA_GRID_LAYOUT.map((type, idx) =>
    type
      ? {
          id: `stratum-${idx}`,
          type,
          info: 0,
          corruption: 0,
        }
      : null,
  );
}

function calculateStrataTotals(cells) {
  return (cells ?? []).reduce((acc, cell) => {
    if (!cell) {
      return acc;
    }

    if (!acc[cell.type]) {
      acc[cell.type] = { info: 0, corruption: 0 };
    }

    acc[cell.type].info += cell.info ?? 0;
    acc[cell.type].corruption += cell.corruption ?? 0;
    return acc;
  }, {});
}

function wrapIndex(index) {
  const size = DIAL_LABELS.length;
  return (index + size) % size;
}

function CompassHand({ angle, colorClass, label }) {
  const handDesignation = label === 'Pulse' ? 'Pulse' : 'Control';

  return (
    <div className="absolute left-1/2 top-1/2">
      <div
        className="flex origin-bottom flex-col items-center"
        style={{ transform: `translate(-50%, -100%) rotate(${angle}deg)` }}
      >
        <div className={`relative flex h-24 w-2 items-center justify-center rounded-full ${colorClass}`}>
          <span className="pointer-events-none select-none text-[11px] font-semibold uppercase tracking-[0.32em] text-white drop-shadow [text-orientation:upright] [writing-mode:vertical-rl]">
            {handDesignation}
          </span>
        </div>
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

function StrataCard({ type, info = 0, corruption = 0, className = '' }) {
  const label = type ?? 'Stratum';

  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border-2 px-4 py-5 text-center shadow-lg shadow-black/20 ${getStrataTypeClasses(type)} ${className}`}
    >
      <span className="text-xl font-semibold uppercase tracking-[0.4em] text-white">{label}</span>
      <div className="mt-4 grid grid-cols-2 gap-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/70">
        <div className="space-y-1">
          <span className="block text-xs text-slate-100/80">Info</span>
          <span className="flex items-center justify-center rounded-full border border-white/40 bg-white/15 px-3 py-1 text-base text-white shadow-inner shadow-black/30">
            {info}
          </span>
        </div>
        <div className="space-y-1">
          <span className="block text-xs text-slate-100/80">Corruption</span>
          <span className="flex items-center justify-center rounded-full border border-white/30 bg-black/30 px-3 py-1 text-base text-white shadow-inner shadow-black/30">
            {corruption}
          </span>
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
  const initialStrataState = useMemo(
    () => createInitialStrataState(DEFAULT_STRATA_DECK_SIZE),
    [],
  );
  const [deck, setDeck] = useState(() => createEdictDeck());
  const [hand, setHand] = useState([]);
  const [discard, setDiscard] = useState([]);
  const [pulseIndex, setPulseIndex] = useState(0);
  const [reachIndex, setReachIndex] = useState(1);
  const [locked, setLocked] = useState(true);
  const [strataDeckSize, setStrataDeckSize] = useState(DEFAULT_STRATA_DECK_SIZE);
  const [strataDeckSizeInput, setStrataDeckSizeInput] = useState(String(DEFAULT_STRATA_DECK_SIZE));
  const [strataDeck, setStrataDeck] = useState(() => initialStrataState.deck);
  const [strataTimeline, setStrataTimeline] = useState(() => initialStrataState.timeline);
  const [strataDiscard, setStrataDiscard] = useState([]);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);
  const [strataCells, setStrataCells] = useState(createInitialStrataCells);
  const [infoTrack, setInfoTrack] = useState(0);
  const [corruptionTrack, setCorruptionTrack] = useState(0);
  const [gameStatus, setGameStatus] = useState('in-progress');
  const [phaseLog, setPhaseLog] = useState([]);
  const [queuedPreEdicts, setQueuedPreEdicts] = useState([]);
  const [queuedPostEdicts, setQueuedPostEdicts] = useState([]);

  const remaining = deck.length;
  const drawn = hand.length;
  const discarded = discard.length;
  const strataRemaining = strataDeck.length;
  const strataDiscarded = strataDiscard.length;

  const strataTotals = useMemo(
    () => calculateStrataTotals(strataCells),
    [strataCells],
  );

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
    removeFromQueues(cardName);
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

  const logEvent = (message) => {
    setPhaseLog((prev) => [message, ...prev].slice(0, 8));
  };

  const removeFromQueues = (cardName) => {
    setQueuedPreEdicts((prev) => prev.filter((name) => name !== cardName));
    setQueuedPostEdicts((prev) => prev.filter((name) => name !== cardName));
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
    const { deck: nextDeck, timeline } = createInitialStrataState(normalised);
    setStrataDeck(nextDeck);
    setStrataTimeline(timeline);
    setStrataDiscard([]);
    setStrataDeckSizeInput(String(normalised));
  };

  const resetStrata = () => {
    const { deck: nextDeck, timeline } = createInitialStrataState(strataDeckSize);
    setStrataDeck(nextDeck);
    setStrataTimeline(timeline);
    setStrataDiscard([]);
    setStrataDeckSizeInput(String(strataDeckSize));
    setStrataCells(createInitialStrataCells());
  };

  const adjustStrataTokens = (index, field, delta) => {
    if (!delta) return;
    setStrataCells((prev) =>
      prev.map((cell, idx) => {
        if (idx !== index || !cell) return cell;
        const nextValue = Math.max(0, cell[field] + delta);
        if (nextValue === cell[field]) return cell;
        logEvent(`${field === 'info' ? 'Info' : 'Corruption'} ${delta > 0 ? '+' : ''}${delta} on ${cell.type}`);
        return { ...cell, [field]: nextValue };
      }),
    );
  };

  const toggleEdictQueue = (card, phase) => {
    if (phase === 'pre') {
      setQueuedPreEdicts((prev) =>
        prev.includes(card.name)
          ? prev.filter((name) => name !== card.name)
          : [...prev, card.name],
      );
      setQueuedPostEdicts((prev) => prev.filter((name) => name !== card.name));
    } else {
      setQueuedPostEdicts((prev) =>
        prev.includes(card.name)
          ? prev.filter((name) => name !== card.name)
          : [...prev, card.name],
      );
      setQueuedPreEdicts((prev) => prev.filter((name) => name !== card.name));
    }
  };

  const findTargetStratumIndex = (direction, type) => {
    if (!type) return undefined;
    const group = COMPASS_TARGET_MAP[direction] ?? [];
    const directionalMatch = group.find(
      (idx) => strataCells[idx] && strataCells[idx].type === type,
    );
    if (directionalMatch !== undefined) {
      return directionalMatch;
    }
    const anyMatch = strataCells.findIndex((cell) => cell && cell.type === type);
    return anyMatch >= 0 ? anyMatch : undefined;
  };

  const advancePulseDeck = () => {
    const overflow = strataTimeline[2];
    let topCard = null;
    let rest = strataDeck;

    if (strataDeck.length) {
      [topCard, ...rest] = strataDeck;
      setStrataDeck(rest);
    }

    const nextTimeline = [topCard, strataTimeline[0], strataTimeline[1]];
    setStrataTimeline(nextTimeline);

    if (overflow) {
      setStrataDiscard((prevDiscard) => [overflow, ...prevDiscard]);
    }

    if (topCard) {
      logEvent(`Pulse advanced: ${topCard.type}`);
    }

    return nextTimeline[1] ?? null;
  };

  const applyPulseToStratum = (nowCard) => {
    if (!nowCard) return;
    const direction = DIAL_LABELS[pulseIndex];
    const targetIndex = findTargetStratumIndex(direction, nowCard.type);
    if (targetIndex === undefined) {
      logEvent(`No matching stratum for ${nowCard.type} during pulse.`);
      return;
    }

    setStrataCells((prev) =>
      prev.map((cell, idx) => {
        if (idx !== targetIndex || !cell) return cell;
        let info = cell.info;
        let corruption = cell.corruption;
        if (info > 0) {
          info -= 1;
          corruption += 1;
          logEvent(`${cell.type} flipped 1 Info into Corruption.`);
        }
        info += 1;
        logEvent(`${cell.type} gains +1 Info from Pulse.`);
        return { ...cell, info, corruption };
      }),
    );
  };

  const applyDecayPhase = () => {
    let conversions = 0;
    setStrataCells((prev) =>
      prev.map((cell) => {
        if (!cell) return cell;
        if (cell.info >= 2) {
          conversions += 1;
          return { ...cell, info: cell.info - 1, corruption: cell.corruption + 1 };
        }
        return cell;
      }),
    );
    if (conversions) {
      logEvent(`Decay converted ${conversions} Info into Corruption.`);
    }
  };

  const applyEscalationPhase = () => {
    let escalated = 0;
    setStrataCells((prev) =>
      prev.map((cell) => {
        if (!cell) return cell;
        if (cell.corruption >= 2) {
          escalated += 1;
          return { ...cell, corruption: cell.corruption - 1 };
        }
        return cell;
      }),
    );
    if (escalated) {
      setCorruptionTrack((prev) => prev + escalated);
      logEvent(`Escalation moved ${escalated} Corruption to the global track.`);
    }
  };

  const applyEdictEffect = (card, phase, context) => {
    const contextNowCard = context?.nowCard ?? strataTimeline[1];
    const contextDirection = context?.direction ?? DIAL_LABELS[pulseIndex];
    const targetIndexForContext = contextNowCard
      ? findTargetStratumIndex(contextDirection, contextNowCard.type)
      : undefined;
    const name = card.name;
    switch (name) {
      case 'Compass Shift':
        setPulseIndex((prev) => wrapIndex(prev + 1));
        logEvent('Compass Shift rotates the Pulse hand clockwise.');
        break;
      case 'Bend the Celestial Axis':
        setPulseIndex((prev) => wrapIndex(prev - 1));
        setReachIndex((prev) => wrapIndex(prev - 1));
        logEvent('Bend the Celestial Axis rotates both hands counterclockwise.');
        break;
      case 'Info Absorb':
        if (targetIndexForContext !== undefined && strataCells[targetIndexForContext]?.info > 0) {
          const targetType = strataCells[targetIndexForContext]?.type ?? 'Stratum';
          setStrataCells((prev) =>
            prev.map((cell, idx) => {
              if (idx !== targetIndexForContext || !cell) return cell;
              return { ...cell, info: cell.info - 1 };
            }),
          );
          setInfoTrack((prev) => prev + 1);
          logEvent(`Info Absorb moves 1 Info from ${targetType} to the track.`);
        } else {
          logEvent('Info Absorb failed: no Info on the Now stratum.');
        }
        break;
      case 'Purge Corruption':
        if (targetIndexForContext !== undefined && strataCells[targetIndexForContext]?.corruption > 0) {
          const targetType = strataCells[targetIndexForContext]?.type ?? 'Stratum';
          setStrataCells((prev) =>
            prev.map((cell, idx) => {
              if (idx !== targetIndexForContext || !cell) return cell;
              return { ...cell, corruption: Math.max(0, cell.corruption - 1) };
            }),
          );
          logEvent(`Purge Corruption removes 1 Corruption from ${targetType}.`);
        } else {
          logEvent('Purge Corruption failed: no Corruption on the targeted stratum.');
        }
        break;
      case 'Harvest Dreams':
        if (targetIndexForContext !== undefined && strataCells[targetIndexForContext]?.info > 0) {
          const qty = strataCells[targetIndexForContext]?.info ?? 0;
          const targetType = strataCells[targetIndexForContext]?.type ?? 'Stratum';
          setStrataCells((prev) =>
            prev.map((cell, idx) => {
              if (idx !== targetIndexForContext || !cell) return cell;
              return { ...cell, info: 0 };
            }),
          );
          setInfoTrack((prev) => prev + qty);
          logEvent(`Harvest Dreams banks ${qty} Info from ${targetType}.`);
        } else {
          logEvent('Harvest Dreams found no Info to harvest.');
        }
        break;
      default:
        logEvent(`[${name}] effect is not yet implemented; resolve manually.`);
    }
  };

  const executeQueuedEdicts = (phase, context = {}) => {
    const queue = phase === 'pre' ? queuedPreEdicts : queuedPostEdicts;
    if (!queue.length) return;
    const executionList = hand.filter((card) => queue.includes(card.name));
    if (!executionList.length) {
      if (phase === 'pre') setQueuedPreEdicts([]);
      else setQueuedPostEdicts([]);
      return;
    }

    executionList.forEach((card) => applyEdictEffect(card, phase, context));
    const names = new Set(queue);
    setHand((prev) => prev.filter((card) => !names.has(card.name)));
    setDiscard((prev) => [...executionList, ...prev]);
    executionList.forEach((card) => removeFromQueues(card.name));
    logEvent(`${phase === 'pre' ? 'Pre' : 'Post'}-phase edicts executed: ${executionList
      .map((card) => card.name)
      .join(', ')}.`);
  };

  const nowCard = strataTimeline[1];
  const nowDirection = DIAL_LABELS[pulseIndex];
  const nowTargetIndex = nowCard ? findTargetStratumIndex(nowDirection, nowCard.type) : undefined;
  const canBankInfo =
    nowTargetIndex !== undefined &&
    strataCells[nowTargetIndex] &&
    strataCells[nowTargetIndex].info > 0;

  const bankInfoFromNow = () => {
    if (!canBankInfo || nowTargetIndex === undefined) {
      logEvent('No Info available to bank from the Now stratum.');
      return;
    }

    const targetType = strataCells[nowTargetIndex]?.type ?? 'Stratum';
    setStrataCells((prev) =>
      prev.map((cell, idx) => {
        if (idx !== nowTargetIndex || !cell) return cell;
        return { ...cell, info: Math.max(0, cell.info - 1) };
      }),
    );
    setInfoTrack((prev) => prev + 1);
    logEvent(`Banked 1 Info from ${targetType} to the track.`);
  };

  const rotateCompassAfterRound = () => {
    if (locked) {
      setPulseIndex((prev) => wrapIndex(prev + 1));
      setReachIndex((prev) => wrapIndex(prev + 1));
    } else {
      setPulseIndex((prev) => wrapIndex(prev + 1));
    }
  };

  const resolveRound = () => {
    if (gameStatus !== 'in-progress') return;
    setDiscardModalOpen(false);
    const preContext = { nowCard: strataTimeline[0], direction: DIAL_LABELS[pulseIndex] };
    executeQueuedEdicts('pre', preContext);
    const nowCard = advancePulseDeck();
    applyPulseToStratum(nowCard);
    const postContext = { nowCard, direction: DIAL_LABELS[pulseIndex] };
    executeQueuedEdicts('post', postContext);
    applyDecayPhase();
    applyEscalationPhase();
    rotateCompassAfterRound();
    logEvent('Round resolved.');
  };

  const drawStrataCard = () => {
    advancePulseDeck();
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

  useEffect(() => {
    if (gameStatus !== 'in-progress') {
      return;
    }
    if (infoTrack >= 10) {
      setGameStatus('victory');
      logEvent('Victory! Information track reached 10.');
    } else if (corruptionTrack >= 10) {
      setGameStatus('defeat');
      logEvent('Defeat! Corruption track reached 10.');
    }
  }, [infoTrack, corruptionTrack, gameStatus]);

  return (
    <div className="min-h-screen bg-slate-950 px-3 py-8 text-slate-100 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 sm:gap-12">
        <header className="space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Pulsar</h1>
          <p className="mx-auto max-w-2xl text-base text-slate-300 sm:text-lg">
            Shuffle the dream edicts, draw them into your hand, and let the compass guide
            your next move.
          </p>
        </header>

        <section className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-900/30 sm:p-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] xl:items-start">
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6">
              <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Strata Control Grid</h2>
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Pairs Aligned</span>
              </div>
              <div className="mt-4">
                <FracturedCircleBoard
                  className="w-full"
                  cells={strataCells}
                  onAdjustTokens={adjustStrataTokens}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 space-y-5 p-4 sm:space-y-6 sm:p-6">
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 sm:justify-start">
                <span>Deck Size: {strataDeckSize}</span>
                <span>Remaining: {strataRemaining}</span>
                <span>Discarded: {strataDiscarded}</span>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
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
                <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
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
              <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Info Track</span>
                  <div className="flex items-center gap-3">
                    <span aria-hidden className="text-lg font-semibold text-slate-500">−</span>
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-white text-base font-bold text-slate-900 shadow-inner shadow-black/20">
                      {infoTrack}
                    </span>
                    <span aria-hidden className="text-lg font-semibold text-slate-500">+</span>
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.3em] text-slate-500">of 10</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Corruption Track</span>
                  <div className="flex items-center gap-3">
                    <span aria-hidden className="text-lg font-semibold text-slate-500">−</span>
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-base font-bold text-white shadow-inner shadow-black/40">
                      {corruptionTrack}
                    </span>
                    <span aria-hidden className="text-lg font-semibold text-slate-500">+</span>
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.3em] text-slate-500">of 10</span>
                </div>
                <div className="flex flex-col items-stretch gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:gap-4">
                  <button
                    type="button"
                    onClick={resolveRound}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow transition hover:bg-emerald-400"
                  >
                    Resolve Round
                  </button>
                  <button
                    type="button"
                    onClick={bankInfoFromNow}
                    disabled={!canBankInfo}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow transition ${
                      canBankInfo
                        ? 'bg-slate-200 text-slate-900 hover:bg-white'
                        : 'cursor-not-allowed bg-white/10 text-white/40'
                    }`}
                  >
                    Bank Info (Now)
                  </button>
                  <span className="text-center text-xs uppercase tracking-[0.3em] text-slate-400 sm:ml-auto sm:text-right">
                    Status: {gameStatus === 'in-progress' ? 'In Progress' : gameStatus === 'victory' ? 'Victory' : 'Defeat'}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col gap-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
                  <span>Timeline</span>
                  <span>{strataBoard.some((slot) => slot.card) ? 'Live spread' : 'Empty'}</span>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {strataBoard.map(({ key, label, card }) => {
                    const totals = card ? strataTotals[card.type] ?? { info: 0, corruption: 0 } : null;
                    return (
                      <div key={key} className="rounded-3xl border border-slate-800 bg-slate-900/50 p-4">
                        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                          <span>{label}</span>
                          <span>{card ? 'Revealed' : 'Empty'}</span>
                        </div>
                        {card ? (
                          <StrataCard
                            type={card.type}
                            info={totals?.info ?? 0}
                            corruption={totals?.corruption ?? 0}
                            className="mt-4 h-32"
                          />
                        ) : (
                          <div className="mt-4 flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-700 text-sm text-slate-500">
                            Awaiting card
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Pulse Progression</h2>
              <p className="mt-2 text-xs text-slate-400">Set your compass, lock the hands, and step the pulse through the shattered dial.</p>
              <div className="mt-6 flex justify-center sm:mt-8">
                <div className="relative h-56 w-56 sm:h-64 sm:w-64 lg:h-72 lg:w-72">
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
                  <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-start">
                    <button type="button" onClick={() => nudge('pulse', -1)} className="rounded-full bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700">◀</button>
                    <span className="flex-1 text-center text-sm font-semibold text-slate-200">Pointing to {DIAL_LABELS[pulseIndex]}</span>
                    <button type="button" onClick={() => nudge('pulse', 1)} className="rounded-full bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700">▶</button>
                  </div>
                </div>
                <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <h3 className="text-sm font-semibold text-white">Reach Hand</h3>
                  <p className="text-xs text-slate-400">{locked ? 'Hands move together while locked.' : 'Adjust the Reach hand independently.'}</p>
                  <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-start">
                    <button type="button" onClick={() => nudge('reach', -1)} className="rounded-full bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700">◀</button>
                    <span className="flex-1 text-center text-sm font-semibold text-slate-200">Pointing to {DIAL_LABELS[reachIndex]}</span>
                    <button type="button" onClick={() => nudge('reach', 1)} className="rounded-full bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700">▶</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6">
              <div className="flex flex-col gap-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
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

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-900/30 sm:p-6">
          <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Round Log</h2>
            <button
              type="button"
              onClick={() => setPhaseLog([])}
              className="rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-slate-200 hover:border-white/40 hover:bg-white/10"
            >
              Clear
            </button>
          </div>
          {phaseLog.length ? (
            <ul className="mt-4 space-y-2 text-xs text-slate-300">
              {phaseLog.map((entry, idx) => (
                <li key={`log-${idx}`} className="rounded-lg border border-slate-800/60 bg-slate-900/70 px-3 py-2">
                  {entry}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-center text-xs text-slate-500 sm:text-left">No events logged yet.</p>
          )}
        </section>
        <section className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-900/30 sm:p-6 lg:p-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:items-start">
          <div className="space-y-5 sm:space-y-6">
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 sm:justify-start">
              <span>Total Cards: {TOTAL_PULSAR_EDICTS}</span>
              <span>In Hand: {drawn}</span>
              <span>Discarded: {discarded}</span>
            </div>
            <p className="mx-auto max-w-md text-center text-sm text-slate-400 sm:mx-0 sm:text-left">
              The deck is shuffled face down. Draw edicts into your hand, send them to discard, or reclaim them as your strategy shifts.
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
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

          <div className="space-y-8 sm:space-y-10">
            <div className="space-y-4 sm:space-y-5">
              <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Hand</h2>
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  {drawn ? `${drawn} card${drawn === 1 ? '' : 's'}` : 'Empty'}
                </span>
              </div>
              {hand.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {hand.map((card) => {
                    const isQueuedPre = queuedPreEdicts.includes(card.name);
                    const isQueuedPost = queuedPostEdicts.includes(card.name);
                    return (
                      <EdictCard
                        key={card.name}
                        card={card}
                        actionSlot={
                          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                            {card.timing === 'pre' ? (
                              <button
                                type="button"
                                onClick={() => toggleEdictQueue(card, 'pre')}
                                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                                  isQueuedPre
                                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/50'
                                    : 'bg-transparent text-white/80 border border-white/20 hover:bg-white/10'
                                }`}
                              >
                                {isQueuedPre ? 'Queued →P' : 'Queue →P'}
                              </button>
                            ) : card.timing === 'post' ? (
                              <button
                                type="button"
                                onClick={() => toggleEdictQueue(card, 'post')}
                                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                                  isQueuedPost
                                    ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/50'
                                    : 'bg-transparent text-white/80 border border-white/20 hover:bg-white/10'
                                }`}
                              >
                                {isQueuedPost ? 'Queued P→' : 'Queue P→'}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => handleDiscard(card.name)}
                              className="rounded-full bg-transparent px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:bg-white/10 hover:text-white"
                            >
                              Send to Discard
                            </button>
                          </div>
                        }
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-sm text-slate-500 sm:text-left">Draw cards from the deck to fill your hand. Each edict will appear here ready for use.</p>
              )}
            </div>

            <div className="space-y-4 sm:space-y-5">
              <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
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
                <p className="text-center text-sm text-slate-500 sm:text-left">Discarded edicts will gather here. Reclaim any card to immediately return it to your hand.</p>
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
          <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900/95 p-4 text-slate-100 shadow-2xl shadow-black/60 sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
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
                {strataDiscard.map((card) => {
                  const totals = strataTotals[card.type] ?? { info: 0, corruption: 0 };
                  return (
                    <StrataCard
                      key={card.id}
                      type={card.type}
                      info={totals.info}
                      corruption={totals.corruption}
                      className="h-32"
                    />
                  );
                })}
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
