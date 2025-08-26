export function computeRuleSets(N) {
  const birth = Math.round(0.375 * N);
  const surviveMin = Math.ceil(0.25 * N);
  const surviveMax = Math.round(0.375 * N);
  const surviveSet = [];
  for (let k = surviveMin; k <= surviveMax; k++) {
    surviveSet.push(k);
  }
  const birthSet = [birth];
  const ruleText = `B${birthSet.join(',')}/S${surviveSet.join('-')}`;
  return { birthSet, surviveSet, ruleText };
}

export function squareNeighbors(grid, i, j, wrap) {
  const deltas = [
    [0, 1],[0, -1],[1, 0],[-1, 0],[1, 1],[1, -1],[-1, 1],[-1, -1],
  ];
  const rows = grid.length;
  const cols = grid[0].length;
  let count = 0;
  for (const [dx, dy] of deltas) {
    let x = i + dx;
    let y = j + dy;
    if (wrap) {
      x = (x + rows) % rows;
      y = (y + cols) % cols;
    }
    if (x >= 0 && x < rows && y >= 0 && y < cols) {
      count += grid[x][y];
    }
  }
  return count;
}

export function hexNeighbors(grid, i, j, wrap) {
  const rows = grid.length;
  const cols = grid[0].length;
  const even = j % 2 === 0;
  const deltas = even
    ? [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1]]
    : [[-1,0],[1,0],[0,-1],[0,1],[1,-1],[1,1]];
  let count = 0;
  for (const [dx, dy] of deltas) {
    let x = i + dx;
    let y = j + dy;
    if (wrap) {
      x = (x + rows) % rows;
      y = (y + cols) % cols;
    }
    if (x >= 0 && x < rows && y >= 0 && y < cols) {
      count += grid[x][y];
    }
  }
  return count;
}

export function triNeighbors(grid, i, j, includeVertices, wrap) {
  const rows = grid.length;
  const cols = grid[0].length;
  const up = (i + j) % 2 === 0;
  let deltas;
  if (!includeVertices) {
    deltas = up ? [[0,-1],[0,1],[-1,0]] : [[0,-1],[0,1],[1,0]];
  } else {
    if (up) {
      deltas = [
        [0,-1],[0,1],[-1,0],
        [-1,-1],[0,-2],[1,-1],
        [-1,1],[0,2],[1,1],
        [-2,0],[-1,-2],[-1,2],
      ];
    } else {
      deltas = [
        [0,-1],[0,1],[1,0],
        [1,-1],[0,-2],[-1,-1],
        [1,1],[0,2],[-1,1],
        [2,0],[1,-2],[1,2],
      ];
    }
  }
  let count = 0;
  for (const [dx, dy] of deltas) {
    let x = i + dx;
    let y = j + dy;
    if (wrap) {
      x = (x + rows) % rows;
      y = (y + cols) % cols;
    }
    if (x >= 0 && x < rows && y >= 0 && y < cols) {
      count += grid[x][y];
    }
  }
  return count;
}

export function getNeighborFunction(shape, triMode) {
  if (shape === 4) return { N:8, fn: squareNeighbors };
  if (shape === 6) return { N:6, fn: hexNeighbors };
  if (shape === 3 && triMode) return { N:12, fn: (g,i,j,w)=>triNeighbors(g,i,j,true,w) };
  return { N:3, fn: (g,i,j,w)=>triNeighbors(g,i,j,false,w) };
}
