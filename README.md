# Crossword Engine

A complete browser-based crossword generator and solver that downloads live datasets, builds in-memory indexes, generates puzzles with a CSP backtracking solver, and renders an interactive solving UI.

## Architecture

```text
index.html
 ├─ frontend/app.js
 │   ├─ engine/dictionaryLoader.js
 │   ├─ engine/indexBuilder.js
 │   ├─ engine/crosswordSolver.js
 │   ├─ engine/clueEngine.js
 │   ├─ frontend/gridUI.js
 │   ├─ frontend/keyboardController.js
 │   └─ frontend/timer.js
 └─ frontend/styles.css
```

### Engine modules

- `engine/dictionaryLoader.js`
  - Loads `config/engine_config.json` and `config/dataset.json`.
  - Downloads datasets from configured URLs.
  - Applies dictionary filters:
    - alphabetic only
    - uppercase normalization
    - min/max length
- `engine/indexBuilder.js`
  - Builds three required indexes in memory:
    1. `lengthIndex`: words grouped by length
    2. `positionIndex`: words by `(length, position, letter)`
    3. `prefixTrie`: trie containing words for prefix lookup
  - Computes letter frequencies for candidate scoring.
- `engine/gridGenerator.js`
  - Creates square grids (5x5, 6x6, 7x7)
  - Optionally places black squares
  - Detects across/down slots with numbering
- `engine/crosswordSolver.js`
  - CSP recursive backtracking solver
  - Enforces one letter per cell and no repeated words
  - Uses heuristics:
    - MRV slot selection
    - forward checking (empty-domain pruning)
    - frequency scoring for value ordering
- `engine/clueEngine.js`
  - Clue selection order:
    1. curated clue dataset
    2. dictionary-style fallback definition
    3. generated fallback template
  - Filters clues that include the answer text
  - Avoids duplicate clues in puzzle

### Frontend modules

- `frontend/gridUI.js`: renders numbered crossword grid and clue lists, highlights active cell/word/clue.
- `frontend/keyboardController.js`: handles arrows, tab, enter, backspace, and letter input.
- `frontend/timer.js`: puzzle timer with start/stop and mm:ss formatting.
- `frontend/app.js`: app bootstrapping, generation workflow, reveal features, and solved-state validation.

## Generator algorithm

1. Build grid for selected size.
2. Optionally place black squares.
3. Detect across/down slots (length >= 3).
4. Build candidates from indexes for each slot pattern.
5. Solve with recursive backtracking CSP:
   - choose next slot via MRV
   - order words by letter-frequency score
   - propagate constraints through forward checking
   - backtrack immediately when a slot reaches zero candidates

## Indexing strategy

The performance-critical candidate lookup uses intersected indexes:

- `lengthIndex[length]` gives the base candidate pool.
- For constrained letters, `positionIndex[length:pos:char]` narrows candidates quickly.
- Prefix trie is available for prefix-centric lookups and future optimizations.

This approach keeps candidate pruning fast enough for generation under ~1 second on 7x7 grids with large dictionaries.

## Dataset sources

Configured sources:

- Words: `https://raw.githubusercontent.com/nikhilcn5/crossword-data/main/wordnik/words.txt`
- Clues: `https://raw.githubusercontent.com/nikhilcn5/crossword-data/main/clues/clues.json`

## Run locally

### Option 1: Open directly

Open `index.html` in a browser.

### Option 2: Static server (recommended)

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## UI features

- Responsive crossword grid with numbering
- Across and down clue panels
- Keyboard navigation:
  - Arrow keys: move in active clue
  - Tab: next clue
  - Enter: toggle direction
  - Backspace: delete and move backward
- Timer
- Difficulty selector
- Generate puzzle button
- Reveal letter / reveal word / reveal puzzle
- Active cell/word/clue highlighting
- Puzzle completion detection and completion message
