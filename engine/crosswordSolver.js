import { cloneGrid, createGrid, detectSlots, placeBlackSquares } from './gridGenerator.js';

function getPatternForSlot(grid, slot) {
  return slot.cells.map(([r, c]) => (grid[r][c] === '' ? '.' : grid[r][c])).join('');
}

function scoreWord(word, letterFrequency) {
  return word.split('').reduce((sum, ch) => sum + (letterFrequency.get(ch) ?? 0), 0);
}

function candidatesFromPattern(slot, pattern, indexes, usedWords) {
  const base = indexes.lengthIndex.get(slot.length) ?? [];

  const constrainedPositions = [];
  for (let i = 0; i < pattern.length; i += 1) {
    if (pattern[i] !== '.') constrainedPositions.push([i, pattern[i]]);
  }

  if (constrainedPositions.length === 0) {
    return base.filter((word) => !usedWords.has(word));
  }

  const possibleSets = constrainedPositions.map(([idx, ch]) => {
    const key = `${slot.length}:${idx}:${ch}`;
    return indexes.positionIndex.get(key) ?? [];
  });

  possibleSets.sort((a, b) => a.length - b.length);

  let intersection = possibleSets[0] ?? [];
  for (let i = 1; i < possibleSets.length; i += 1) {
    const bucket = new Set(possibleSets[i]);
    intersection = intersection.filter((word) => bucket.has(word));
  }

  return intersection
    .filter((word) => !usedWords.has(word))
    .filter((word) => {
      for (let i = 0; i < pattern.length; i += 1) {
        if (pattern[i] !== '.' && word[i] !== pattern[i]) return false;
      }
      return true;
    })
    .sort((a, b) => scoreWord(b, indexes.letterFrequency) - scoreWord(a, indexes.letterFrequency));
}

function buildDomains(grid, slots, indexes, usedWords) {
  const domains = new Map();
  for (const slot of slots) {
    const pattern = getPatternForSlot(grid, slot);
    domains.set(slot.id, candidatesFromPattern(slot, pattern, indexes, usedWords));
  }
  return domains;
}

function selectNextSlot(slots, assignments, domains) {
  return slots
    .filter((slot) => !assignments.has(slot.id))
    .map((slot) => ({ slot, count: (domains.get(slot.id) ?? []).length }))
    .sort((a, b) => a.count - b.count)[0]?.slot;
}

function placeWord(grid, slot, word) {
  const changes = [];
  slot.cells.forEach(([r, c], idx) => {
    const prev = grid[r][c];
    if (prev !== word[idx]) {
      grid[r][c] = word[idx];
      changes.push([r, c, prev]);
    }
  });
  return changes;
}

function revertChanges(grid, changes) {
  for (const [r, c, prev] of changes) grid[r][c] = prev;
}

function hasEmptyDomain(domains, slots, assignments) {
  for (const slot of slots) {
    if (!assignments.has(slot.id) && (domains.get(slot.id) ?? []).length === 0) return true;
  }
  return false;
}

function backtrack({ grid, slots, indexes, assignments, usedWords }) {
  if (assignments.size === slots.length) return true;

  const domains = buildDomains(grid, slots, indexes, usedWords);
  if (hasEmptyDomain(domains, slots, assignments)) return false;

  const slot = selectNextSlot(slots, assignments, domains);
  if (!slot) return false;

  const candidates = domains.get(slot.id) ?? [];

  for (const word of candidates) {
    const changes = placeWord(grid, slot, word);
    assignments.set(slot.id, word);
    usedWords.add(word);

    const nextDomains = buildDomains(grid, slots, indexes, usedWords);
    if (!hasEmptyDomain(nextDomains, slots, assignments)) {
      if (backtrack({ grid, slots, indexes, assignments, usedWords })) return true;
    }

    usedWords.delete(word);
    assignments.delete(slot.id);
    revertChanges(grid, changes);
  }

  return false;
}

function prepareGrid(size, config) {
  let bestGrid = null;
  let bestSlots = [];

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const grid = createGrid(size);
    placeBlackSquares(grid, config.grid.allowBlackSquares);
    const slots = detectSlots(grid, config.rules.minWordLength);
    if (slots.length > bestSlots.length) {
      bestGrid = grid;
      bestSlots = slots;
    }
    if (slots.length >= size * 1.5) return { grid, slots };
  }

  return { grid: bestGrid ?? createGrid(size), slots: bestSlots };
}

export function generateCrossword(size, indexes, config) {
  const t0 = performance.now();
  const { grid, slots } = prepareGrid(size, config);

  const assignments = new Map();
  const usedWords = new Set();
  const solved = backtrack({
    grid,
    slots,
    indexes,
    assignments,
    usedWords,
  });

  if (!solved) {
    return {
      success: false,
      elapsedMs: performance.now() - t0,
      grid,
      slots,
      assignments,
    };
  }

  return {
    success: true,
    elapsedMs: performance.now() - t0,
    grid: cloneGrid(grid),
    slots,
    assignments,
  };
}
