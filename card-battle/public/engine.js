// ゲームエンジン（サーバー・クライアント共通、DOM非依存）
import { CARD_MAP, COLLECTIBLE } from './cards.js';

export const RULES = { startHp: 20, maxMana: 10, deckSize: 20, handMax: 8, boardMax: 6, maxCopies: 2, maxCopiesUR: 1 };

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function maxCopiesOf(id) {
  return CARD_MAP[id]?.rarity === 'UR' ? RULES.maxCopiesUR : RULES.maxCopies;
}

// デッキが正しければ null、不正ならエラーメッセージ
export function validateDeck(deck) {
  if (!Array.isArray(deck) || deck.length !== RULES.deckSize) return `デッキは${RULES.deckSize}枚にしてください`;
  const count = {};
  for (const id of deck) {
    const c = CARD_MAP[id];
    if (!c || c.token) return '不明なカードがあります';
    count[id] = (count[id] || 0) + 1;
    if (count[id] > maxCopiesOf(id)) return `${c.name}は${maxCopiesOf(id)}枚までです`;
  }
  return null;
}

export function heroId(p) { return 'h' + p; }

function ev(s, e) { s.events.push(e); }
function log(s, msg) { s.log.push(msg); if (s.log.length > 40) s.log.shift(); }

export function createGame(decks, names) {
  const s = {
    players: [0, 1].map(i => ({
      name: names[i], hp: RULES.startHp, maxMana: 0, mana: 0,
      deck: shuffle([...decks[i]]), hand: [], board: [], fatigue: 0,
    })),
    turn: 0, turnNo: 0, over: false, winner: null, log: [], events: [], uid: 1,
  };
  s.turn = Math.random() < 0.5 ? 0 : 1;
  draw(s, s.turn, 3);
  draw(s, 1 - s.turn, 4);
  log(s, `${s.players[s.turn].name} の先攻`);
  startTurn(s, s.turn);
  return s;
}

function draw(s, p, n = 1) {
  const P = s.players[p];
  for (let i = 0; i < n; i++) {
    if (!P.deck.length) {
      P.fatigue++;
      log(s, `${P.name} はデッキ切れで${P.fatigue}ダメージ`);
      damage(s, heroId(p), P.fatigue);
      continue;
    }
    const id = P.deck.pop();
    if (P.hand.length >= RULES.handMax) {
      log(s, `${P.name} の手札があふれて ${CARD_MAP[id].name} が燃えた`);
      ev(s, { k: 'burn', p, card: id });
    } else {
      P.hand.push(id);
      ev(s, { k: 'draw', p });
    }
  }
}

function startTurn(s, p) {
  s.turn = p;
  s.turnNo++;
  const P = s.players[p];
  P.maxMana = Math.min(RULES.maxMana, P.maxMana + 1);
  P.mana = P.maxMana;
  for (const u of P.board) { u.sick = false; u.attacked = false; }
  ev(s, { k: 'turn', p });
  draw(s, p, 1);
  checkWin(s);
}

export function findUnit(s, uid) {
  for (let p = 0; p < 2; p++) {
    const idx = s.players[p].board.findIndex(u => u.uid === uid);
    if (idx >= 0) return { p, idx, u: s.players[p].board[idx] };
  }
  return null;
}

function damage(s, id, n) {
  if (n <= 0) return 0;
  if (typeof id === 'string') {
    const p = +id[1];
    s.players[p].hp -= n;
    ev(s, { k: 'dmg', id, n });
    return n;
  }
  const f = findUnit(s, id);
  if (!f) return 0;
  if (f.u.shield) {
    f.u.shield = false;
    ev(s, { k: 'shield', id });
    return 0;
  }
  f.u.hp -= n;
  ev(s, { k: 'dmg', id, n });
  return n;
}

function healHero(s, p, n) {
  const P = s.players[p];
  const v = Math.min(n, RULES.startHp - P.hp);
  if (v > 0) { P.hp += v; ev(s, { k: 'heal', id: heroId(p), n: v }); }
}

