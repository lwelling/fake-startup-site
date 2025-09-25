/*
 * Pulsar Simulation Engine
 * ------------------------
 * Core TypeScript business logic for the Pulsar board game prototype.
 * This module provides data models and phase resolution helpers that mirror
 * the round structure used by the React UI in /pulsar.
 */

export type StratumType = 'Mist' | 'Echo' | 'Bloom' | 'Aether';
export type DialDirection = 'Highest' | 'Even' | 'Lowest' | 'Odd';
export type EdictTiming = '→P' | 'P→';
export type EdictTargeting = 'Yesterday' | 'Now' | 'Will';

export interface Stratum {
  id: number;
  type: StratumType;
  infoTokens: number;
  corruptionTokens: number;
}

export interface Compass {
  pulseHand: DialDirection;
  controlHand: DialDirection;
  linked: boolean;
}

export interface PulseCard {
  id: number;
  type: StratumType;
}

export interface PulseQueue {
  before: PulseCard | null;
  now: PulseCard | null;
  after: PulseCard | null;
  deck: PulseCard[];
  discard: PulseCard[];
}

export interface Player {
  bank: number;
  victoryTrack: number;
  edicts: Edict[];
}

export interface EdictContext {
  state: GameState;
  targetStratum: Stratum | null;
  targetCard: PulseCard | null;
}

export interface Edict {
  name: string;
  threshold: number; // 0 – 5
  timing: EdictTiming;
  targeting: EdictTargeting;
  effect: (context: EdictContext) => void;
  category?: string;
  description?: string;
}

export interface OngoingEffects {
  preventInfoLoss: number;
  preventEscalation: number;
  afterLockedRounds: number;
  stratumTypeLocks: Record<number, number>;
  controlTargetsBefore: boolean;
  reverseCompassRotation: boolean;
  doublePulse: number;
  nowActsAsAllTypes: boolean;
  forceLinkedRounds: number;
  cancelNextPulse: boolean;
  tempTypeOverrides: Record<number, { original: StratumType; rounds: number }>;
}

export interface GameState {
  round: number;
  strata: Stratum[];
  compass: Compass;
  queue: PulseQueue;
  player: Player;
  corruptionTrack: number;
  logs: string[];
  status: 'in-progress' | 'victory' | 'defeat';
  effects: OngoingEffects;
}

export interface InitializeGameOptions {
  deckSize?: number;
  initialCompass?: Partial<Compass>;
  initialPlayerEdicts?: Edict[];
  linked?: boolean;
}

export interface RoundOptions {
  research?: boolean;
  draftEdict?: () => Edict | null;
}

const STRATUM_LAYOUT: StratumType[] = [
  'Mist',
  'Echo',
  'Bloom',
  'Aether',
  'Echo',
  'Mist',
  'Bloom',
  'Aether',
];

const COMPASS_TARGET_MAP: Record<DialDirection, number[]> = {
  Highest: [0, 1],
  Even: [1, 3],
  Lowest: [4, 5],
  Odd: [0, 2],
};

const DIAL_ORDER: DialDirection[] = ['Highest', 'Even', 'Lowest', 'Odd'];

export const MAX_BANK = 5;
export const VICTORY_TARGET = 10;
export const CORRUPTION_THRESHOLD = 10;

function pushLog(state: GameState, message: string) {
  state.logs.push(message);
  if (state.logs.length > 200) {
    state.logs.shift();
  }
  // eslint-disable-next-line no-console
  console.log(message);
}

export function logEvent(state: GameState, message: string) {
  pushLog(state, message);
}

