import {
  adjustBank,
  cleanseCorruption,
  addInfo,
  removeInfo,
  logEvent,
  rotateCompass,
  setCompassLinked,
  swapCompassHands,
  changeStratumType,
  lockStratumType,
  setTemporaryType,
  currentNowStratum,
  findStratum,
  awardVictory,
  resolvePulse,
  reloadRound,
} from '../../pulsar-sim/src/game.ts';

const RAW_EDICTS = [
  ['Ego Starting', 'Seal the Break', 0, '→P', 'Now', 'Stitch the fracture shut and absorb 1 Info from the stratum.'],
  ['Ego Starting', 'Bind Corruption', 0, 'P→', 'Now', 'Anchor the churning miasma and prevent 1 Corruption from spilling over.'],
  ['Ego Starting', 'Compass Shift', 0, '→P', 'Now', 'Send a tremor through the dial and rotate the Compass Hands 90° clockwise or counterclockwise.'],
  ['Ego Starting', 'Info Absorb', 0, '→P', 'Now', 'Channel the pulse and take 1 Info into your bank.'],
  ['Ego Starting', 'Purge Corruption', 0, 'P→', 'Now', 'Wash the lattice clean and clear 1 Corruption from the target.'],
  ['Basic', 'Memory Anchor', 0, 'P→', 'Now', 'Set a mnemonic mooring and prevent 1 Info from slipping away.'],
  ['Basic', 'Echo Reach', 0, 'P→', 'Now', 'Extend the resonance so the Control Hand also targets the opposite Stratum.'],
  ['Basic', 'Harvest Dreams', 0, '→P', 'Now', 'Rake the dreamfield clean and absorb all Info within reach.'],
  ['Basic', 'Silent Echo', 0, '→P', 'Now', 'Mute the resonance entirely and prevent Pulse effect for the moment.'],
  ['Basic', 'Dream Cascade', 0, '→P', 'Now', 'Open a spillway to move 1 Info toward calmer strata.'],
  ['Intermediate', 'Temporal Wrench', 2, '→P', 'Now', 'Wrench time backward to rotate Pulse Hand 90° counterclockwise; then add 1 Info to your Bank.'],
  ['Intermediate', 'Counterpull', 2, '→P', 'Now', 'Counterbalance the dial to rotate Control Hand 90° clockwise; then prevent 1 Corruption decay anywhere.'],
  ['Intermediate', 'Waterfall Transition', 3, '→P', 'Now', 'Redirect the elemental flow to change 1 Mist→Aether and 1 Aether→Mist.'],
  ['Intermediate', 'Bloomshift', 2, 'P→', 'Now', 'Bathe the present in petals and change Now Stratum’s type to Echo until end of round.'],
  ['Intermediate', 'Echo Collapse', 3, '→P', 'Now', 'Shatter a persistent Echo and reassign it randomly as Mist, Bloom, or Aether.'],
  ['Intermediate', 'Resonant Pulse', 3, '→P', 'Now', 'Let the pulse harmonize so the Now Stratum acts as all four types.'],
  ['Intermediate', 'Corruption Burn', 2, 'P→', 'Now', 'Transmute taint into clarity as you change 1 Corruption into pure info.'],
  ['Intermediate', 'Nightmare Banish', 2, 'P→', 'Now', 'Exile the nightmare: if Now has 2+ Corruption, remove all but 1.'],
  ['Intermediate', 'Lucid Bloom', 3, 'P→', 'Now', 'If Now is Bloom, kindle lucidity and immediately ascend 1 Info from your Bank.'],
  ['Intermediate', 'Mist Shroud', 2, 'P→', 'Now', 'If Now is Mist, weave a shroud to prevent 1 escalation anywhere.'],
  ['Intermediate', 'Stellar Shift', 2, '→P', 'Will', 'Slide the constellations so the Control Hand may target the Before slot instead of Now.'],
  ['Intermediate', 'Reverie Bind', 2, 'P→', 'Yesterday', 'Lash the timeline tight; the After slot is locked and doesn’t discard next round.'],
  ['Intermediate', 'Axis Realignment', 2, '→P', 'Now', 'Flip the axis entirely—you swap positions of Pulse and Control Hands.'],
  ['Intermediate', 'Fracture Seal', 3, 'P→', 'Now', 'Seal a shifting layer and lock 1 Stratum’s type; it cannot be reshaped for 2 rounds.'],
  ['Intermediate', 'Dream Sync', 2, 'P→', 'Now', 'Sync the rhythm to link Pulse and Control Hands until next round.'],
  ['Intermediate', 'Time Echo', 3, 'P→', 'Yesterday', 'Call yesterday forward and repeat the effect of the card leaving the After slot.'],
  ['Intermediate', 'Orbit Breaker', 2, '→P', 'Now', 'Crack the orbit and reverse Compass rotation for this reload.'],
  ['Intermediate', 'Echo Rebound', 3, 'P→', 'Now', 'If Now is Echo, let the song rebound and copy its effect onto an adjacent Stratum.'],
  ['Intermediate', 'Dimensional Fold', 3, 'P→', 'Now', 'Bend space-time so the Pulse Hand targets two Strata of the same type.'],
  ['Intermediate', 'Cascade Break', 3, '→P', 'Now', 'Interrupt the cascade—when Corruption escalates in one Stratum, redirect it to its type-twin instead.'],
  ['Major', 'Dream Synthesis', 4, 'P→', 'Now', 'Synthesize the dreamlight: ascend 1 Info from your Bank; then prevent 1 decay anywhere.'],
  ['Major', 'Fractured Resonance', 4, 'P→', 'Now', 'Harness the fracture to clear 1 Corruption; then you ascend 1 Info.'],
  ['Major', 'Temporal Collapse', 4, 'P→', 'Now', 'Trigger a collapse—immediately advance the Pulse Queue; then play another →P Edict.'],
  ['Major', 'Mirror Pulse', 5, 'P→', 'Now', 'Split the wave so you apply Now’s Pulse effect twice; then decay 1 Info anywhere.'],
  ['Major', 'Reality Twist', 4, '→P', 'Now', 'Twist reality: swap the Before and Now slots; then rotate the Pulse Hand 90°.'],
  ['Major', 'Dream Weave', 4, '→P', 'Now', 'Weave radiant threads to rotate the Control Hand 90°; then absorb 1 Info into your Bank.'],
  ['Major', 'Cascade Seal', 5, 'P→', 'Now', 'Seal the cascade to prevent escalation anywhere; then rotate the Compass 90° counterclockwise.'],
  ['Major', 'Corrupted Insight', 5, '→P', 'Now', 'Transfuse corruption into wisdom: clear 1 Corruption; then add 1 Info to your Bank; then rotate the Control Hand 90°.'],
  ['Major', 'Absolute Seal', 5, '→P', 'Now', 'Drop an absolute ward—cancel 1 escalation; then gain +1 permanent Info directly to the Victory Track.'],
  ['Major', 'Foresight Surge', 4, '→P', 'Will', 'Spark foresight: glimpse the next 2 Pulse cards; then add 1 Info to the Before slot’s Stratum.'],
];

