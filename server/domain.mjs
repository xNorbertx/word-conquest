import Engine from './engine.mjs';
import {configFor} from './rules.mjs';
export {config,configFor,RULES_VERSION,LEGACY_RULES_VERSION,SUPPORTED_RULES,rulesLabel,captureRule,castleRule} from './rules.mjs';
export { Engine };
export class Fault extends Error {
  constructor(code, message, status = 400) { super(message); this.code = code; this.status = status; }
}
const fail = (code, message, status) => { throw new Fault(code, message, status); };
export const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export function checkCommand(input) {
  if (!input || !uuid(input.operationId) || !Number.isSafeInteger(input.revision) || input.revision < 0)
    fail('invalid_command', 'A saved operation ID and board revision are required.');
  if (!['word','refresh','resign','offer_draw','accept_draw','abandon'].includes(input.action))
    fail('invalid_action', 'Unknown game action.');
  if (input.action === 'word') {
    if (!Array.isArray(input.path) || input.path.length > 69 || input.path.some(id => typeof id !== 'string' || id.length > 12))
      fail('invalid_path', 'Choose a path on the board.');
    if (input.jokers && (typeof input.jokers !== 'object' || Array.isArray(input.jokers) ||
      Object.entries(input.jokers).some(([k,v]) => k.length > 12 || typeof v !== 'string' || !/^[A-Z]$/.test(v))))
      fail('invalid_joker', 'Each joker needs one A–Z letter.');
  }
}
// Stable receipt fingerprint excludes all untrusted fields that cannot affect a move.
export function commandKey(input) {
  return JSON.stringify({action: input.action, revision: input.revision,
    path: input.action === 'word' ? input.path : [],
    jokers: input.action === 'word' ? Object.fromEntries(Object.entries(input.jokers || {}).sort(([a],[b]) => a.localeCompare(b))) : {}});
}
export function applyCommand(game, actor, input, dictionary, dictionaryVersion, random = Math.random, now = new Date()) {
  checkCommand(input);
  const seat = game.players.indexOf(actor) + 1;
  if (!seat) fail('forbidden', 'This game belongs to its players.', 403);
  if (game.revision !== input.revision) fail('stale', 'A newer turn is available. Reload the board before choosing a move.', 409);
  if (game.status !== 'active' || game.state.over) fail('ended', 'This game is not active.', 409);
  const config=configFor(game.rules_version);
  if (!config || game.dictionary_version !== dictionaryVersion)
    fail('version_unavailable', 'This game needs its original rules and dictionary. Contact support.', 503);
  const next = {...game, state: structuredClone(game.state), draw_by: game.draw_by || null};
  const before = game.state;
  let captured = [], refreshed = [], score = null;
  if (input.action === 'word' || input.action === 'refresh') {
    if (before.player !== seat) fail('not_your_turn', 'Waiting for your friend’s turn.', 409);
    if (!dictionary || dictionary.size < 1000) fail('dictionary_unavailable', 'The dictionary is temporarily unavailable. Your turn was not spent.', 503);
    const result = input.action === 'word'
      ? Engine.submit(before, input.path, config, dictionary, input.jokers || {}, random)
      : Engine.refreshTurn(before, config, random);
    if (result.error) fail('illegal_move', result.error);
    next.state = result.state; captured = result.captured; refreshed = result.refreshed;
    score = next.state.log[0].scoring || null;
    next.draw_by = null; next.last_play_at = now.toISOString();
    if (next.state.over) {
      const totals = Engine.scores(next.state, config);
      next.result = totals[0] === totals[1] ? 'draw' : String(totals[0] > totals[1] ? 1 : 2);
      next.status = 'completed';
    }
  } else if (input.action === 'resign') {
    next.state.over = true; next.status = 'completed'; next.result = String(3 - seat);
  } else if (input.action === 'offer_draw') {
    if (game.draw_by) fail('draw_pending', 'A draw offer is already pending.', 409);
    next.draw_by = actor;
  } else if (input.action === 'accept_draw') {
    if (!game.draw_by || game.draw_by === actor) fail('no_draw_offer', 'Your friend must offer the draw first.', 409);
    next.state.over = true; next.status = 'completed'; next.result = 'draw';
  } else if (input.action === 'abandon') {
    if (now.getTime() - new Date(game.last_play_at).getTime() < 30 * 86400000)
      fail('not_inactive', 'Abandonment is available after 30 days without a turn. You can resign now.');
    next.state.over = true; next.status = 'abandoned'; next.result = null;
  }
  next.revision = game.revision + 1;
  const changed = next.state.tiles.filter(t => {
    const old = before.tiles.find(x => x.id === t.id);
    return old.letter !== t.letter || old.owner !== t.owner;
  }).map(t => ({id: t.id, before: before.tiles.find(x => x.id === t.id), after: t}));
  const recap = {action: input.action, player: seat, at: now.toISOString(),
    word: input.action === 'word' ? Engine.wordForPath(before, input.path, input.jokers || {}) : null,
    path: input.path || [], captured, refreshed, changed, score,
    ...(config.castleIncome && ['word','refresh'].includes(input.action)?{income:next.state.log[0].income,roundComplete:next.state.log[0].roundComplete,round:next.state.log[0].round}:{}),
    totalsBefore: Engine.scores(before, config), totalsAfter: Engine.scores(next.state, config)};
  return {next, recap};
}

export function statistics(games, actor) {
  const groups = {};
  for (const game of games) {
    const seat = game.players.indexOf(actor) + 1;
    if (!seat || game.status !== 'completed') continue;
    const config=configFor(game.rules_version);
    if(!config)fail('version_unavailable','This game needs its original rules and dictionary. Contact support.',503);
    const key = `${game.rules_version}/${game.dictionary_version}`;
    const s = groups[key] ||= {games:0,wins:0,losses:0,draws:0,highestFinalScore:0,bestTurn:0,bestWord:''};
    s.games++;
    if (game.result === 'draw') s.draws++;
    else if (game.result === String(seat)) s.wins++;
    else s.losses++;
    s.highestFinalScore = Math.max(s.highestFinalScore, Engine.scores(game.state, config)[seat-1]);
    for (const turn of game.state.log) if (turn.player === seat && turn.scoring?.wordPoints > s.bestTurn) {
      s.bestTurn = turn.scoring.wordPoints; s.bestWord = turn.word;
    }
  }
  return groups;
}