function cleanup(s) {
  for (const P of s.players) {
    const dead = P.board.filter(u => u.hp <= 0);
    for (const u of dead) { ev(s, { k: 'die', id: u.uid, card: u.id }); log(s, `${CARD_MAP[u.id].name} は倒れた`); }
    P.board = P.board.filter(u => u.hp > 0);
  }
}

function checkWin(s) {
  const d0 = s.players[0].hp <= 0, d1 = s.players[1].hp <= 0;
  if (!d0 && !d1) return;
  s.over = true;
  s.winner = d0 && d1 ? -1 : d0 ? 1 : 0;
  log(s, s.winner === -1 ? '引き分け！' : `${s.players[s.winner].name} の勝利！`);
  ev(s, { k: 'over', winner: s.winner });
}

function summon(s, p, id) {
  const P = s.players[p];
  if (P.board.length >= RULES.boardMax) return null;
  const c = CARD_MAP[id];
  const kw = c.kw || [];
  const u = {
    uid: s.uid++, id, atk: c.atk, hp: c.hp, maxHp: c.hp,
    taunt: kw.includes('taunt'), rush: kw.includes('rush'), shield: kw.includes('shield'), drain: kw.includes('drain'),
    sick: !kw.includes('rush'), attacked: false,
  };
  P.board.push(u);
  ev(s, { k: 'summon', p, id: u.uid });
  return u;
}

// 効果の対象として選べるもの（state でも view でも動く）
export function validTargets(s, p, kind) {
  const me = s.players[p], op = s.players[1 - p];
  switch (kind) {
    case 'enemy': return [...op.board.map(u => u.uid), heroId(1 - p)];
    case 'enemyUnit': return op.board.map(u => u.uid);
    case 'ally': return me.board.map(u => u.uid);
    default: return [];
  }
}

// 攻撃できる相手（守護がいれば守護のみ）
export function attackTargets(s, p) {
  const op = s.players[1 - p];
  const taunts = op.board.filter(u => u.taunt);
  if (taunts.length) return taunts.map(u => u.uid);
  return [...op.board.map(u => u.uid), heroId(1 - p)];
}

export function canAttack(u) { return !u.sick && !u.attacked && u.atk > 0; }

// カードを出せるか（null なら可能、文字列は理由）
export function playError(s, p, handIndex, target) {
  const P = s.players[p];
  const id = P.hand[handIndex];
  const c = CARD_MAP[id];
  if (!c) return 'そのカードはありません';
  if (c.cost > P.mana) return 'マナが足りません';
  if (c.type === 'unit' && P.board.length >= RULES.boardMax) return '場がいっぱいです';
  if (c.target) {
    const vt = validTargets(s, p, c.target);
    if (c.type === 'spell' && !vt.length) return '対象がいません';
    if (vt.length && !vt.includes(target)) return '対象を選んでください';
  }
  return null;
}

function applyFx(s, p, c, target, selfUid) {
  const op = 1 - p;
  for (const f of c.fx || []) {
    switch (f.k) {
      case 'dmg': if (target != null) damage(s, target, f.n); break;
      case 'dmgUnits': for (const u of [...s.players[op].board]) damage(s, u.uid, f.n); break;
      case 'dmgAll':
        for (const u of [...s.players[op].board]) damage(s, u.uid, f.n);
        damage(s, heroId(op), f.n);
        break;
      case 'heal': healHero(s, p, f.n); break;
      case 'draw': draw(s, p, f.n); break;
      case 'buffAll':
        for (const u of s.players[p].board) { u.atk += f.atk; u.hp += f.hp; u.maxHp += f.hp; ev(s, { k: 'buff', id: u.uid }); }
        break;
      case 'buffOne': {
        const t = target != null && findUnit(s, target);
        if (t) { t.u.atk += f.atk; t.u.hp += f.hp; t.u.maxHp += f.hp; ev(s, { k: 'buff', id: t.u.uid }); }
        break;
      }
      case 'destroy': {
        const t = target != null && findUnit(s, target);
        if (t) { t.u.hp = 0; ev(s, { k: 'destroy', id: t.u.uid }); }
        break;
      }
      case 'summon': for (let i = 0; i < f.n; i++) summon(s, p, f.id); break;
      case 'wipe':
        for (const P of s.players) for (const u of P.board) if (u.uid !== selfUid) { u.hp = 0; ev(s, { k: 'destroy', id: u.uid }); }
        break;
    }
  }
  cleanup(s);
  checkWin(s);
}

