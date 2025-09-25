#!/bin/bash
apply_patch <<'PATCH'
*** Begin Patch
*** Update File: src/pages/Pulsar.jsx
@@
-const ROUND_PHASES = [
+const ROUND_PHASES = [
+  {
+    key: 'center',
+    label: 'Center Yourself',
+    description: 'Choose which edicts you will execute this round. Selected edicts will lock in when the reflex phase begins.',
+    action: null,
+  },
   {
     key: 'reflex',
@@
 export default function Pulsar() {
   const seed = useMemo(() => createSimulationSeed(), []);
   const [gameState, setGameState] = useState(seed.state);
   const [edictDeck, setEdictDeck] = useState(seed.deck);
   const [market, setMarket] = useState(seed.market);
   const [hand, setHand] = useState(seed.hand);
   const [discardPile, setDiscardPile] = useState([]);
-  const [selectedEdicts, setSelectedEdicts] = useState({ reflex: [], aftershock: [] });
+  const [selectedEdicts, setSelectedEdicts] = useState({ center: [], reflex: [], aftershock: [] });
   const [phaseIndex, setPhaseIndex] = useState(0);
   const [selectionLocked, setSelectionLocked] = useState(false);
+  const [pendingModals, setPendingModals] = useState([]);
 
   const currentPhase = ROUND_PHASES[phaseIndex];
-  const currentSelectionIds = selectedEdicts[currentPhase.key] ?? [];
+  const currentSelectionIds =
+    currentPhase.key === 'reflex' || currentPhase.key === 'aftershock'
+      ? selectedEdicts.center.filter((id) => {
+          const card = hand.find((item) => item.instanceId === id);
+          if (!card) return false;
+          return currentPhase.key === 'reflex' ? card.timing === '→P' : card.timing === 'P→';
+        })
+      : selectedEdicts[currentPhase.key] ?? [];
 
   const advancePhase = () => {
     const phase = ROUND_PHASES[phaseIndex];
-    if (!phase.action || gameState.status !== 'in-progress') {
+    if (gameState.status !== 'in-progress') {
       return;
     }
-    const selectedIds = selectedEdicts[phase.key] ?? [];
-    const selectedCards = hand.filter((card) => selectedIds.includes(card.instanceId));
+    if (!phase.action) {
+      if (phase.key === 'center') {
+        logEvent(gameState, 'Centering complete. Reflex phase ready.');
+        setPhaseIndex((prev) => (prev + 1) % ROUND_PHASES.length);
+      }
+      return;
+    }
+
+    const selectedIds = currentSelectionIds;
+    const selectedCards = hand.filter((card) => selectedIds.includes(card.instanceId));
 
     const nextState = cloneState(gameState);
     const previousVictory = gameState.player.victoryTrack;
 
-    if (phase.key === 'reflex' && !selectionLocked) {
+    if (phase.key === 'reflex' && !selectionLocked) {
       setSelectionLocked(true);
     }
 
-    nextState.player.edicts = selectedCards.map(({ instanceId, ...rest }) => ({ ...rest }));
-
-    phase.action(nextState);
+    const executingCards = selectedCards.map(({ instanceId, ...rest }) => ({ ...rest }));
+    nextState.player.edicts = executingCards;
+
+    phase.action(nextState);
+    setPendingModals((prev) => [...prev, ...selectedCards]);
     if (phase.key === 'reload') {
       nextState.round += 1;
     }
     nextState.player.edicts = [];
@@
-    setSelectedEdicts((prev) => ({ ...prev, [phase.key]: [] }));
+    setSelectedEdicts((prev) => ({
+      ...prev,
+      [phase.key]: [],
+      ...(phase.key === 'reflex' || phase.key === 'aftershock'
+        ? { center: prev.center.filter((id) => !selectedIds.includes(id)) }
+        : {}),
+    }));
 
     if (phase.key === 'reload') {
-      setSelectedEdicts({ reflex: [], aftershock: [] });
+      setSelectedEdicts({ center: [], reflex: [], aftershock: [] });
       setSelectionLocked(false);
     }
*** End Patch
PATCH
