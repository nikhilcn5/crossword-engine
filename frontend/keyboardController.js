export function createKeyboardController({ state, puzzle, onUpdate }) {
  function moveWithinClue(step) {
    if (!state.activeClue) return;
    const cells = state.activeClue.cells;
    let index = cells.findIndex(([r, c]) => r === state.activeCell[0] && c === state.activeCell[1]);
    if (index === -1) index = 0;
    index = Math.max(0, Math.min(cells.length - 1, index + step));
    state.activeCell = [...cells[index]];
  }

  function switchDirection() {
    const [r, c] = state.activeCell;
    const nextDirection = state.direction === 'across' ? 'down' : 'across';
    const clue = puzzle.clues.find((entry) => entry.direction === nextDirection && entry.cells.some(([rr, cc]) => rr === r && cc === c));
    if (clue) {
      state.direction = nextDirection;
      state.activeClue = clue;
    }
  }

  function gotoNextClue() {
    const sameDirection = puzzle.clues.filter((clue) => clue.direction === state.direction);
    const current = sameDirection.findIndex((clue) => clue.id === state.activeClue?.id);
    const next = sameDirection[(current + 1) % sameDirection.length] ?? sameDirection[0];
    if (next) {
      state.activeClue = next;
      state.activeCell = [...next.cells[0]];
    }
  }

  function inputLetter(letter) {
    const [r, c] = state.activeCell;
    state.entries[r][c] = letter;
    moveWithinClue(1);
  }

  function backspace() {
    const [r, c] = state.activeCell;
    if (state.entries[r][c]) {
      state.entries[r][c] = '';
    } else {
      moveWithinClue(-1);
      const [nr, nc] = state.activeCell;
      state.entries[nr][nc] = '';
    }
  }

  return function onKeyDown(event) {
    const key = event.key;
    if (/^[a-zA-Z]$/.test(key)) {
      inputLetter(key.toUpperCase());
    } else if (key === 'ArrowRight' || key === 'ArrowDown') {
      moveWithinClue(1);
    } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
      moveWithinClue(-1);
    } else if (key === 'Tab') {
      event.preventDefault();
      gotoNextClue();
    } else if (key === 'Enter') {
      switchDirection();
    } else if (key === 'Backspace') {
      backspace();
    } else {
      return;
    }

    event.preventDefault();
    onUpdate();
  };
}
