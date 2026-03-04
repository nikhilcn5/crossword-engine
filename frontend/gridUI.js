export function renderGrid(container, puzzle, state, onCellFocus) {
  container.innerHTML = '';
  container.style.setProperty('--grid-size', puzzle.size);

  const numberMap = new Map();
  for (const clue of puzzle.clues) {
    const key = `${clue.row},${clue.col}`;
    if (!numberMap.has(key)) numberMap.set(key, clue.number);
  }

  for (let r = 0; r < puzzle.size; r += 1) {
    for (let c = 0; c < puzzle.size; c += 1) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;

      if (puzzle.solutionGrid[r][c] === '#') {
        cell.classList.add('black');
        container.appendChild(cell);
        continue;
      }

      const key = `${r},${c}`;
      if (numberMap.has(key)) {
        const number = document.createElement('span');
        number.className = 'number';
        number.textContent = numberMap.get(key);
        cell.appendChild(number);
      }

      const value = document.createElement('span');
      value.className = 'value';
      value.textContent = state.entries[r][c] || '';
      cell.appendChild(value);

      cell.tabIndex = 0;
      cell.addEventListener('click', () => onCellFocus(r, c));
      container.appendChild(cell);
    }
  }
}

export function refreshHighlights(container, puzzle, state) {
  const activeSet = new Set(state.activeClue?.cells?.map(([r, c]) => `${r},${c}`) ?? []);
  const activeCellKey = `${state.activeCell[0]},${state.activeCell[1]}`;

  container.querySelectorAll('.cell').forEach((cell) => {
    const key = `${cell.dataset.row},${cell.dataset.col}`;
    cell.classList.toggle('active-word', activeSet.has(key));
    cell.classList.toggle('active-cell', key === activeCellKey);
  });
}

export function renderClues(containerAcross, containerDown, puzzle, state, onClueSelect) {
  const fillPanel = (container, clues) => {
    container.innerHTML = '';
    clues.forEach((clue) => {
      const item = document.createElement('button');
      item.className = 'clue-item';
      item.textContent = `${clue.number}. ${clue.clue}`;
      item.dataset.id = clue.id;
      item.addEventListener('click', () => onClueSelect(clue));
      if (state.activeClue?.id === clue.id) item.classList.add('selected');
      container.appendChild(item);
    });
  };

  fillPanel(containerAcross, puzzle.clues.filter((c) => c.direction === 'across'));
  fillPanel(containerDown, puzzle.clues.filter((c) => c.direction === 'down'));
}