const randomChoice = (items) => items[Math.floor(Math.random() * items.length)];

function absorbInfo(state, stratum, amount) {
  if (!stratum) {
    logEvent(state, 'No stratum available to absorb info.');
    return;
  }
  const qty = Math.min(amount, stratum.infoTokens);
  if (qty <= 0) {
    logEvent(state, `No info on ${stratum.type} #${stratum.id} to absorb.`);
    return;
  }
  removeInfo(stratum, qty);
  adjustBank(state, qty);
  logEvent(state, `Absorbed ${qty} info from ${stratum.type} #${stratum.id}.`);
}

function absorbAllInfo(state, stratum) {
  if (!stratum) {
    logEvent(state, 'No stratum available to harvest info.');
    return;
  }
  const qty = stratum.infoTokens;
  if (qty <= 0) {
    logEvent(state, `${stratum.type} #${stratum.id} has no info to harvest.`);
    return;
  }
  removeInfo(stratum, qty);
  adjustBank(state, qty);
  logEvent(state, `Harvested ${qty} info from ${stratum.type} #${stratum.id}.`);
}

function preventInfoLoss(state, count = 1) {
  state.effects.preventInfoLoss += count;
  logEvent(state, `Info loss prevention increased by ${count}.`);
}

function preventEscalation(state, count = 1) {
  state.effects.preventEscalation += count;
  logEvent(state, `Escalation prevention increased by ${count}.`);
}

