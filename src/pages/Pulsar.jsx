import { useEffect, useMemo, useState } from 'react';
import {
  MAX_BANK,
  VICTORY_TARGET,
  CORRUPTION_THRESHOLD,
  initializeGame,
  resolveReflex,
  resolvePulse,
  resolveAftershock,
  resolveDecay,
  resolveEscalation,
  reloadRound,
  cloneState,
  checkVictoryOrDefeat,
  currentNowStratum,
  removeInfo,
  adjustBank,
  logEvent,
} from '../../pulsar-sim/src/game.ts';
import {
  createEgoStartingHand,
  createEdictDeck,
  drawFromDeck,
} from '../lib/edictLibrary';

let edictInstanceCounter = 0;

const instantiateEdict = (edict) => ({
  ...edict,
  instanceId: `edict-${edictInstanceCounter += 1}`,
});

const createSimulationSeed = () => {
  const egoHandDefinitions = createEgoStartingHand();
  const hand = egoHandDefinitions.map((edict) => instantiateEdict(edict));

  const fullDeck = createEdictDeck();
  const { drawn: initialMarketDefs, remaining } = drawFromDeck(fullDeck, 4);
  const market = initialMarketDefs.map((card) => instantiateEdict(card));

  const state = initializeGame({
    initialPlayerEdicts: [],
  });
  logEvent(state, 'Ego starting edicts loaded into hand.');

  return {
    state,
    deck: remaining,
    market,
    hand,
  };
};

const ROUND_PHASES = [
  {
    key: 'center',
    label: 'Center Yourself',
    description: 'Choose which edicts you will execute this round. Selected edicts will lock in when the reflex phase begins.',
    action: null,
  },
  {
    key: 'reflex',
    label: 'Reflex (→P Edicts)',
    description: 'Spend banked info to trigger reflex edicts before the pulse fires. These often cleanse or prepare the board.',
    action: (state) => resolveReflex(state),
  },
  {
    key: 'pulse',
    label: 'Pulse',
    description: 'The pulse strikes the stratum indicated by the Compass. Place 1 info; if it was already occupied, flip one of those insights into corruption first.',
    action: (state) => resolvePulse(state),
  },
  {
    key: 'aftershock',
    label: 'Aftershock (P→ Edicts)',
    description: 'Spend info after the pulse to manipulate the aftermath with post-pulse edicts.',
    action: (state) => resolveAftershock(state),
  },
  {
    key: 'decay',
    label: 'Decay',
    description: 'Every stratum with too much info destabilises — flip 1 info into corruption.',
    action: (state) => resolveDecay(state),
  },
  {
    key: 'escalation',
    label: 'Escalation',
    description: 'Overloaded corruption spills into the global corruption track.',
    action: (state) => resolveEscalation(state),
  },
  {
    key: 'research',
    label: 'Research',
    description: 'Optionally spend 1 banked info to draft a fresh edict and expand your toolkit.',
    action: null,
  },
  {
    key: 'reload',
    label: 'Reload',
    description: 'Advance the pulse queue, rotate the compass, and prepare for the next round.',
    action: (state) => reloadRound(state),
  },
];

const statusColours = {
  'in-progress': 'text-slate-300',
  victory: 'text-emerald-300',
  defeat: 'text-rose-300',
};

const FLOW_STEPS = [
  { key: 'center', label: 'Center Yourself' },
  { key: 'reflex', label: 'Reflex (→P)' },
  { key: 'pulse', label: 'Pulse' },
  { key: 'aftershock', label: 'Aftershock (P→)' },
  { key: 'decay', label: 'Decay' },
  { key: 'escalation', label: 'Escalation' },
  { key: 'research', label: 'Research' },
  { key: 'reload', label: 'Reload' },
];

const COMPASS_POINTS = ['Highest', 'Even', 'Lowest', 'Odd'];

