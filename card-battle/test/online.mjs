// 2つのWebSocketクライアントでオンライン対戦を最後まで行う（wrangler dev 起動中に実行）
import { aiNextAction } from '../public/ai.js';
import { randomDeck } from '../public/engine.js';

const BASE = process.env.BASE || 'ws://localhost:8787';
const room = 'T' + Math.random().toString(36).slice(2, 7).toUpperCase();

function client(name) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${BASE}/ws/${room}`);
    let lastTurnKey = null, actions = 0;
    ws.onopen = () => ws.send(JSON.stringify({ t: 'join', name, deck: randomDeck() }));
    ws.onmessage = e => {
      const m = JSON.parse(e.data); if (process.env.DBG) console.log(name, m.t, m.v ? 'turn'+m.v.turn+' me'+m.v.me+' no'+m.v.turnNo : '');
      if (m.t === 'error') return reject(new Error(name + ': ' + m.msg));
      if (m.t !== 'state') return;
      const v = m.v;
      if (v.over) { ws.close(); return resolve({ name, winner: v.winner, me: v.me, turnNo: v.turnNo, actions }); }
      if (v.turn !== v.me) return;
      // 相手の手札は見えないが AI は自分の手札と盤面だけで動く
      let a; try { a = aiNextAction(v, v.me); } catch (err) { console.error(name, "AI threw", err, JSON.stringify(v)); process.exit(1); }
      actions++;
      ws.send(JSON.stringify({ t: 'action', a }));
    };
    ws.onerror = e => reject(new Error('ws error'));
  });
}
const res = await Promise.all([client('Alice'), client('Bob')]);
console.log(room, res);
if (res[0].winner !== res[1].winner) throw new Error('winner mismatch');
console.log('OK online game finished');
process.exit(0);
