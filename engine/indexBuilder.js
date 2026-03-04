function makeTrieNode() {
  return { children: new Map(), words: [] };
}

export function buildIndexes(words) {
  const lengthIndex = new Map();
  const positionIndex = new Map();
  const frequency = new Map();
  const trie = makeTrieNode();

  for (const word of words) {
    if (!lengthIndex.has(word.length)) lengthIndex.set(word.length, []);
    lengthIndex.get(word.length).push(word);

    for (let i = 0; i < word.length; i += 1) {
      const key = `${word.length}:${i}:${word[i]}`;
      if (!positionIndex.has(key)) positionIndex.set(key, []);
      positionIndex.get(key).push(word);

      frequency.set(word[i], (frequency.get(word[i]) ?? 0) + 1);
    }

    let node = trie;
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, makeTrieNode());
      node = node.children.get(ch);
      node.words.push(word);
    }
  }

  return { lengthIndex, positionIndex, prefixTrie: trie, letterFrequency: frequency };
}

export function trieWordsWithPrefix(trie, prefix) {
  let node = trie;
  for (const ch of prefix) {
    if (!node.children.has(ch)) return [];
    node = node.children.get(ch);
  }
  return node.words ?? [];
}