const STRATA_TYPE_STYLES = {
  Mist: 'border-violet-400/60 bg-gradient-to-br from-violet-900/70 to-violet-600/30 text-violet-100',
  Echo: 'border-rose-400/60 bg-gradient-to-br from-rose-900/70 to-rose-600/30 text-rose-100',
  Bloom: 'border-emerald-400/60 bg-gradient-to-br from-emerald-900/70 to-emerald-600/30 text-emerald-100',
  Aether: 'border-sky-400/60 bg-gradient-to-br from-sky-900/70 to-sky-600/30 text-sky-100',
};

const getStrataClasses = (type) => STRATA_TYPE_STYLES[type] ?? 'border-slate-700 bg-slate-900 text-slate-200';

const directionToAngle = (direction) => {
  const index = COMPASS_POINTS.indexOf(direction);
  if (index === -1) return 0;
  return index * 90;
};

function CompassDiagram({ pulse, control, linked }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-40 w-40 sm:h-44 sm:w-44">
        <div className="absolute inset-0 rounded-full border border-slate-700 bg-slate-950 shadow-inner shadow-black/40" />
        <div className="absolute inset-4 rounded-full border border-slate-800" />
        <span className="absolute left-1/2 top-2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Highest</span>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Even</span>
        <span className="absolute left-1/2 bottom-2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Lowest</span>
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Odd</span>

        <CompassHand angle={directionToAngle(pulse)} colour="bg-sky-400" label="Pulse" />
        <CompassHand angle={directionToAngle(control)} colour="bg-emerald-400" label="Control" />

        <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-600 bg-slate-900" />
      </div>
      <span className="text-xs text-slate-400">Hands are currently {linked ? 'linked' : 'independent'}.</span>
    </div>
  );
}