// アクションを適用。{ ok: true } または { error }
export function applyAction(s, p, a) {
  if (s.over) return { error: 'ゲームは終了しています' };
  s.events = [];
  if (a?.type === 'concede') {
    s.over = true; s.winner = 1 - p;
    log(s, `${s.players[p].name} は降参した`);
    ev(s, { k: 'over', winner: s.winner });
    return { ok: true };
  }
  if (p !== s.turn) return { error: 'あなたのターンではありません' };
  const P = s.players[p];
  switch (a?.type) {
    case 'play': {
      const err = playError(s, p, a.hand, a.target);
      if (err) return { error: err };
      const id = P.hand[a.hand];
      const c = CARD_MAP[id];
      P.mana -= c.cost;
      P.hand.splice(a.hand, 1);
      ev(s, { k: 'play', p, card: id });
      log(s, `${P.name} は ${c.name} を出した`);
      const target = c.target && validTargets(s, p, c.target).length ? a.target : null;
      let selfUid = null;
      if (c.type === 'unit') selfUid = summon(s, p, id).uid;
      applyFx(s, p, c, target, selfUid);
      return { ok: true };
    }
    case 'attack': {
      const f = findUnit(s, a.unit);
      if (!f || f.p !== p) return { error: 'そのユニットはいません' };
      const u = f.u;
      if (!canAttack(u)) return { error: u.sick ? '出したターンは攻撃できません' : 'もう攻撃しました' };
      if (!attackTargets(s, p).includes(a.target)) return { error: '守護ユニットを先に攻撃してください' };
      u.attacked = true;
      ev(s, { k: 'attack', from: u.uid, to: a.target });
      if (typeof a.target === 'string') {
        log(s, `${CARD_MAP[u.id].name} が ${s.players[1 - p].name} を攻撃`);
        const d = damage(s, a.target, u.atk);
        if (u.drain) healHero(s, p, d);
      } else {
        const t = findUnit(s, a.target).u;
        log(s, `${CARD_MAP[u.id].name} が ${CARD_MAP[t.id].name} を攻撃`);
        const ua = u.atk, ta = t.atk;
        const d1 = damage(s, t.uid, ua);
        const d2 = damage(s, u.uid, ta);
        if (u.drain) healHero(s, p, d1);
        if (t.drain) healHero(s, 1 - p, d2);
      }
      cleanup(s);
      checkWin(s);
      return { ok: true };
    }
    case 'end': {
      log(s, `${P.name} のターン終了`);
      startTurn(s, 1 - p);
      return { ok: true };
    }
  }
  return { error: '不明なアクション' };
}

// プレイヤー p から見た状態（相手の手札・山札は隠す）
export function viewFor(s, p) {
  return JSON.parse(JSON.stringify({
    me: p, turn: s.turn, turnNo: s.turnNo, over: s.over, winner: s.winner,
    log: s.log.slice(-8), events: s.events,
    players: s.players.map((P, i) => ({
      name: P.name, hp: P.hp, mana: P.mana, maxMana: P.maxMana,
      deckCount: P.deck.length, handCount: P.hand.length,
      hand: i === p ? P.hand : null, board: P.board,
    })),
  }));
}

// ランダムなデッキ（AI用）。pool: 使えるレアリティ
export function randomDeck(rarities = ['N', 'R', 'SR', 'UR']) {
  const pool = COLLECTIBLE.filter(c => rarities.includes(c.rarity));
  const deck = [];
  const count = {};
  let guard = 0;
  while (deck.length < RULES.deckSize && guard++ < 5000) {
    const c = pool[Math.floor(Math.random() * pool.length)];
    // 低コスト寄りに
    if (c.cost >= 5 && Math.random() < 0.5) continue;
    if ((count[c.id] || 0) >= maxCopiesOf(c.id)) continue;
    count[c.id] = (count[c.id] || 0) + 1;
    deck.push(c.id);
  }
  return deck;
}