function shuffle<T>(input: T[]): T[] {
  const array = [...input];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function createDeck(size: number): PulseCard[] {
  const perType = Math.max(1, Math.floor(size / 4));
  const cards: PulseCard[] = [];
  let id = 0;
  (['Mist', 'Echo', 'Bloom', 'Aether'] as StratumType[]).forEach((type) => {
    for (let i = 0; i < perType; i += 1) {
      id += 1;
      cards.push({ id, type });
    }
  });
  return shuffle(cards).slice(0, size);
}

function drawCard(queue: PulseQueue): PulseCard | null {
  if (!queue.deck.length) {
    if (queue.discard.length) {
      queue.deck = shuffle(queue.discard);
      queue.discard = [];
    } else {
      return null;
    }
  }
  return queue.deck.shift() ?? null;
}

function rotateDirection(direction: DialDirection, steps = 1): DialDirection {
  const currentIndex = DIAL_ORDER.indexOf(direction);
  const nextIndex = (currentIndex + steps + DIAL_ORDER.length) % DIAL_ORDER.length;
  return DIAL_ORDER[nextIndex];
}

function clampBank(value: number): number {
  return Math.max(0, Math.min(MAX_BANK, value));
}

function selectStratumByDirection(candidates: Stratum[], direction: DialDirection): Stratum | null {
  if (!candidates.length) return null;
  switch (direction) {
    case 'Highest':
      return candidates.reduce((best, current) => (current.id > best.id ? current : best));
    case 'Lowest':
      return candidates.reduce((best, current) => (current.id < best.id ? current : best));
    case 'Even': {
      const evenMatch = candidates.find((candidate) => candidate.id % 2 === 0);
      return evenMatch ?? candidates.find((candidate) => candidate.id % 2 === 1) ?? candidates[0];
    }
    case 'Odd': {
      const oddMatch = candidates.find((candidate) => candidate.id % 2 === 1);
      return oddMatch ?? candidates.find((candidate) => candidate.id % 2 === 0) ?? candidates[0];
    }
    default:
      return candidates[0];
  }
}

function locateStratum(state: GameState, direction: DialDirection, type?: StratumType): Stratum | null {
  if (type) {
    const matches = state.strata.filter((stratum) => stratum.type === type);
    if (matches.length) {
      return selectStratumByDirection(matches, direction);
    }
    if (state.effects.nowActsAsAllTypes && state.queue.now) {
      const nowCard = state.queue.now;
      const presentMatches = state.strata.filter((stratum) => stratum.type === nowCard.type);
      const present = selectStratumByDirection(presentMatches, state.compass.pulseHand);
      if (present) {
        return present;
      }
    }
  }

  const indices = COMPASS_TARGET_MAP[direction] ?? [];
  for (const index of indices) {
    const stratum = state.strata[index];
    if (stratum) {
      return stratum;
    }
  }

  if (type) {
    return state.strata.find((stratum) => stratum.type === type) ?? null;
  }
  return null;
}

export function findStratum(state: GameState, direction: DialDirection, type?: StratumType): Stratum | null {
  return locateStratum(state, direction, type);
}

function getTargetCard(queue: PulseQueue, targeting: EdictTargeting): PulseCard | null {
  switch (targeting) {
    case 'Yesterday':
      return queue.after;
    case 'Will':
      return queue.before;
    case 'Now':
    default:
      return queue.now;
  }
}

function createInitialQueue(deck: PulseCard[]): PulseQueue {
  const workingDeck = [...deck];
  const before = workingDeck.shift() ?? null;
  const now = workingDeck.shift() ?? null;
  const after = workingDeck.shift() ?? null;
  return {
    before,
    now,
    after,
    deck: workingDeck,
    discard: [],
  };
}

export function initializeGame(options: InitializeGameOptions = {}): GameState {
  const deckSize = options.deckSize ?? 24;
  const deck = createDeck(deckSize);
  const queue = createInitialQueue(deck);
  const compass: Compass = {
    pulseHand: options.initialCompass?.pulseHand ?? 'Highest',
    controlHand: options.initialCompass?.controlHand ?? 'Even',
    linked: options.initialCompass?.linked ?? options.linked ?? true,
  };

  const strata: Stratum[] = STRATUM_LAYOUT.map((type, index) => ({
    id: index + 1,
    type,
    infoTokens: 0,
    corruptionTokens: 0,
  }));

  const player: Player = {
    bank: 0,
    victoryTrack: 0,
    edicts: options.initialPlayerEdicts ?? [],
  };

  const state: GameState = {
    round: 0,
    strata,
    compass,
    queue,
    player,
    corruptionTrack: 0,
    logs: [],
    status: 'in-progress',
    effects: {
      preventInfoLoss: 0,
      preventEscalation: 0,
      afterLockedRounds: 0,
      stratumTypeLocks: {},
      controlTargetsBefore: false,
      reverseCompassRotation: false,
      doublePulse: 0,
      nowActsAsAllTypes: false,
      forceLinkedRounds: 0,
      cancelNextPulse: false,
      tempTypeOverrides: {},
    },
  };

  pushLog(state, 'Game initialised.');
  return state;
}

function determineEdictTarget(state: GameState, edict: Edict): { stratum: Stratum | null; card: PulseCard | null } {
  const card = state.effects.controlTargetsBefore && edict.targeting === 'Now'
    ? state.queue.before
    : getTargetCard(state.queue, edict.targeting);
  const direction = state.compass.controlHand;
  const stratum = locateStratum(state, direction, card?.type);
  return { stratum, card };
}

export function resolveReflex(state: GameState) {
  const playable = state.player.edicts.filter(
    (edict) => edict.timing === '→P' && edict.threshold <= state.player.bank,
  );

  playable.forEach((edict) => {
    const target = determineEdictTarget(state, edict);
    pushLog(state, `Reflex: ${edict.name} (threshold ${edict.threshold}) targeting ${target.stratum ? `${target.stratum.type} #${target.stratum.id}` : 'no stratum'}.`);
    edict.effect({ state, targetStratum: target.stratum ?? null, targetCard: target.card ?? null });
    state.player.bank = clampBank(state.player.bank);
  });
}

export function resolvePulse(state: GameState) {
  const card = state.queue.now;
  if (!card) {
    pushLog(state, 'Pulse: No card in Now slot.');
    return;
  }
  const stratum = locateStratum(state, state.compass.pulseHand, card.type);
  if (!stratum) {
    pushLog(state, `Pulse: No matching stratum found for ${card.type}.`);
    return;
  }

  if (state.effects.cancelNextPulse) {
    pushLog(state, 'Pulse: Effect cancelled by edict.');
    state.effects.cancelNextPulse = false;
    return;
  }

  pushLog(state, `Pulse: Resolving ${card.type} at stratum #${stratum.id}.`);
  if (stratum.infoTokens > 0) {
    stratum.infoTokens -= 1;
    stratum.corruptionTokens += 1;
    pushLog(state, `Pulse: Converted 1 Info to Corruption on stratum #${stratum.id}.`);
  }
  stratum.infoTokens += 1;
  pushLog(state, `Pulse: Added 1 Info to stratum #${stratum.id} (Info=${stratum.infoTokens}, Corruption=${stratum.corruptionTokens}).`);

  if (state.effects.doublePulse > 0) {
    const secondStratum = state.strata.find((candidate) => candidate.id !== stratum.id && candidate.type === card.type);
    if (secondStratum) {
      pushLog(state, `Pulse: Dimensional resonance hits secondary ${card.type} stratum #${secondStratum.id}.`);
      if (secondStratum.infoTokens > 0) {
        secondStratum.infoTokens -= 1;
        secondStratum.corruptionTokens += 1;
      }
      secondStratum.infoTokens += 1;
    }
  }
}

export function resolveAftershock(state: GameState) {
  const playable = state.player.edicts.filter(
    (edict) => edict.timing === 'P→' && edict.threshold <= state.player.bank,
  );

  playable.forEach((edict) => {
    const target = determineEdictTarget(state, edict);
    pushLog(state, `Aftershock: ${edict.name} targeting ${target.stratum ? `${target.stratum.type} #${target.stratum.id}` : 'no stratum'}.`);
    edict.effect({ state, targetStratum: target.stratum ?? null, targetCard: target.card ?? null });
    state.player.bank = clampBank(state.player.bank);
  });
}

export function resolveDecay(state: GameState) {
  let conversions = 0;
  state.strata.forEach((stratum) => {
    if (stratum.infoTokens >= 2) {
      if (state.effects.preventInfoLoss > 0) {
        state.effects.preventInfoLoss -= 1;
        pushLog(state, `Decay: Prevention shield blocks info loss on stratum #${stratum.id}.`);
      } else {
        stratum.infoTokens -= 1;
        stratum.corruptionTokens += 1;
        conversions += 1;
      }
    }
  });
  if (conversions) {
    pushLog(state, `Decay: Converted ${conversions} Info into Corruption.`);
  } else {
    pushLog(state, 'Decay: No conversions.');
  }
}

export function resolveEscalation(state: GameState) {
  let escalated = 0;
  state.strata.forEach((stratum) => {
    if (stratum.corruptionTokens >= 2) {
      if (state.effects.preventEscalation > 0) {
        state.effects.preventEscalation -= 1;
        pushLog(state, `Escalation: Prevention shield blocks escalation from stratum #${stratum.id}.`);
      } else {
        stratum.corruptionTokens -= 1;
        escalated += 1;
      }
    }
  });
  if (escalated) {
    state.corruptionTrack += escalated;
    pushLog(state, `Escalation: Moved ${escalated} Corruption to global track (Track=${state.corruptionTrack}).`);
  } else {
    pushLog(state, 'Escalation: No corruption escalated.');
  }
}

export function resolveResearch(state: GameState, shouldResearch = false, draftEdict?: () => Edict | null) {
  if (!shouldResearch) {
    pushLog(state, 'Research: Skipped.');
    return;
  }
  if (state.player.bank <= 0) {
    pushLog(state, 'Research: Not enough banked Info to research.');
    return;
  }
  state.player.bank = clampBank(state.player.bank - 1);
  pushLog(state, 'Research: Spent 1 banked Info.');
  if (draftEdict) {
    const newEdict = draftEdict();
    if (newEdict) {
      state.player.edicts.push(newEdict);
      pushLog(state, `Research: Drafted new edict "${newEdict.name}".`);
    } else {
      pushLog(state, 'Research: No edict drafted.');
    }
  }
}

export function reloadRound(state: GameState) {
  const shouldLockAfter = state.effects.afterLockedRounds > 0;
  const discarded = shouldLockAfter ? null : state.queue.after;
  if (discarded) {
    state.queue.discard.push(discarded);
    pushLog(state, `Reload: Discarded ${discarded.type} card.`);
  } else if (state.queue.after) {
    pushLog(state, 'Reload: After slot locked — card retained.');
  }

  if (!shouldLockAfter) {
    state.queue.after = state.queue.now;
  }
  state.queue.now = state.queue.before;
  state.queue.before = drawCard(state.queue);
  if (state.queue.before) {
    pushLog(state, `Reload: Drew ${state.queue.before.type} into Before slot.`);
  } else {
    pushLog(state, 'Reload: Deck empty — Before slot left vacant.');
  }

  const step = state.effects.reverseCompassRotation ? -1 : 1;
  state.compass.pulseHand = rotateDirection(state.compass.pulseHand, step);
  if (state.compass.linked) {
    state.compass.controlHand = rotateDirection(state.compass.controlHand, step);
    pushLog(state, `Reload: Compass linked. Pulse=${state.compass.pulseHand}, Control=${state.compass.controlHand}.`);
  } else {
    pushLog(state, `Reload: Compass unlinked. Pulse=${state.compass.pulseHand}, Control=${state.compass.controlHand}.`);
  }

  if (state.effects.forceLinkedRounds > 0) {
    state.effects.forceLinkedRounds -= 1;
    if (state.effects.forceLinkedRounds === 0) {
      state.compass.linked = false;
    }
  }

  if (state.effects.afterLockedRounds > 0) {
    state.effects.afterLockedRounds -= 1;
  }

  if (state.effects.doublePulse > 0) {
    state.effects.doublePulse -= 1;
  }

  if (state.effects.nowActsAsAllTypes) {
    state.effects.nowActsAsAllTypes = false;
  }

  state.effects.controlTargetsBefore = false;
  state.effects.reverseCompassRotation = false;
  state.effects.cancelNextPulse = false;
  tickStratumLocks(state);
}

export function checkVictoryOrDefeat(state: GameState): GameState['status'] {
  if (state.player.victoryTrack >= VICTORY_TARGET) {
    pushLog(state, 'Victory achieved!');
    return 'victory';
  }
  if (state.corruptionTrack >= CORRUPTION_THRESHOLD) {
    pushLog(state, 'Defeat: Corruption overwhelmed the timeline.');
    return 'defeat';
  }
  return 'in-progress';
}

export function playRound(state: GameState, options: RoundOptions = {}): GameState {
  if (state.status !== 'in-progress') {
    pushLog(state, `Round skipped — game already ${state.status}.`);
    return state;
  }

  pushLog(state, `\n=== Round ${state.round + 1} ===`);
  resolveReflex(state);
  resolvePulse(state);
  resolveAftershock(state);
  resolveDecay(state);
  resolveEscalation(state);
  resolveResearch(state, options.research ?? false, options.draftEdict);
  reloadRound(state);

  state.round += 1;
  state.status = checkVictoryOrDefeat(state);
  return state;
}

export function awardVictory(state: GameState, amount: number) {
  state.player.victoryTrack = Math.max(0, state.player.victoryTrack + amount);
  pushLog(state, `Victory Track increased by ${amount} (now ${state.player.victoryTrack}).`);
}

export function adjustBank(state: GameState, amount: number) {
  state.player.bank = clampBank(state.player.bank + amount);
  pushLog(state, `Bank adjusted by ${amount} (now ${state.player.bank}).`);
}

export function cleanseCorruption(stratum: Stratum, amount = 1) {
  const removed = Math.min(amount, stratum.corruptionTokens);
  stratum.corruptionTokens -= removed;
}

export function addInfo(stratum: Stratum, amount = 1) {
  stratum.infoTokens += amount;
}

export function removeInfo(stratum: Stratum, amount = 1) {
  const removed = Math.min(amount, stratum.infoTokens);
  stratum.infoTokens -= removed;
}

export function currentNowStratum(state: GameState): Stratum | null {
  const card = state.queue.now;
  if (!card) return null;
  return locateStratum(state, state.compass.pulseHand, card.type);
}

export function cloneState(state: GameState): GameState {
  return {
    ...state,
    strata: state.strata.map((stratum) => ({ ...stratum })),
    compass: { ...state.compass },
    queue: {
      before: state.queue.before ? { ...state.queue.before } : null,
      now: state.queue.now ? { ...state.queue.now } : null,
      after: state.queue.after ? { ...state.queue.after } : null,
      deck: state.queue.deck.map((card) => ({ ...card })),
      discard: state.queue.discard.map((card) => ({ ...card })),
    },
    player: {
      ...state.player,
      edicts: [...state.player.edicts],
    },
    logs: [...state.logs],
    effects: {
      preventInfoLoss: state.effects.preventInfoLoss,
      preventEscalation: state.effects.preventEscalation,
      afterLockedRounds: state.effects.afterLockedRounds,
      stratumTypeLocks: { ...state.effects.stratumTypeLocks },
      controlTargetsBefore: state.effects.controlTargetsBefore,
      reverseCompassRotation: state.effects.reverseCompassRotation,
      doublePulse: state.effects.doublePulse,
      nowActsAsAllTypes: state.effects.nowActsAsAllTypes,
      forceLinkedRounds: state.effects.forceLinkedRounds,
      cancelNextPulse: state.effects.cancelNextPulse,
      tempTypeOverrides: Object.fromEntries(Object.entries(state.effects.tempTypeOverrides).map(([key, value]) => [key, { ...value }])),
    },
  };
}

export function rotateCompass(state: GameState, pulseSteps = 0, controlSteps = 0) {
  if (pulseSteps) {
    state.compass.pulseHand = rotateDirection(state.compass.pulseHand, pulseSteps);
  }
  if (controlSteps) {
    state.compass.controlHand = rotateDirection(state.compass.controlHand, controlSteps);
  }
  pushLog(state, `Compass rotated: Pulse=${state.compass.pulseHand}, Control=${state.compass.controlHand}.`);
}

export function setCompassLinked(state: GameState, linked: boolean) {
  state.compass.linked = linked;
  pushLog(state, `Compass linking ${linked ? 'enabled' : 'disabled'}.`);
}

export function swapCompassHands(state: GameState) {
  const temp = state.compass.pulseHand;
  state.compass.pulseHand = state.compass.controlHand;
  state.compass.controlHand = temp;
  pushLog(state, 'Compass hands swapped.');
}

export function changeStratumType(state: GameState, stratum: Stratum, nextType: StratumType) {
  const lockRemaining = state.effects.stratumTypeLocks[stratum.id];
  if (lockRemaining && lockRemaining > 0) {
    pushLog(state, `Stratum #${stratum.id} type is locked and cannot change.`);
    return;
  }
  const prev = stratum.type;
  stratum.type = nextType;
  pushLog(state, `Stratum #${stratum.id} type changed from ${prev} to ${nextType}.`);
}

export function lockStratumType(state: GameState, stratum: Stratum, rounds: number) {
  state.effects.stratumTypeLocks[stratum.id] = rounds;
  pushLog(state, `Stratum #${stratum.id} type locked for ${rounds} rounds.`);
}

export function tickStratumLocks(state: GameState) {
  Object.entries(state.effects.stratumTypeLocks).forEach(([id, rounds]) => {
    const next = Math.max(0, rounds - 1);
    state.effects.stratumTypeLocks[Number(id)] = next;
  });

  Object.entries(state.effects.tempTypeOverrides).forEach(([id, payload]) => {
    const next = Math.max(0, payload.rounds - 1);
    if (next <= 0) {
      const stratum = state.strata.find((item) => item.id === Number(id));
      if (stratum) {
        stratum.type = payload.original;
        pushLog(state, `Stratum #${stratum.id} reverts to ${payload.original}.`);
      }
      delete state.effects.tempTypeOverrides[Number(id)];
    } else {
      state.effects.tempTypeOverrides[Number(id)] = { ...payload, rounds: next };
    }
  });
}

export function setTemporaryType(state: GameState, stratum: Stratum, nextType: StratumType, rounds: number) {
  if (!state.effects.tempTypeOverrides[stratum.id]) {
    state.effects.tempTypeOverrides[stratum.id] = { original: stratum.type, rounds };
  } else {
    state.effects.tempTypeOverrides[stratum.id].rounds = rounds;
  }
  stratum.type = nextType;
  pushLog(state, `Stratum #${stratum.id} temporarily becomes ${nextType} for ${rounds} rounds.`);
}
