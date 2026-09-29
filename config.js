/* Change rules here, then reload and start a new game. */
const GAME_CONFIG = Object.freeze({
  boardRadius: 3,
  minimumWordLength: 3,
  startingTerritories: 3,
  maxEnemyTilesPerWord: 1,
  turnsPerPlayer: 15,
  normalTerritoryPoints: 1,
  castlePoints: 3,
  castleCount: 3,
  dictionaryEnabled: false,
  letterWeights: { A:8.2, B:1.5, C:2.8, D:4.3, E:12.7, F:2.2, G:2, H:6.1, I:7, J:0.15, K:0.8, L:4, M:2.4, N:6.7, O:7.5, P:1.9, Q:0.1, R:6, S:6.3, T:9.1, U:2.8, V:1, W:2.4, X:0.15, Y:2, Z:0.07 }
});
if (typeof module !== 'undefined') module.exports = GAME_CONFIG;