function rotateCompassByText(state, text) {
  const lower = text.toLowerCase();
  if (lower.includes('counterclockwise')) {
    rotateCompass(state, lower.includes('pulse') ? -1 : 0, lower.includes('control') ? -1 : 0);
  } else if (lower.includes('clockwise')) {
    rotateCompass(state, lower.includes('pulse') ? 1 : 0, lower.includes('control') ? 1 : 0);
  } else {
    rotateCompass(state, 1, 1);
  }
}

function addInfoToLeastLoaded(state) {
  const sorted = [...state.strata].sort((a, b) => a.infoTokens - b.infoTokens);
  const target = sorted[0];
  if (target) {
    addInfo(target, 1);
    logEvent(state, `Moved info to ${target.type} #${target.id}.`);
  }
}

function swapQueueBeforeNow(state) {
  const temp = state.queue.before;
  state.queue.before = state.queue.now;
  state.queue.now = temp;
  logEvent(state, 'Swapped Before and Now pulse cards.');
}

function applyEffect(context, definition) {
  const { state, targetStratum } = context;
  const effectText = definition.effect.toLowerCase();

  if (effectText.includes('absorb all info')) {
    absorbAllInfo(state, targetStratum);
    return;
  }
  if (effectText.includes('absorb 1 info') || effectText.includes('take 1 info')) {
    absorbInfo(state, targetStratum, 1);
    return;
  }
  if (effectText.includes('prevent pulse effect')) {
    state.effects.cancelNextPulse = true;
    logEvent(state, 'Next pulse will be cancelled.');
    return;
  }
  if (effectText.includes('prevent 1 info')) {
    preventInfoLoss(state, 1);
    return;
  }
  if (effectText.includes('prevent 1 corruption decay')) {
    preventInfoLoss(state, 1);
    return;
  }
  if (effectText.includes('prevent 1 escalation')) {
    preventEscalation(state, 1);
    return;
  }
  if (effectText.includes('prevent escalation')) {
    preventEscalation(state, 1);
    if (effectText.includes('counterclockwise')) {
      rotateCompass(state, -1, -1);
    }
    return;
  }
  if (effectText.includes('prevent 1 corruption')) {
    if (targetStratum) {
      cleanseCorruption(targetStratum, 1);
      logEvent(state, `Reduced corruption on ${targetStratum.type} #${targetStratum.id}.`);
    }
    return;
  }
  if (effectText.includes('move 1 info')) {
    if (targetStratum && targetStratum.infoTokens > 0) {
      removeInfo(targetStratum, 1);
      addInfoToLeastLoaded(state);
    } else {
      addInfoToLeastLoaded(state);
    }
    return;
  }
  if (effectText.includes('clear 1 corruption')) {
    if (targetStratum) {
      cleanseCorruption(targetStratum, 1);
      logEvent(state, `Cleared corruption on ${targetStratum.type} #${targetStratum.id}.`);
    }
    if (effectText.includes('add 1 info to your bank')) {
      adjustBank(state, 1);
      logEvent(state, 'Bonus info added to bank.');
    }
    if (effectText.includes('ascend 1 info')) {
      if (state.player.bank > 0) {
        adjustBank(state, -1);
        awardVictory(state, 1);
      }
    }
    if (effectText.includes('rotate the control hand')) {
      rotateCompass(state, 0, 1);
    }
    return;
  }
  if (effectText.includes('cancel 1 escalation')) {
    preventEscalation(state, 1);
    if (effectText.includes('permanent info')) {
      awardVictory(state, 1);
    }
    return;
  }
  if (effectText.includes('rotate pulse hand') || effectText.includes('rotate the pulse hand')) {
    rotateCompassByText(state, definition.effect);
    if (effectText.includes('add 1 info to your bank')) {
      adjustBank(state, 1);
    }
    return;
  }
  if (effectText.includes('rotate control hand')) {
    rotateCompassByText(state, definition.effect);
    if (effectText.includes('absorb 1 info')) {
      absorbInfo(state, targetStratum ?? currentNowStratum(state), 1);
    }
    return;
  }
  if (effectText.includes('compass hands')) {
    rotateCompass(state, 1, 1);
    return;
  }
  if (effectText.includes('swap positions of pulse and control hands')) {
    swapCompassHands(state);
    return;
  }
  if (effectText.includes('link pulse and control hands')) {
    setCompassLinked(state, true);
    state.effects.forceLinkedRounds = Math.max(state.effects.forceLinkedRounds, 1);
    return;
  }
  if (effectText.includes('control hand may target the before slot')) {
    state.effects.controlTargetsBefore = true;
    logEvent(state, 'Control hand retargets the Before slot.');
    return;
  }
  if (effectText.includes('locked the after slot')) {
    state.effects.afterLockedRounds = Math.max(1, state.effects.afterLockedRounds);
    logEvent(state, 'After slot locked for the next reload.');
    return;
  }
  if (effectText.includes('lock 1 stratum') && targetStratum) {
    lockStratumType(state, targetStratum, 2);
    return;
  }
  if (effectText.includes('change now stratum’s type to echo')) {
    const nowStratum = currentNowStratum(state);
    if (nowStratum) {
      setTemporaryType(state, nowStratum, 'Echo', 1);
    }
    return;
  }
  if (effectText.includes('change 1 mist→aether')) {
    const mist = state.strata.find((item) => item.type === 'Mist');
    if (mist) {
      changeStratumType(state, mist, 'Aether');
    }
    const aether = state.strata.find((item) => item.type === 'Aether');
    if (aether) {
      changeStratumType(state, aether, 'Mist');
    }
    return;
  }
  if (effectText.includes('reassign 1 echo') || effectText.includes('randomly')) {
    const echo = state.strata.find((item) => item.type === 'Echo');
    if (echo) {
      const options = ['Mist', 'Bloom', 'Aether'];
      const next = randomChoice(options);
      changeStratumType(state, echo, next);
    }
    return;
  }
  if (effectText.includes('acts as all four types')) {
    state.effects.nowActsAsAllTypes = true;
    logEvent(state, 'Current stratum counts as all types this round.');
    return;
  }
  if (effectText.includes('change 1 corruption')) {
    if (targetStratum && targetStratum.corruptionTokens > 0) {
      targetStratum.corruptionTokens -= 1;
      targetStratum.infoTokens += 1;
      logEvent(state, `Converted corruption into info on ${targetStratum.type} #${targetStratum.id}.`);
    }
    return;
  }
  if (effectText.includes('if now has 2+ corruption')) {
    const nowStratum = currentNowStratum(state);
    if (nowStratum && nowStratum.corruptionTokens >= 2) {
      nowStratum.corruptionTokens = 1;
      logEvent(state, `Nightmare banished from ${nowStratum.type} #${nowStratum.id}.`);
    }
    return;
  }
  if (effectText.includes('if now is bloom')) {
    const nowStratum = currentNowStratum(state);
    if (nowStratum && nowStratum.type === 'Bloom' && state.player.bank > 0) {
      adjustBank(state, -1);
      awardVictory(state, 1);
      logEvent(state, 'Ascended 1 info from bank to victory track.');
    }
    return;
  }
  if (effectText.includes('if now is mist')) {
    const nowStratum = currentNowStratum(state);
    if (nowStratum && nowStratum.type === 'Mist') {
      preventEscalation(state, 1);
    }
    return;
  }
  if (effectText.includes('reverse compass rotation')) {
    state.effects.reverseCompassRotation = true;
    logEvent(state, 'Compass rotation reversed for this reload.');
    return;
  }
  if (effectText.includes('copy its effect onto an adjacent stratum')) {
    const nowStratum = currentNowStratum(state);
    if (nowStratum && nowStratum.type === 'Echo') {
      const adjacent = state.strata.find((item) => Math.abs(item.id - nowStratum.id) === 1);
      if (adjacent) {
        adjacent.infoTokens += 1;
        logEvent(state, `Echo rebounds to adjacent stratum #${adjacent.id}.`);
      }
    }
    return;
  }
  if (effectText.includes('targets two strata')) {
    state.effects.doublePulse = Math.max(state.effects.doublePulse, 1);
    logEvent(state, 'Pulse will target an additional matching stratum.');
    return;
  }
  if (effectText.includes('redirect it to its type-twin')) {
    preventEscalation(state, 1);
    logEvent(state, 'Next escalation redirected to type twin.');
    return;
  }
  if (effectText.includes('ascend 1 info from your bank')) {
    if (state.player.bank > 0) {
      adjustBank(state, -1);
      awardVictory(state, 1);
    }
    if (effectText.includes('prevent 1 decay')) {
      preventInfoLoss(state, 1);
    }
    return;
  }
  if (effectText.includes('clear 1 corruption; then you ascend 1 info')) {
    if (targetStratum) {
      cleanseCorruption(targetStratum, 1);
    }
    if (state.player.bank > 0) {
      adjustBank(state, -1);
      awardVictory(state, 1);
    }
    return;
  }
  if (effectText.includes('immediately advance the pulse queue')) {
    reloadRound(state);
    logEvent(state, 'Temporal Collapse advances the pulse queue.');
    return;
  }
  if (effectText.includes('apply now’s pulse effect twice')) {
    state.effects.cancelNextPulse = false;
    resolvePulse(state);
    const richest = [...state.strata].sort((a, b) => b.infoTokens - a.infoTokens)[0];
    if (richest && richest.infoTokens > 0) {
      removeInfo(richest, 1);
      logEvent(state, `Mirror Pulse triggers decay on stratum #${richest.id}.`);
    }
    return;
  }
  if (effectText.includes('swap the before and now slots')) {
    swapQueueBeforeNow(state);
    rotateCompass(state, 1, 0);
    return;
  }
  if (effectText.includes('absorb 1 info into your bank')) {
    absorbInfo(state, targetStratum ?? currentNowStratum(state), 1);
    return;
  }
  if (effectText.includes('add 1 info to the before slot')) {
    const card = state.queue.before;
    if (card) {
      const target = findStratum(state, state.compass.pulseHand, card.type);
      if (target) {
        addInfo(target, 1);
        logEvent(state, `Added 1 info to future ${target.type} #${target.id}.`);
      }
    }
    return;
  }
  if (effectText.includes('glimpse')) {
    const preview = state.queue.deck.slice(0, 2).map((card) => card.type).join(', ') || 'no cards';
    logEvent(state, `Foresight reveals: ${preview}.`);
    const beforeCard = state.queue.before;
    if (beforeCard) {
      const futureStratum = findStratum(state, state.compass.pulseHand, beforeCard.type);
      if (futureStratum) {
        addInfo(futureStratum, 1);
        logEvent(state, `Future ${futureStratum.type} #${futureStratum.id} gains 1 info.`);
      }
    }
    return;
  }

  logEvent(state, `Effect for ${definition.name} not fully automated yet.`);
}

