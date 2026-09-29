/* Change rules here, then reload and start a new game. */
const GAME_CONFIG = Object.freeze({
  boardRadius: 4,
  // 9 × 9 with two layers trimmed from each corner = 69 tiles.
  cornerCut: 2,
  // Generation categories only; territory scoring is unchanged.
  letterBalance: {
    vowels: 'AEIOU',
    flexible: 'RSTLN',
    ordinary: 'BCDFGHKMPVWY',
    rare: 'JQXZ',
    vowelShare: 0.36,
    flexibleShare: 0.38,
    rareMinBatch: 10,
    rareMaxShare: 0.08,
    rareBatchChance: 0.35,
    placementAttempts: 24
  },
  jokerCount: 6,
  minimumWordLength: 3,
  startingTerritories: 3,
  maxEnemyTilesPerWord: 3,
  turnsPerPlayer: 12,
  endCondition: 'letters', // 'turns' restores the fixed-turn experiment.
  letterBudget: 120,
  refreshMinimumLetterCost: 3,
  refreshUsedLetters: true,
  allowRefreshTurn: true,
  allowReentry: true,
  normalTerritoryPoints: 1,
  castlePoints: 3,
  // Scoring is independent of board generation categories.
  wordScoring: {
    letterGroups: [
      { letters: 'AEIOURSTLN', points: 1 },
      { letters: 'BCDFGHKMPVWY', points: 2 },
      { letters: 'JQXZ', points: 4 }
    ],
    jokerPoints: 0,
    lengthBonuses: [0, 0, 0, 0, 1, 3, 6, 10, 15],
    extraLetterBonus: 6
  },
  castleCount: 5,
  dictionaryEnabled: false,
  letterWeights: { A:8.2, B:1.5, C:2.8, D:4.3, E:12.7, F:2.2, G:2, H:6.1, I:7, J:0.15, K:0.8, L:4, M:2.4, N:6.7, O:7.5, P:1.9, Q:0.1, R:6, S:6.3, T:9.1, U:2.8, V:1, W:2.4, X:0.15, Y:2, Z:0.07 }
});
if (typeof module !== 'undefined') module.exports = GAME_CONFIG;

export default GAME_CONFIG;
