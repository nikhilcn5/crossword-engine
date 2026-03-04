export async function loadEngineConfig() {
  const fallback = {
    datasets: {
      words: 'https://raw.githubusercontent.com/nikhilcn5/crossword-data/main/wordnik/words.txt',
      clues: 'https://raw.githubusercontent.com/nikhilcn5/crossword-data/main/clues/clues.json',
    },
    dictionary: {
      minLength: 3,
      maxLength: 10,
      uppercase: true,
      alphabeticOnly: true,
    },
    grid: {
      sizes: [5, 6, 7],
      allowBlackSquares: true,
      symmetry: false,
    },
    rules: {
      noRepeatedWords: true,
      singleLetterCells: true,
      rebusAllowed: false,
      minWordLength: 3,
    },
    solver: {
      algorithm: 'CSP',
      heuristics: ['minimumRemainingValues', 'forwardChecking', 'frequencyScoring'],
    },
    difficulty: {
      easyFrequencyThreshold: 5,
      mediumFrequencyThreshold: 3,
    },
  };

  try {
    const response = await fetch('./config/engine_config.json');
    if (!response.ok) throw new Error(`Failed loading config: ${response.status}`);
    return await response.json();
  } catch {
    return fallback;
  }
}

export async function loadDatasetConfig() {
  const fallback = {
    wordListURL: 'https://raw.githubusercontent.com/nikhilcn5/crossword-data/main/wordnik/words.txt',
    minWordLength: 3,
    maxWordLength: 10,
    gridSizes: [5, 6, 7],
    difficultyLevels: ['easy', 'medium', 'hard'],
  };

  try {
    const response = await fetch('./config/dataset.json');
    if (!response.ok) throw new Error(`Failed loading dataset config: ${response.status}`);
    return await response.json();
  } catch {
    return fallback;
  }
}

export async function loadDatasets(engineConfig) {
  const wordsResponse = await fetch(engineConfig.datasets.words);
  if (!wordsResponse.ok) {
    throw new Error(`Failed to download words: ${wordsResponse.status}`);
  }

  const rawWords = (await wordsResponse.text()).split(/\r?\n/).filter(Boolean);

  const cluesResponse = await fetch(engineConfig.datasets.clues);
  if (!cluesResponse.ok) {
    throw new Error(`Failed to download clues: ${cluesResponse.status}`);
  }
  const clues = await cluesResponse.json();

  return { rawWords, clues };
}

export function normalizeWords(rawWords, dictionaryRules) {
  const {
    minLength,
    maxLength,
    uppercase,
    alphabeticOnly,
  } = dictionaryRules;

  const alphaRegex = /^[A-Z]+$/;

  const words = rawWords
    .map((word) => (uppercase ? word.toUpperCase() : word))
    .filter((word) => word.length >= minLength && word.length <= maxLength)
    .filter((word) => (!alphabeticOnly ? true : alphaRegex.test(word)));

  return [...new Set(words)];
}