export const ALL_EDICTS = RAW_EDICTS.map(([category, name, threshold, timing, targeting, effect]) => ({
  category,
  name,
  threshold: Number(threshold),
  timing,
  targeting,
  effectText: effect,
  effect: (context) => applyEffect(context, { name, effect }),
}));

export function createEgoStartingHand() {
  return ALL_EDICTS.filter((edict) => edict.category === 'Ego Starting')
    .map((edict) => ({ ...edict }));
}

export function createEdictDeck() {
  return ALL_EDICTS.filter((edict) => edict.category !== 'Ego Starting')
    .map((edict) => ({ ...edict }));
}

export function drawFromDeck(deck, count = 1) {
  const pool = [...deck];
  const drawn = [];
  for (let i = 0; i < count && pool.length; i += 1) {
    const index = Math.floor(Math.random() * pool.length);
    drawn.push(pool.splice(index, 1)[0]);
  }
  return { drawn, remaining: pool };
}

export function refreshMarket(deck, currentMarket = [], size = 4) {
  const nextMarket = [...currentMarket];
  const workingDeck = [...deck];
  while (nextMarket.length < size && workingDeck.length) {
    const index = Math.floor(Math.random() * workingDeck.length);
    nextMarket.push(workingDeck.splice(index, 1)[0]);
  }
  return { market: nextMarket, deck: workingDeck };
}
