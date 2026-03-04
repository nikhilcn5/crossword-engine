import { loadDatasetConfig, loadDatasets, loadEngineConfig, normalizeWords } from '../engine/dictionaryLoader.js';
import { buildIndexes } from '../engine/indexBuilder.js';
import { buildClueSelector, buildPuzzleClues } from '../engine/clueEngine.js';
import { generateCrossword } from '../engine/crosswordSolver.js';
import { createKeyboardController } from './keyboardController.js';
import { PuzzleTimer } from './timer.js';
import { refreshHighlights, renderClues, renderGrid } from './gridUI.js';

const appState = {
  config: null,
  datasetConfig: null,
  indexes: null,
  cluePicker: null,
  puzzle: null,
  state: null,
};

function createEntries(size, solutionGrid) {
  return Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => (solutionGrid[r][c] === '#' ? '#' : '')));
}

function selectClueForCell(puzzle, row, col, direction) {
  return puzzle.clues.find((clue) => clue.direction === direction && clue.cells.some(([r, c]) => r === row && c === col))
      ?? puzzle.clues.find((clue) => clue.cells.some(([r, c]) => r === row && c === col));
}

function isSolved(puzzle, state) {
  for (let r = 0; r < puzzle.size; r += 1) {
    for (let c = 0; c < puzzle.size; c += 1) {
      if (puzzle.solutionGrid[r][c] === '#') continue;
      if (state.entries[r][c] !== puzzle.solutionGrid[r][c]) return false;
    }
  }
  return true;
}

async function init() {
  const status = document.querySelector('#status');
  const timerEl = document.querySelector('#timer');
  const completion = document.querySelector('#completion');
  const gridContainer = document.querySelector('#grid');
  const acrossEl = document.querySelector('#across-clues');
  const downEl = document.querySelector('#down-clues');
  const difficultyEl = document.querySelector('#difficulty');
  const sizeEl = document.querySelector('#grid-size');

  status.textContent = 'Loading datasets...';

  appState.config = await loadEngineConfig();
  appState.datasetConfig = await loadDatasetConfig();

  const { rawWords, clues } = await loadDatasets(appState.config);
  const words = normalizeWords(rawWords, appState.config.dictionary);
  appState.indexes = buildIndexes(words);
  appState.cluePicker = buildClueSelector(clues);

  const timer = new PuzzleTimer((text) => {
    timerEl.textContent = text;
  });

  const rerender = () => {
    renderGrid(gridContainer, appState.puzzle, appState.state, (r, c) => {
      appState.state.activeCell = [r, c];
      appState.state.activeClue = selectClueForCell(appState.puzzle, r, c, appState.state.direction);
      if (appState.state.activeClue) appState.state.direction = appState.state.activeClue.direction;
      rerender();
    });

    renderClues(acrossEl, downEl, appState.puzzle, appState.state, (clue) => {
      appState.state.activeClue = clue;
      appState.state.direction = clue.direction;
      appState.state.activeCell = [...clue.cells[0]];
      rerender();
    });

    refreshHighlights(gridContainer, appState.puzzle, appState.state);

    if (isSolved(appState.puzzle, appState.state)) {
      timer.stop();
      completion.textContent = `Solved! Completed in ${timerEl.textContent}.`;
    }
  };


  function bindKeyboard() {
    document.onkeydown = (event) => {
      const mutableController = createKeyboardController({
        state: appState.state,
        puzzle: appState.puzzle,
        onUpdate: rerender,
      });
      mutableController(event);
    };
  }

  async function generatePuzzle() {
    completion.textContent = '';
    const size = Number(sizeEl.value);
    const difficulty = difficultyEl.value;

    status.textContent = `Generating ${size}x${size} puzzle...`;
    const result = generateCrossword(size, appState.indexes, appState.config);

    if (!result.success) {
      status.textContent = `Generation failed (${Math.round(result.elapsedMs)}ms). Retry.`;
      return;
    }

    const clues = buildPuzzleClues(result.slots, result.assignments, appState.cluePicker, difficulty);
    appState.puzzle = {
      size,
      clues,
      solutionGrid: result.grid,
    };

    const firstClue = clues[0];
    appState.state = {
      entries: createEntries(size, result.grid),
      activeCell: [...firstClue.cells[0]],
      activeClue: firstClue,
      direction: firstClue.direction,
    };

    bindKeyboard();
    timer.start();
    rerender();
    status.textContent = `Generated in ${Math.round(result.elapsedMs)}ms with ${clues.length} clues.`;
  }

  document.querySelector('#generate-btn').addEventListener('click', generatePuzzle);
  document.querySelector('#reveal-letter-btn').addEventListener('click', () => {
    const [r, c] = appState.state.activeCell;
    appState.state.entries[r][c] = appState.puzzle.solutionGrid[r][c];
    rerender();
  });
  document.querySelector('#reveal-word-btn').addEventListener('click', () => {
    for (const [r, c] of appState.state.activeClue.cells) {
      appState.state.entries[r][c] = appState.puzzle.solutionGrid[r][c];
    }
    rerender();
  });
  document.querySelector('#reveal-puzzle-btn').addEventListener('click', () => {
    for (let r = 0; r < appState.puzzle.size; r += 1) {
      for (let c = 0; c < appState.puzzle.size; c += 1) {
        if (appState.puzzle.solutionGrid[r][c] !== '#') appState.state.entries[r][c] = appState.puzzle.solutionGrid[r][c];
      }
    }
    rerender();
  });

  status.textContent = `Ready. Loaded ${appState.indexes.lengthIndex.size} word lengths.`;
  await generatePuzzle();
}

init().catch((error) => {
  const status = document.querySelector('#status');
  status.textContent = `Initialization failed: ${error.message}`;
  // eslint-disable-next-line no-console
  console.error(error);
});
