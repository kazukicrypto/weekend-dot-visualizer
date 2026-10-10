// ソロ対戦用AI：1手ずつ次の行動を返す
import { CARD_MAP } from './cards.js';
import { RULES, validTargets, attackTargets, canAttack, playError, findUnit, heroId } from './engine.js';

const value = u => u.atk * 1.2 + u.hp + (u.taunt ? 1 : 0) + (u.shield ? 1.5 : 0) + (u.drain ? 1 : 0);

function chooseTarget(s, p, c) {
  const kind = c.target;
  const vt = validTargets(s, p, kind);
  if (!vt.length) return { none: true };
  const op = s.players[1 - p];
  const units = vt.filter(t => typeof t === 'number').map(t => findUnit(s, t).u);
  if (kind === 'ally') {
    units.sort((a, b) => b.atk - a.atk);
    return { target: units[0].uid };
  }
  if (kind === 'enemyUnit') {
    units.sort((a, b) => value(b) - value(a));
    return { target: units[0].uid };
  }
  // enemy: ダメージ
  const n = (c.fx || []).find(f => f.k === 'dmg')?.n || 0;
  if (op.hp <= n) return { target: heroId(1 - p) };
  const killable = units.filter(u => !u.shield && u.hp <= n).sort((a, b) => value(b) - value(a));
  if (killable.length) return { target: killable[0].uid };
  const shielded = units.filter(u => u.shield).sort((a, b) => value(b) - value(a));
  if (shielded.length && c.type === 'unit') return { target: shielded[0].uid };
  if (c.type === 'spell') {
    // 倒せないならスペルは温存（ただし盤面が空ならヒーローへ）
    if (!units.length) return { target: heroId(1 - p) };
    return { skip: true };
  }
  return { target: heroId(1 - p) };
}

function worthPlaying(s, p, c) {
  const me = s.players[p], op = s.players[1 - p];
  for (const f of c.fx || []) {
    if (c.type !== 'spell') break;
    if (f.k === 'heal' && me.hp > RULES.startHp - 4) return false;
    if (f.k === 'dmgUnits' && op.board.length < 2) return false;
    if (f.k === 'buffAll' && me.board.length < 2) return false;
    if (f.k === 'draw' && me.hand.length > 6) return false;
  }
  if ((c.fx || []).some(f => f.k === 'wipe')) {
    const mine = me.board.reduce((a, u) => a + value(u), 0);
    const theirs = op.board.reduce((a, u) => a + value(u), 0);
    if (theirs < mine + 4) return false;
  }
  return true;
}

export function aiNextAction(s, p) {
  const me = s.players[p], op = s.players[1 - p];

  // 1) カードを出す（コストの高いものから）
  const order = me.hand.map((id, i) => ({ i, c: CARD_MAP[id] }))
    .filter(x => x.c.cost <= me.mana)
    .sort((a, b) => b.c.cost - a.c.cost || (a.c.type === 'unit' ? -1 : 1));
  for (const { i, c } of order) {
    if (!worthPlaying(s, p, c)) continue;
    let target = null;
    if (c.target) {
      const t = chooseTarget(s, p, c);
      if (t.skip) continue;
      if (!t.none) target = t.target;
    }
    if (playError(s, p, i, target)) continue;
    return { type: 'play', hand: i, target };
  }

  // 2) 攻撃
  const attackers = me.board.filter(canAttack).sort((a, b) => b.atk - a.atk);
  if (attackers.length) {
    const targets = attackTargets(s, p);
    const tauntUnits = op.board.filter(u => u.taunt);
    const total = attackers.reduce((a, u) => a + u.atk, 0);
    if (!tauntUnits.length && total >= op.hp) return { type: 'attack', unit: attackers[0].uid, target: heroId(1 - p) };
    for (const a of attackers) {
      const enemies = targets.filter(t => typeof t === 'number').map(t => findUnit(s, t).u);
      if (tauntUnits.length) {
        const kill = enemies.filter(t => !t.shield && t.hp <= a.atk).sort((x, y) => value(y) - value(x));
        const t = kill[0] || enemies.sort((x, y) => x.hp - y.hp)[0];
        return { type: 'attack', unit: a.uid, target: t.uid };
      }
      // 有利トレード
      const good = enemies.filter(t => !t.shield && t.hp <= a.atk && (a.hp > t.atk || a.shield))
        .sort((x, y) => value(y) - value(x));
      if (good.length && (good[0].atk >= 2 || op.board.length >= me.board.length)) return { type: 'attack', unit: a.uid, target: good[0].uid };
      // 相打ちでも得なら
      const even = enemies.filter(t => !t.shield && t.hp <= a.atk && value(t) > value(a) + 1)
        .sort((x, y) => value(y) - value(x));
      if (even.length) return { type: 'attack', unit: a.uid, target: even[0].uid };
      // 盾を割る
      const sh = enemies.filter(t => t.shield && a.atk <= 2);
      if (sh.length) return { type: 'attack', unit: a.uid, target: sh[0].uid };
      return { type: 'attack', unit: a.uid, target: heroId(1 - p) };
    }
  }
  return { type: 'end' };
}
