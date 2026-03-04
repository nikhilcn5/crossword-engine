export function createGrid(size) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => ''));
}

export function placeBlackSquares(grid, allowBlackSquares) {
  if (!allowBlackSquares) return;
  const size = grid.length;
  const maxBlocks = Math.floor(size / 2);
  let placed = 0;

  for (let r = 0; r < size && placed < maxBlocks; r += 1) {
    for (let c = 0; c < size && placed < maxBlocks; c += 1) {
      const onEdge = r === 0 || c === 0 || r === size - 1 || c === size - 1;
      const safeSpacing = r % 2 === 1 && c % 2 === 1;
      if (onEdge || !safeSpacing) continue;
      if (Math.random() < 0.12) {
        grid[r][c] = '#';
        placed += 1;
      }
    }
  }
}

function isStartOfAcross(grid, row, col) {
  if (grid[row][col] === '#') return false;
  if (col > 0 && grid[row][col - 1] !== '#') return false;
  return col + 1 < grid.length && grid[row][col + 1] !== '#';
}

function isStartOfDown(grid, row, col) {
  if (grid[row][col] === '#') return false;
  if (row > 0 && grid[row - 1][col] !== '#') return false;
  return row + 1 < grid.length && grid[row + 1][col] !== '#';
}

export function detectSlots(grid, minWordLength = 3) {
  const slots = [];
  let clueNumber = 1;

  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid.length; c += 1) {
      if (grid[r][c] === '#') continue;

      const startsAcross = isStartOfAcross(grid, r, c);
      const startsDown = isStartOfDown(grid, r, c);
      if (!startsAcross && !startsDown) continue;

      const number = clueNumber;
      clueNumber += 1;

      if (startsAcross) {
        const cells = [];
        let cc = c;
        while (cc < grid.length && grid[r][cc] !== '#') {
          cells.push([r, cc]);
          cc += 1;
        }
        if (cells.length >= minWordLength) {
          slots.push({ id: `A-${r}-${c}`, number, direction: 'across', row: r, col: c, length: cells.length, cells });
        }
      }

      if (startsDown) {
        const cells = [];
        let rr = r;
        while (rr < grid.length && grid[rr][c] !== '#') {
          cells.push([rr, c]);
          rr += 1;
        }
        if (cells.length >= minWordLength) {
          slots.push({ id: `D-${r}-${c}`, number, direction: 'down', row: r, col: c, length: cells.length, cells });
        }
      }
    }
  }

  return slots;
}

export function cloneGrid(grid) {
  return grid.map((row) => [...row]);
}
