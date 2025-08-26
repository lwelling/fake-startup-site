const shapePatterns = {
  block: ["OO", "OO"],
  beehive: [".OO.", "O..O", ".OO."],
  loaf: [".OO.", "O..O", ".O.O", "..O."],
  boat: ["OO.", "O.O", ".O."],
  tub: [".O.", "O.O", ".O."],
  blinker: ["OOO"],
  toad: [".OOO", "OOO."],
  beacon: ["OO..", "OO..", "..OO", "..OO"],
  pulsar: [
    "..OOO...OOO..",
    ".............",
    "O....O.O....O",
    "O....O.O....O",
    "O....O.O....O",
    "..OOO...OOO..",
    ".............",
    "..OOO...OOO..",
    "O....O.O....O",
    "O....O.O....O",
    "O....O.O....O",
    ".............",
    "..OOO...OOO..",
  ],
  "penta-decathlon": [
    ".O.",
    "OOO",
    ".O.",
    ".O.",
    ".O.",
    ".O.",
    ".O.",
    ".O.",
    "OOO",
    ".O.",
  ],
  glider: [".O.", "..O", "OOO"],
  lwss: [".O..O", "O....", "O...O", "OOOO."],
  mwss: ["..O..O", "O.....", "O....O", "OOOOO.", ".O..O."],
  hwss: ["..O...O", "O......", "O.....O", "OOOOOO.", ".OO..O."],
};

const patternToCoords = (pattern) => {
  const coords = [];
  pattern.forEach((row, r) => {
    row.split('').forEach((cell, c) => {
      if (cell === 'O') coords.push([r, c]);
    });
  });
  return coords;
};

const shapes = Object.fromEntries(
  Object.entries(shapePatterns).map(([name, pattern]) => [name, patternToCoords(pattern)])
);

export { shapePatterns, shapes };
