// AI同士で大量に対戦させてエンジンの健全性を確認
import { createGame, applyAction, randomDeck, validateDeck, viewFor } from '../public/engine.js';
import { aiNextAction } from '../public/ai.js';
import { COLLECTIBLE } from '../public/cards.js';

let wins = [0, 0, 0], turns = 0;
const N = 2000;
for (let g = 0; g < N; g++) {
  const decks = [randomDeck(), randomDeck(['N'])];
  for (const d of decks) { const e = validateDeck(d); if (e) throw new Error(e); }
  const s = createGame(decks, ['A', 'B']);
  let steps = 0;
  while (!s.over) {
    const a = aiNextAction(s, s.turn);
    const r = applyAction(s, s.turn, a);
    if (r.error) throw new Error(`AI illegal action ${JSON.stringify(a)}: ${r.error}`);
    viewFor(s, 0);
    if (++steps > 3000) throw new Error('game did not end');
  }
  wins[s.winner === -1 ? 2 : s.winner]++;
  turns += s.turnNo;
}
console.log(`games=${N} fullDeck wins=${wins[0]} Nonly wins=${wins[1]} draws=${wins[2]} avgTurns=${(turns / N).toFixed(1)} cards=${COLLECTIBLE.length}`);