function CompassHand({ angle, colour, label }) {
  return (
    <div className="absolute left-1/2 top-1/2">
      <div
        className="flex origin-bottom flex-col items-center"
        style={{ transform: `translate(-50%, -100%) rotate(${angle}deg)` }}
      >
        <div className={`relative flex h-8 w-[6px] items-center justify-center rounded-full ${colour}`}>
          <span
            className="absolute -top-3 text-sm"
            role="img"
            aria-label={label}
          >
          {label === 'Pulse' ? '💫' : '✋'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Pulsar() {
  const seed = useMemo(() => createSimulationSeed(), []);
  const [gameState, setGameState] = useState(seed.state);
  const [edictDeck, setEdictDeck] = useState(seed.deck);
  const [market, setMarket] = useState(seed.market);
  const [hand, setHand] = useState(seed.hand);
  const [discardPile, setDiscardPile] = useState([]);
  const [selectedEdicts, setSelectedEdicts] = useState({ center: [], reflex: [], aftershock: [] });
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [selectionLocked, setSelectionLocked] = useState(false);
  const [pendingModals, setPendingModals] = useState([]);
  const [activeModal, setActiveModal] = useState(null);

  const currentPhase = ROUND_PHASES[phaseIndex];
  const currentSelectionIds =
    currentPhase.key === 'reflex' || currentPhase.key === 'aftershock'
      ? selectedEdicts.center.filter((id) => {
          const card = hand.find((item) => item.instanceId === id);
          if (!card) return false;
          return currentPhase.key === 'reflex' ? card.timing === '→P' : card.timing === 'P→';
        })
      : selectedEdicts[currentPhase.key] ?? [];

  useEffect(() => {
    if (!activeModal && pendingModals.length) {
      setActiveModal(pendingModals[0]);
      setPendingModals((prev) => prev.slice(1));
    }
  }, [pendingModals, activeModal]);

  const dismissModal = () => {
    setActiveModal(null);
  };

  const advancePhase = () => {
    const phase = ROUND_PHASES[phaseIndex];
    if (gameState.status !== 'in-progress') {
      return;
    }
    if (!phase.action) {
      if (phase.key === 'center') {
        logEvent(gameState, 'Centering complete. Reflex phase ready.');
        setPhaseIndex((prev) => (prev + 1) % ROUND_PHASES.length);
      }
      return;
    }

    const selectedIds = currentSelectionIds;
    const selectedCards = hand.filter((card) => selectedIds.includes(card.instanceId));

    const nextState = cloneState(gameState);
    const previousVictory = gameState.player.victoryTrack;

    if (phase.key === 'reflex' && !selectionLocked) {
      setSelectionLocked(true);
    }

    const executingCards = selectedCards.map(({ instanceId, ...rest }) => ({ ...rest }));
    nextState.player.edicts = executingCards;

    phase.action(nextState);
    setPendingModals((prev) => [...prev, ...selectedCards]);
    if (phase.key === 'reload') {
      nextState.round += 1;
    }
    nextState.player.edicts = [];
    nextState.status = checkVictoryOrDefeat(nextState);

    let updatedHand = hand.filter((card) => !selectedIds.includes(card.instanceId));
    let updatedDiscard = [...discardPile, ...selectedCards];

    const victoryDelta = nextState.player.victoryTrack - previousVictory;
    for (let i = 0; i < victoryDelta && updatedDiscard.length; i += 1) {
      const reclaimed = updatedDiscard.pop();
      updatedHand = [...updatedHand, reclaimed];
      logEvent(nextState, `Reclaimed ${reclaimed.name} from discard after ascension.`);
    }

    setGameState(nextState);
    setHand(updatedHand);
    setDiscardPile(updatedDiscard);
    setSelectedEdicts((prev) => ({
      ...prev,
      [phase.key]: [],
      ...(phase.key === 'reflex' || phase.key === 'aftershock'
        ? { center: prev.center.filter((id) => !selectedIds.includes(id)) }
        : {}),
    }));

    if (phase.key === 'reload') {
      setSelectedEdicts({ center: [], reflex: [], aftershock: [] });
      setSelectionLocked(false);
    }

    if (nextState.status === 'in-progress') {
      setPhaseIndex((prev) => (prev + 1) % ROUND_PHASES.length);
    }
  };

  const handleSkipResearch = () => {
    if (gameState.status !== 'in-progress' || currentPhase.key !== 'research') {
      return;
    }
    const nextState = cloneState(gameState);
    logEvent(nextState, 'Research skipped.');
    nextState.status = checkVictoryOrDefeat(nextState);
    setGameState(nextState);
    if (nextState.status === 'in-progress') {
      setPhaseIndex((prev) => (prev + 1) % ROUND_PHASES.length);
    }
  };

  const handleDraftMarketCard = (index) => {
    if (gameState.status !== 'in-progress' || currentPhase.key !== 'research') {
      return;
    }
    if (gameState.player.bank <= 0) {
      const nextState = cloneState(gameState);
      logEvent(nextState, 'Research requires banked info.');
      setGameState(nextState);
      return;
    }

    const chosen = market[index];
    if (!chosen) {
      return;
    }

    const nextState = cloneState(gameState);
    adjustBank(nextState, -1);
    logEvent(nextState, `Drafted edict “${chosen.name}”.`);
    nextState.status = checkVictoryOrDefeat(nextState);
    setGameState(nextState);

    const updatedMarket = market.filter((_, idx) => idx !== index);
    setHand((prev) => [...prev, chosen]);
    let deckPool = [...edictDeck];
    if (deckPool.length) {
      const { drawn, remaining } = drawFromDeck(deckPool, 1);
      deckPool = remaining;
      updatedMarket.push(...drawn.map((card) => instantiateEdict(card)));
    }
    setMarket(updatedMarket);
    setEdictDeck(deckPool);

    if (nextState.status === 'in-progress') {
      setPhaseIndex((prev) => (prev + 1) % ROUND_PHASES.length);
    }
  };

  const handleBankInfo = () => {
    const nextState = cloneState(gameState);
    const stratum = currentNowStratum(nextState);
    if (!stratum) {
      logEvent(nextState, 'Bank: No active stratum to bank from.');
      setGameState(nextState);
      return;
    }
    if (stratum.infoTokens <= 0) {
      logEvent(nextState, `Bank: ${stratum.type} #${stratum.id} has no info tokens.`);
      setGameState(nextState);
      return;
    }
    removeInfo(stratum, 1);
    adjustBank(nextState, 1);
    logEvent(nextState, `Bank: Stored 1 info from ${stratum.type} #${stratum.id}.`);
    nextState.status = checkVictoryOrDefeat(nextState);
    setGameState(nextState);
  };

  const handleToggleLink = () => {
    const nextState = cloneState(gameState);
    nextState.compass.linked = !nextState.compass.linked;
    logEvent(
      nextState,
      `Compass ${nextState.compass.linked ? 'linked' : 'unlinked'} — hands ${nextState.compass.linked ? 'move together' : 'can diverge'}.`,
    );
    setGameState(nextState);
  };

  const toggleEdictSelection = (card) => {
    if (selectionLocked || currentPhase.key !== 'center' || gameState.status !== 'in-progress') {
      return;
    }
    if (gameState.player.bank < card.threshold) {
      return;
    }
    setSelectedEdicts((prev) => {
      const existing = new Set(prev.center ?? []);
      if (existing.has(card.instanceId)) {
        existing.delete(card.instanceId);
      } else {
        existing.add(card.instanceId);
      }
      return { ...prev, center: Array.from(existing) };
    });
  };

  const handleReset = () => {
    const fresh = createSimulationSeed();
    setGameState(fresh.state);
    setEdictDeck(fresh.deck);
    setMarket(fresh.market);
    setHand(fresh.hand);
    setDiscardPile([]);
    setSelectedEdicts({ center: [], reflex: [], aftershock: [] });
    setPhaseIndex(0);
    setSelectionLocked(false);
  };

  const edicts = hand;

  return (
    <div className="min-h-screen bg-slate-950 px-3 py-8 text-slate-100 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Pulsar Simulation</h1>
          <p className="mx-auto max-w-3xl text-sm text-slate-300 sm:text-base">
            Step through each phase of the Pulsar round structure. Follow the prompts, fire edicts at the right moment,
            and shepherd information through the strata before corruption overwhelms the system.
          </p>
        </header>

        <section className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-slate-900/40 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Play Loop</span>
              <div className="mt-3 flex flex-col gap-3">
                <div className="relative mx-auto flex w-full max-w-xs flex-col gap-3 pl-6">
                  <div className="absolute left-[12px] top-1 bottom-1 w-[2px] rounded-full bg-slate-800" />
                  {FLOW_STEPS.map((step, index) => {
                    const stepIndex = index;
                    const isActive = currentPhase.key === step.key;
                    const isPast = stepIndex < phaseIndex;
                    const phaseMeta = ROUND_PHASES.find((phase) => phase.key === step.key);
                    const nextPhaseLabel = ROUND_PHASES[(phaseIndex + 1) % ROUND_PHASES.length]?.label ?? 'Next Phase';
                    const baseClass = isActive
                      ? 'border-emerald-400/70 bg-emerald-500/10 text-emerald-200 shadow shadow-emerald-500/30'
                      : isPast
                        ? 'border-slate-700 bg-slate-900 text-slate-200'
                        : 'border-slate-800 bg-slate-900/60 text-slate-500';

                    return (
                      <div key={step.key} className="relative flex items-start gap-3">
                        <span className={`relative z-10 mt-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${isActive ? 'border-emerald-400 bg-emerald-500/30 text-emerald-100' : isPast ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-slate-700 bg-slate-900 text-slate-400'}`}>●</span>
                        <div className={`flex-1 rounded-lg border px-3 py-2 transition ${baseClass}`}>
                          <span className="block text-[11px] font-semibold uppercase tracking-[0.3em] text-left sm:text-[10px]">
                            {step.label}
                          </span>
                          {isActive ? (
                            <div className="mt-3 space-y-3 text-left">
                              {phaseMeta?.description ? (
                                <p className="text-sm text-slate-300">{phaseMeta.description}</p>
                              ) : null}
                              <div className={`text-sm font-semibold ${statusColours[gameState.status]}`}>
                                Status: {gameState.status.replace('-', ' ')}
                              </div>
                              <div className="flex flex-wrap gap-3">
                                {step.key === 'research' ? (
                                  <button
                                    type="button"
                                    onClick={handleSkipResearch}
                                    disabled={gameState.status !== 'in-progress'}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
                                  >
                                    Skip Research
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={advancePhase}
                                    disabled={gameState.status !== 'in-progress'}
                                    className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow shadow-emerald-500/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                                  >
                                    Move to {nextPhaseLabel}
                                  </button>
                                )}
                              </div>
                              {step.key === 'research' ? (
                                <p className="text-xs text-slate-400">
                                  Choose an edict from the marketplace to spend 1 banked info and add it to your hand, or skip to conserve resources.
                                </p>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/5"
                  >
                    Reset Game
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Player State</span>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Banked Info</span>
                    <span className="font-semibold text-white">{gameState.player.bank} / {MAX_BANK}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Victory Track</span>
                    <span className="font-semibold text-white">{gameState.player.victoryTrack} / {VICTORY_TARGET}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Corruption Track</span>
                    <span className="font-semibold text-white">{gameState.corruptionTrack} / {CORRUPTION_THRESHOLD}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Round</span>
                    <span className="font-semibold text-white">{gameState.round + 1}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Compass</span>
                <div className="mt-4 flex justify-center text-sm text-slate-300">
                  <CompassDiagram
                    pulse={gameState.compass.pulseHand}
                    control={gameState.compass.controlHand}
                    linked={gameState.compass.linked}
                  />
                </div>
              </div>
            </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Pulse Queue</span>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                  { key: 'after', label: 'Past', detail: gameState.queue.after },
                  { key: 'now', label: 'Present', detail: gameState.queue.now },
                  { key: 'before', label: 'Future', detail: gameState.queue.before },
                ].map(({ key, label, detail }) => (
                  <div key={key} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-center text-sm">
                    <div className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{label}</div>
                    <div
                      className={`mt-3 flex h-16 items-center justify-center rounded-lg border text-sm font-semibold transition ${
                        detail
                          ? `${getStrataClasses(detail.type)} shadow-inner shadow-black/20`
                          : 'border-dashed border-slate-700 bg-slate-900/40 text-slate-200'
                      }`}
                    >
                      {detail ? detail.type : 'Empty'}
                    </div>
                  </div>
                ))}
                </div>
              </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Strata Overview</span>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                {gameState.strata.map((stratum) => (
                  <div
                    key={stratum.id}
                    className={`rounded-xl border p-3 shadow-inner shadow-black/20 ${getStrataClasses(stratum.type)}`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.35em]">
                      <span>#{stratum.id}</span>
                      <span>{stratum.type}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Info</span>
                        <span className="font-semibold">{stratum.infoTokens}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Corruption</span>
                        <span className="font-semibold">{stratum.corruptionTokens}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Edict Portfolio</span>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">Hand</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Reflex edicts (→P) fire before the pulse, Aftershock edicts (P→) trigger after. Cards highlighted in emerald are ready this phase.
                  </p>
                  <div className="mt-3 space-y-3 text-sm">
                    {edicts.length ? (
                      edicts.map((card) => {
                        const phaseKey = currentPhase.key;
                        const isCenterPhase = phaseKey === 'center';
                        const isReflexPhase = phaseKey === 'reflex';
                        const isAftershockPhase = phaseKey === 'aftershock';
                        const matchesPhase = isCenterPhase
                          ? true
                          : (isReflexPhase && card.timing === '→P') || (isAftershockPhase && card.timing === 'P→');
                        const isSelected = currentSelectionIds.includes(card.instanceId);
                        const canSelect = isCenterPhase
                          ? !selectionLocked && gameState.status === 'in-progress' && gameState.player.bank >= card.threshold
                          : false;
                        const isReady = matchesPhase && gameState.player.bank >= card.threshold;
                        return (
                          <button
                            type="button"
                            key={card.instanceId}
                            onClick={() => toggleEdictSelection(card)}
                            disabled={!canSelect}
                            aria-pressed={isSelected}
                            className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                              isSelected
                                ? 'border-emerald-400/70 bg-emerald-500/20 shadow-inner shadow-emerald-500/20'
                                : 'border-slate-800 bg-slate-900/80 hover:border-slate-700/80 hover:bg-slate-900'
                            } ${!canSelect ? 'cursor-not-allowed opacity-70' : ''}`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-slate-200">
                              <div className="flex flex-col">
                                <span className="font-semibold text-white">{card.name}</span>
                                <span className="text-[10px] uppercase tracking-[0.35em] text-slate-500">{card.category}</span>
                              </div>
                              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                                Cost ≤ {card.threshold} | {card.timing} | Target {card.targeting}
                              </span>
                            </div>
                            {'effectText' in card ? (
                              <p className="mt-2 text-xs text-slate-400">{card.effectText}</p>
                            ) : null}
                            {phaseKey === 'center' ? null : matchesPhase ? (
                              <p className="mt-2 text-[11px] text-slate-400">
                                {canSelect ? (isSelected ? 'Queued for this phase.' : 'Click to queue this edict for the current phase.') : 'Requires sufficient banked info during the matching phase.'}
                              </p>
                            ) : (
                              <p className="mt-2 text-[11px] text-slate-500">Activates during the {card.timing === '→P' ? 'Reflex phase' : 'Aftershock phase'}.</p>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-slate-400">No edicts drafted yet. Use Research to discover more tools.</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Marketplace</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Spend 1 banked info during the Research phase to add one of these edicts to your hand.
                  </p>
                  <div className="mt-3 space-y-3 text-sm">
                    {market.length ? (
                      market.map((card, index) => {
                        const canDraft = gameState.status === 'in-progress' && currentPhase.key === 'research' && gameState.player.bank > 0;
                        return (
                          <button
                            type="button"
                            key={`${card.name}-${index}`}
                            onClick={() => canDraft && handleDraftMarketCard(index)}
                            className={`w-full text-left rounded-xl border px-3 py-3 transition ${
                              canDraft
                                ? 'border-amber-300/70 bg-amber-500/10 hover:border-amber-200 hover:bg-amber-400/10'
                                : 'border-slate-800 bg-slate-900/80 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-slate-200">
                              <span className="font-semibold text-white">{card.name}</span>
                              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                                Cost ≤ {card.threshold} | {card.timing} | Target {card.targeting}
                              </span>
                            </div>
                            {'effectText' in card ? (
                              <p className="mt-2 text-xs text-slate-400">{card.effectText}</p>
                            ) : null}
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-slate-400">Marketplace exhausted.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Discard Pile</span>
              {discardPile.length ? (
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  {discardPile.map((card) => (
                    <li key={card.instanceId} className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{card.name}</span>
                        <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{card.category}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-xs text-slate-400">No edicts in discard. Played edicts will rest here until reclaimed by ascension.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Event Log</span>
              {gameState.logs.length ? (
                <ul className="mt-4 flex max-h-64 flex-col gap-2 overflow-auto text-xs text-slate-300">
                  {gameState.logs.slice().reverse().slice(0, 25).map((entry, index) => (
                    <li key={`${entry}-${index}`} className="rounded-lg border border-slate-800/60 bg-slate-950/60 px-3 py-2">
                      {entry}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-xs text-slate-400">Take actions to populate the event log.</p>
              )}
            </div>
          </div>
        </section>
      </div>

      {activeModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900/95 p-5 text-slate-100 shadow-2xl shadow-black/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{activeModal.name}</h3>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{activeModal.category}</p>
              </div>
              <button
                type="button"
                onClick={dismissModal}
                className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-white/30 hover:bg-white/10"
              >
                Close
              </button>
            </div>
            {'effectText' in activeModal ? (
              <p className="mt-4 text-sm text-slate-300">{activeModal.effectText}</p>
            ) : (
              <p className="mt-4 text-sm text-slate-300">The edict resolves according to its scripted effect.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
