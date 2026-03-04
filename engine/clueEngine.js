function sanitizeClue(clue, answer) {
  if (!clue) return null;
  const lowerAnswer = answer.toLowerCase();
  if (clue.toLowerCase().includes(lowerAnswer)) return null;
  return clue.length > 100 ? `${clue.slice(0, 96)}...` : clue;
}

function fallbackClue(answer, direction, difficulty) {
  if (difficulty === 'easy') return `Common ${answer.length}-letter ${direction} entry.`;
  if (difficulty === 'medium') return `${answer.length}-letter word; fill from crossings.`;
  return `Theme-free ${answer.length}-letter answer.`;
}

export function buildClueSelector(clueDataset) {
  const curated = new Map();

  if (Array.isArray(clueDataset)) {
    for (const item of clueDataset) {
      if (!item?.answer || !item?.clue) continue;
      const key = item.answer.toUpperCase();
      if (!curated.has(key)) curated.set(key, []);
      curated.get(key).push(item.clue);
    }
  } else if (typeof clueDataset === 'object' && clueDataset) {
    for (const [answer, clues] of Object.entries(clueDataset)) {
      const key = answer.toUpperCase();
      curated.set(key, Array.isArray(clues) ? clues : [clues]);
    }
  }

  return function pickClue(answer, usedClues, direction, difficulty) {
    const candidates = curated.get(answer) ?? [];
    for (const candidate of candidates) {
      const clue = sanitizeClue(candidate, answer);
      if (clue && !usedClues.has(clue)) return clue;
    }

    const dictionaryDefinition = answer.length > 6
      ? `Long word meaning related to "${answer[0]}...".`
      : null;

    const cleanDefinition = sanitizeClue(dictionaryDefinition, answer);
    if (cleanDefinition && !usedClues.has(cleanDefinition)) return cleanDefinition;

    let fallback = fallbackClue(answer, direction, difficulty);
    while (usedClues.has(fallback)) {
      fallback = `${fallbackClue(answer, direction, difficulty)} (${Math.floor(Math.random() * 9) + 1})`;
    }
    return fallback;
  };
}

export function buildPuzzleClues(slots, assignments, cluePicker, difficulty) {
  const usedClues = new Set();

  return slots.map((slot) => {
    const answer = assignments.get(slot.id);
    const clue = cluePicker(answer, usedClues, slot.direction, difficulty);
    usedClues.add(clue);
    return {
      id: slot.id,
      number: slot.number,
      direction: slot.direction,
      answer,
      clue,
      row: slot.row,
      col: slot.col,
      length: slot.length,
      cells: slot.cells,
    };
  });
}
