import { CARD_MAP, COLLECTIBLE, KW_HELP, RARITY_ORDER, cardText } from './cards.js';
import {
  RULES, createGame, applyAction, viewFor, validateDeck, validTargets, attackTargets, canAttack,
  playError, randomDeck, maxCopiesOf, heroId,
} from './engine.js';
import { aiNextAction } from './ai.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const PACK_COST = 100;
const SOLO = [
  { name: '初級', reward: 30, rar: ['N'], ai: 'スライム王', emoji: '🟢' },
  { name: '中級', reward: 60, rar: ['N', 'R'], ai: 'オーク将軍', emoji: '👹' },
  { name: '上級', reward: 100, rar: ['N', 'R', 'SR', 'UR'], ai: '魔王', emoji: '😈' },
];
const EMOTES = ['👍', '😂', '😱', '🔥', '🙏', '😤'];

// ================= セーブデータ =================
const SAVE_KEY = 'packbattlers_save_v1';
let save;
function defaultSave() {
  const col = {};
  for (const c of COLLECTIBLE) if (c.rarity === 'N') col[c.id] = 2;
  return { coins: 300, col, deck: autoDeck(col), name: '', stats: { w: 0, l: 0 }, lastFree: '' };
}
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && s.col) return { ...defaultSave(), ...s };
  } catch {}
  return defaultSave();
}
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch {} }
const today = () => new Date().toISOString().slice(0, 10);

// 所持カードからデッキを自動構築
function autoDeck(col) {
  const pool = [];
  for (const c of COLLECTIBLE) {
    const n = Math.min(col[c.id] || 0, maxCopiesOf(c.id));
    for (let i = 0; i < n; i++) pool.push(c);
  }
  const score = c => RARITY_ORDER[c.rarity] * 3 + (c.type === 'unit' ? 1 : 0) + (c.atk || 0) * 0.3 + (c.hp || 0) * 0.2 + (c.fx ? 1 : 0) - c.cost * 0.15 + Math.random() * 0.5;
  pool.sort((a, b) => score(b) - score(a));
  const deck = [];
  let heavy = 0;
  for (const c of pool) {
    if (deck.length >= RULES.deckSize) break;
    if (c.cost >= 6) { if (heavy >= 4) continue; heavy++; }
    deck.push(c.id);
  }
  for (const c of pool) { // 足りなければ埋める
    if (deck.length >= RULES.deckSize) break;
    if (deck.filter(x => x === c.id).length < Math.min(col[c.id] || 0, maxCopiesOf(c.id))) deck.push(c.id);
  }
  return sortDeck(deck);
}
const sortDeck = d => d.sort((a, b) => CARD_MAP[a].cost - CARD_MAP[b].cost || a.localeCompare(b));

// ================= 共通UI =================
let toastTimer;
function toast(msg, ms = 1600) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), ms);
}
function modal(html, onBind) {
  $('#modalBox').innerHTML = html;
  $('#modal').classList.remove('hidden');
  onBind?.($('#modalBox'));
}
function closeModal() { $('#modal').classList.add('hidden'); }
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal' && !$('#modal').dataset.lock) closeModal(); });

function show(id) {
  $$('.screen').forEach(s => s.classList.toggle('hidden', s.id !== id));
  if (id === 'home') renderHome();
  if (id === 'pack') renderPack();
  if (id === 'collection') renderCollection();
  if (id === 'online') renderOnline();
}
$$('[data-go]').forEach(b => b.addEventListener('click', () => show(b.dataset.go)));

function cardHTML(c, extraClass = '') {
  const stats = c.type === 'unit' ? `<div class="stats"><span class="atkb">${c.atk}</span><span class="hpb">${c.hp}</span></div>` : '<div class="stats"></div>';
  return `<div class="card r-${c.rarity} t-${c.type} ${extraClass}">
    <div class="cost">${c.cost}</div><div class="rar">${c.rarity}</div>
    <div class="art">${c.emoji}</div><div class="name">${esc(c.name)}</div>
    <div class="text">${esc(cardText(c))}</div>${stats}</div>`;
}
function fxAt(x, y, text, cls) {
  const d = document.createElement('div');
  d.className = 'float ' + cls;
  d.textContent = text;
  d.style.left = x + 'px'; d.style.top = y + 'px';
  $('#fx').appendChild(d);
  setTimeout(() => d.remove(), 950);
}

// ================= ホーム =================
let onlineAvailable = false;
function renderHome() {
  $('#homeCoins').textContent = `🪙 ${save.coins}`;
  $('#homeStats').textContent = `${save.stats.w}勝 ${save.stats.l}敗`;
  $('#freeHint').textContent = save.lastFree !== today() ? '🎁 今日の無料パックあり！' : '1パック 100コイン';
  const err = validateDeck(save.deck);
  $('#deckHint').textContent = err ? `⚠️ ${err}` : `デッキ ${save.deck.length}枚 / 所持 ${ownedKinds()}種`;
  $$('[data-solo]').forEach(b => b.disabled = !!err);
  $('#onlineHint').textContent = onlineAvailable ? 'ほかのプレイヤーと対戦' : 'Cloudflare版でのみ利用できます';
  $('#onlineBtn').disabled = !onlineAvailable || !!err;
}
const ownedKinds = () => COLLECTIBLE.filter(c => save.col[c.id]).length;
$$('[data-solo]').forEach(b => b.addEventListener('click', () => startSolo(+b.dataset.solo)));
$('#howBtn').addEventListener('click', () => modal(`
  <h3>遊び方</h3>
  <ul>
    <li><b>パック</b>を開けてカードを集め、<b>20枚のデッキ</b>を作ります（同じカードは2枚まで、URは1枚）。</li>
    <li>毎ターン<b>マナ</b>が1ずつ増えます（最大10）。マナを使って手札のカードを出しましょう。</li>
    <li>ユニットは出した次のターンから攻撃できます。相手のユニットか相手本人を攻撃。</li>
    <li>相手のHP（20）を0にしたら勝ち！</li>
    <li>${KW_HELP.taunt}</li><li>${KW_HELP.rush}</li><li>${KW_HELP.shield}</li><li>${KW_HELP.drain}</li>
    <li>操作：手札をタップ→もう一度タップ（または「使う」）で出す。対象が必要なカードは光っている対象をタップ。攻撃は味方ユニット→相手をタップ。</li>
    <li>勝つとコインがもらえます。毎日1回無料パックあり！</li>
  </ul>
  <button class="mbtn primary" id="mClose">OK</button>`, box => box.querySelector('#mClose').onclick = closeModal));

// ================= パック =================
function rollRarity(guarantee) {
  const r = Math.random() * 100;
  if (guarantee) { // R以上確定（25:8:2 の比率）
    const g = Math.random() * 35;
    return g < 2 ? 'UR' : g < 10 ? 'SR' : 'R';
  }
  return r < 2 ? 'UR' : r < 10 ? 'SR' : r < 35 ? 'R' : 'N';
}
function openPack() {
  const out = [];
  for (let i = 0; i < 5; i++) {
    const rar = rollRarity(i === 4);
    const pool = COLLECTIBLE.filter(c => c.rarity === rar);
    out.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return out.sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]);
}
function renderPack() {
  $('#packCoins').textContent = `🪙 ${save.coins}`;
  $('#packArea').classList.remove('hidden');
  $('#reveal').classList.add('hidden');
  $('#packVisual').classList.remove('opening');
  const free = save.lastFree !== today();
  $('#freePackBtn').classList.toggle('hidden', !free);
  $('#buyPackBtn').disabled = save.coins < PACK_COST;
  $('#buy5Btn').disabled = save.coins < PACK_COST * 5;
}
async function doOpen(packs, cost, isFree) {
  if (save.coins < cost) return toast('コインが足りません');
  save.coins -= cost;
  if (isFree) save.lastFree = today();
  const cards = [];
  for (let i = 0; i < packs; i++) cards.push(...openPack());
  // コレクションに追加（上限超過はコインに変換）
  let refund = 0;
  const results = cards.map(c => {
    const had = save.col[c.id] || 0;
    const limit = maxCopiesOf(c.id) + 1; // 予備を1枚まで保持
    if (had >= limit) { const v = { N: 10, R: 25, SR: 60, UR: 150 }[c.rarity]; refund += v; return { c, isNew: false, refund: v }; }
    save.col[c.id] = had + 1;
    return { c, isNew: had === 0 };
  });
  save.coins += refund;
  persist();
  $('#packVisual').classList.add('opening');
  await sleep(480);
  $('#packArea').classList.add('hidden');
  $('#reveal').classList.remove('hidden');
  $('#packCoins').textContent = `🪙 ${save.coins}`;
  const grid = $('#revealGrid');
  grid.innerHTML = results.map((r, i) => `
    <div class="flip hint-${r.c.rarity}" data-i="${i}" style="animation-delay:${(i % 5) * 0.08}s">
      ${r.isNew ? '<div class="new-badge">NEW</div>' : ''}
      ${r.refund ? `<div class="dupe">上限超過 +${r.refund}🪙</div>` : ''}
      <div class="flip-inner"><div class="backside">🎴</div><div class="face">${cardHTML(r.c)}</div></div>
    </div>`).join('');
  const best = results.reduce((m, r) => Math.max(m, RARITY_ORDER[r.c.rarity]), 0);
  $('#revealNote').textContent = refund ? `所持上限を超えたカードは ${refund} コインに変換されました` : 'カードをタップしてめくろう！';
  const flip = el => {
    if (el.classList.contains('open')) return;
    el.classList.add('open');
    const r = results[+el.dataset.i];
    if (RARITY_ORDER[r.c.rarity] >= 2) {
      const rect = el.getBoundingClientRect();
      const d = document.createElement('div');
      d.className = 'burst';
      d.style.left = rect.left + rect.width / 2 + 'px'; d.style.top = rect.top + 'px';
      d.style.color = r.c.rarity === 'UR' ? '#ff5ad8' : '#ffc93c';
      d.textContent = r.c.rarity === 'UR' ? '★UR★' : 'SR!';
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 1000);
    }
    if ($$('.flip:not(.open)').length === 0) revealDone();
  };
  $$('.flip').forEach(el => el.addEventListener('click', () => flip(el)));
  $('#flipAllBtn').classList.remove('hidden');
  $('#againBtn').classList.add('hidden');
  $('#revealDoneBtn').classList.add('hidden');
  $('#flipAllBtn').onclick = async () => { for (const el of $$('.flip:not(.open)')) { flip(el); await sleep(120); } };
  function revealDone() {
    $('#flipAllBtn').classList.add('hidden');
    $('#againBtn').classList.remove('hidden');
    $('#againBtn').disabled = save.coins < PACK_COST;
    $('#revealDoneBtn').classList.remove('hidden');
    if (best >= 3) toast('🌈 URカード獲得！！', 2200);
  }
}
$('#freePackBtn').addEventListener('click', () => { if (save.lastFree !== today()) doOpen(1, 0, true); });
$('#buyPackBtn').addEventListener('click', () => doOpen(1, PACK_COST));
$('#buy5Btn').addEventListener('click', () => doOpen(5, PACK_COST * 5));
$('#againBtn').addEventListener('click', () => { renderPack(); doOpen(1, PACK_COST); });
$('#revealDoneBtn').addEventListener('click', renderPack);

// ================= コレクション / デッキ =================
let colFilter = 'all';
function renderCollection() {
  $('#colCoins').textContent = `🪙 ${save.coins}`;
  sortDeck(save.deck);
  $('#deckCount').textContent = `${save.deck.length}/${RULES.deckSize}`;
  const err = validateDeck(save.deck);
  $('#deckWarn').textContent = err && save.deck.length !== RULES.deckSize ? `あと${RULES.deckSize - save.deck.length}枚` : err || '✅ OK';
  // コストカーブ
  const curve = Array(8).fill(0);
  for (const id of save.deck) curve[Math.min(7, CARD_MAP[id].cost)]++;
  const mx = Math.max(1, ...curve);
  $('#curve').innerHTML = curve.map((n, i) => `<div><span>${n || ''}</span><i style="height:${(n / mx) * 28}px"></i>${i === 7 ? '7+' : i}</div>`).join('');
  // デッキリスト
  const counts = {};
  for (const id of save.deck) counts[id] = (counts[id] || 0) + 1;
  $('#deckList').innerHTML = Object.keys(counts).length
    ? Object.entries(counts).map(([id, n]) => { const c = CARD_MAP[id]; return `<div class="dchip r-${c.rarity}" data-id="${id}"><span class="c">${c.cost}</span>${c.emoji}${esc(c.name)}${n > 1 ? ' ×' + n : ''}</div>`; }).join('')
    : '<span style="opacity:.5;font-size:12px">下のカードをタップしてデッキに追加</span>';
  $$('#deckList .dchip').forEach(el => el.addEventListener('click', () => {
    save.deck.splice(save.deck.indexOf(el.dataset.id), 1);
    persist(); renderCollection();
  }));
  // 一覧
  const list = COLLECTIBLE.filter(c => colFilter === 'all' || (colFilter === 'owned' ? save.col[c.id] : c.type === colFilter))
    .sort((a, b) => a.cost - b.cost || RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]);
  $('#colProgress').textContent = `コレクション ${ownedKinds()} / ${COLLECTIBLE.length} 種`;
  $('#colGrid').innerHTML = list.map(c => {
    const own = save.col[c.id] || 0, inDeck = counts[c.id] || 0;
    return `<div class="col-item ${own ? '' : 'unowned'}" data-id="${c.id}">
      ${inDeck ? `<div class="indeck">${inDeck}</div>` : ''}${cardHTML(c)}
      <div class="own">${own ? `所持 ×${own}` : '未所持'}</div></div>`;
  }).join('');
  $$('#colGrid .col-item').forEach(el => el.addEventListener('click', () => {
    const id = el.dataset.id, c = CARD_MAP[id];
    const own = save.col[id] || 0, inDeck = counts[id] || 0;
    if (!own) return toast('まだ持っていません。パックで手に入れよう！');
    if (save.deck.length >= RULES.deckSize) return toast('デッキは20枚までです');
    if (inDeck >= Math.min(own, maxCopiesOf(id))) return toast(inDeck >= maxCopiesOf(id) ? `${c.name}は${maxCopiesOf(id)}枚までです` : 'これ以上持っていません');
    save.deck.push(id);
    persist(); renderCollection();
  }));
}
$$('#colFilter button').forEach(b => b.addEventListener('click', () => {
  colFilter = b.dataset.f;
  $$('#colFilter button').forEach(x => x.classList.toggle('on', x === b));
  renderCollection();
}));
$('#autoDeckBtn').addEventListener('click', () => { save.deck = autoDeck(save.col); persist(); renderCollection(); toast('おまかせデッキを作りました'); });
$('#clearDeckBtn').addEventListener('click', () => { save.deck = []; persist(); renderCollection(); });

// ================= バトル =================
// B: 現在のバトル { mode, view, me, act(action), solo?, net? }
let B = null;
let sel = null; // { kind: 'hand', i } | { kind: 'unit', uid }
let rewarded = false;

function startSolo(level) {
  const L = SOLO[level];
  if (validateDeck(save.deck)) return toast('デッキを20枚にしてください');
  const s = createGame([save.deck.slice(), randomDeck(L.rar)], [save.name || 'あなた', L.ai]);
  B = {
    mode: 'solo', level, s, me: 0, view: null, aiRunning: false, oppEmoji: L.emoji,
    act(a) {
      const r = applyAction(this.s, 0, a);
      if (r.error) return toast(r.error);
      updateBattle(viewFor(this.s, 0));
      this.runAI();
    },
    async runAI() {
      if (this.aiRunning) return;
      this.aiRunning = true;
      try {
        while (B === this && !this.s.over && this.s.turn === 1) {
          await sleep(this.s.events.some(e => e.k === 'turn') ? 1100 : 750);
          if (B !== this) return;
          const a = aiNextAction(this.s, 1);
          applyAction(this.s, 1, a);
          updateBattle(viewFor(this.s, 0));
        }
      } finally { this.aiRunning = false; }
    },
  };
  enterBattle();
  updateBattle(viewFor(s, 0));
  B.runAI();
}

function enterBattle() {
  sel = null; rewarded = false;
  delete $('#modal').dataset.lock;
  closeModal();
  $('#emoteBtn').classList.toggle('hidden', B.mode !== 'online');
  $('#emoteRow').classList.add('hidden');
  show('battle');
}

function elFor(tid) { return document.querySelector(`[data-tid="${tid}"]`); }

function updateBattle(v) {
  const prev = B.view;
  // 消える前の位置を記録（死亡演出用）
  const rects = {};
  $$('#battle [data-tid]').forEach(el => { rects[el.dataset.tid] = el.getBoundingClientRect(); });
  B.view = v;
  B.me = v.me;
  if (sel?.kind === 'hand' && (v.turn !== v.me || !v.players[v.me].hand[sel.i])) sel = null;
  if (sel?.kind === 'unit' && !v.players[v.me].board.some(u => u.uid === sel.uid && canAttack(u))) sel = null;
  if (v.turn !== v.me) sel = null;
  renderBattle();
  playEvents(v, prev, rects);
  if (v.over) onGameOver(v);
}

function playEvents(v, prev, rects) {
  const known = new Set(prev ? prev.players.flatMap(P => P.board.map(u => u.uid)) : []);
  const pos = tid => {
    const el = elFor(tid);
    const r = el ? el.getBoundingClientRect() : rects[tid];
    return r ? [r.left + r.width / 2, r.top + r.height / 2] : null;
  };
  let delay = 0;
  for (const e of v.events) {
    if (e.k === 'dmg' || e.k === 'heal') {
      const p = pos(e.id);
      if (p) setTimeout(() => fxAt(p[0], p[1] - 10, (e.k === 'dmg' ? '-' : '+') + e.n, e.k), delay);
      const el = elFor(e.id);
      if (el && e.k === 'dmg') { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
      delay += 60;
    } else if (e.k === 'shield') {
      const p = pos(e.id); if (p) fxAt(p[0], p[1], '🛡️', 'info');
    } else if (e.k === 'die' || e.k === 'destroy') {
      const p = pos(e.id); if (p && e.k === 'die') setTimeout(() => fxAt(p[0], p[1], '💥', 'info'), 120);
    } else if (e.k === 'buff') {
      const p = pos(e.id); if (p) fxAt(p[0], p[1] - 20, '⬆', 'heal');
    } else if (e.k === 'attack') {
      const el = elFor(e.from);
      if (el) el.classList.add(v.players[v.me].board.some(u => u.uid === e.from) ? 'lunge-up' : 'lunge-down');
    } else if (e.k === 'summon' && !known.has(e.id)) {
      elFor(e.id)?.classList.add('enter');
    } else if (e.k === 'turn' && !v.over) {
      banner(e.p === v.me ? 'あなたのターン' : '相手のターン');
    } else if (e.k === 'play' && e.p !== v.me) {
      const c = CARD_MAP[e.card];
      toast(`相手: ${c.emoji} ${c.name}`, 1200);
    } else if (e.k === 'burn' && e.p === v.me) {
      toast(`手札がいっぱいで ${CARD_MAP[e.card].name} が燃えた！`);
    }
  }
}

function banner(text) {
  const b = $('#banner');
  b.textContent = text;
  b.classList.remove('hidden');
  b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
  clearTimeout(banner.t);
  banner.t = setTimeout(() => b.classList.add('hidden'), 1300);
}

function currentTargets() {
  const v = B.view;
  if (!sel || v.turn !== v.me) return [];
  if (sel.kind === 'hand') {
    const c = CARD_MAP[v.players[v.me].hand[sel.i]];
    return c?.target ? validTargets(v, v.me, c.target) : [];
  }
  return attackTargets(v, v.me);
}

function unitHTML(u, mine, myTurn, targets) {
  const c = CARD_MAP[u.id];
  const cls = ['unit', 'r-' + c.rarity];
  if (u.taunt) cls.push('taunt');
  if (u.shield) cls.push('shield');
  if (mine && u.sick) cls.push('sick');
  if (mine && myTurn && canAttack(u)) cls.push('ready');
  if (sel?.kind === 'unit' && sel.uid === u.uid) cls.push('sel');
  if (targets.includes(u.uid)) cls.push('tgt');
  const kw = [u.rush ? '⚡' : '', u.drain ? '🩸' : ''].join('');
  return `<div class="${cls.join(' ')}" data-tid="${u.uid}">
    ${kw ? `<span class="kw">${kw}</span>` : ''}${mine && u.sick && !u.rush ? '<span class="zz">💤</span>' : ''}
    <div class="art">${c.emoji}</div>
    <span class="atkb ${u.atk > c.atk ? 'up' : ''}">${u.atk}</span><span class="hpb ${u.hp < u.maxHp ? 'hurt' : u.maxHp > c.hp ? 'up' : ''}">${u.hp}</span></div>`;
}

function gems(P) {
  let s = '';
  for (let i = 0; i < P.maxMana; i++) s += `<i class="${i < P.mana ? '' : 'used'}"></i>`;
  return `<span class="gems">${s}</span> ${P.mana}/${P.maxMana}`;
}

function renderBattle() {
  const v = B.view, me = v.me, op = 1 - me;
  const myTurn = v.turn === me && !v.over;
  const M = v.players[me], O = v.players[op];
  const targets = currentTargets();
  const hero = (p, emoji) => `<div class="hero ${targets.includes(heroId(p)) ? 'tgt' : ''}" data-tid="${heroId(p)}">${emoji}<span class="hpb ${v.players[p].hp < 8 ? 'hurt' : ''}">${v.players[p].hp}</span></div>`;

  $('#oppBar').innerHTML = `${hero(op, B.oppEmoji || '🧝')}
    <div class="hero-info"><div class="hero-name">${esc(O.name)}${B.mode === 'online' && B.oppOffline ? '<span class="off">（接続待ち）</span>' : ''}</div>
    <div class="hero-sub">${gems(O)}<span>🂠 ${O.handCount}</span><span>📦 ${O.deckCount}</span></div></div>
    <span class="timer" id="timerOpp"></span>`;
  $('#myBar').innerHTML = `${hero(me, '🧙‍♂️')}
    <div class="hero-info"><div class="hero-name">${esc(M.name)}</div>
    <div class="hero-sub">${gems(M)}<span>📦 ${M.deckCount}</span><span class="timer" id="timerMe"></span></div></div>
    <button class="end-btn" id="endBtn" ${myTurn ? '' : 'disabled'}>${myTurn ? 'ターン終了' : '相手のターン'}</button>`;

  $('#oppBoard').innerHTML = O.board.length ? O.board.map(u => unitHTML(u, false, myTurn, targets)).join('') : '<span class="empty">相手の場</span>';
  $('#myBoard').innerHTML = M.board.length ? M.board.map(u => unitHTML(u, true, myTurn, targets)).join('') : '<span class="empty">自分の場</span>';

  // 手札
  const oldHand = $('#hand').children.length;
  $('#hand').innerHTML = M.hand.map((id, i) => {
    const c = CARD_MAP[id];
    const ok = myTurn && !playError(v, me, i, c.target ? validTargets(v, me, c.target)[0] : null);
    const cls = [ok ? 'playable' : (myTurn ? 'nope' : ''), sel?.kind === 'hand' && sel.i === i ? 'sel' : '', i >= oldHand && B.handInit ? 'drawn' : ''].join(' ');
    return cardHTML(c, cls).replace('<div class="card', `<div data-hand="${i}" class="card`);
  }).join('');
  B.handInit = true;

  // ターン表示・ログ
  const ti = $('#turnInd');
  ti.textContent = v.over ? '終了' : myTurn ? 'あなたのターン' : '相手のターン';
  ti.classList.toggle('mine', myTurn);
  $('#logLine').textContent = v.log[v.log.length - 1] || '';

  // ターン終了ボタン：やることがなければ強調
  const anything = M.hand.some((id, i) => !playError(v, me, i, CARD_MAP[id].target ? validTargets(v, me, CARD_MAP[id].target)[0] : null))
    || M.board.some(canAttack);
  $('#endBtn').classList.toggle('done', myTurn && !anything);
  $('#endBtn').onclick = () => { sel = null; B.act({ type: 'end' }); };

  renderDetail();
  bindBattle();
  tickTimer();
}

function renderDetail() {
  const v = B.view, d = $('#detail');
  if (!sel) {
    d.innerHTML = `<div class="dtxt" style="opacity:.6">${v.turn === v.me && !v.over ? 'カードやユニットをタップして操作' : '相手が考えています…'}</div>`;
    return;
  }
  if (sel.kind === 'hand') {
    const c = CARD_MAP[v.players[v.me].hand[sel.i]];
    const err = playError(v, v.me, sel.i, c.target ? validTargets(v, v.me, c.target)[0] : null);
    const needT = c.target && validTargets(v, v.me, c.target).length;
    d.innerHTML = `<div class="dtxt"><b>${c.emoji} ${esc(c.name)}</b>（${c.cost}マナ）${c.type === 'unit' ? ` ${c.atk}/${c.hp}` : ''}\n${esc(cardText(c)) || '効果なし'}</div>
      ${err ? `<span style="color:#ff9aa8">${err}</span>` : needT ? '<span style="color:#ff9aa8">対象をタップ</span>' : '<button class="mbtn primary" id="useBtn">使う</button>'}`;
    $('#useBtn')?.addEventListener('click', () => playSel(null));
  } else {
    const u = findViewUnit(sel.uid);
    if (!u) return;
    const c = CARD_MAP[u.id];
    d.innerHTML = `<div class="dtxt"><b>${c.emoji} ${esc(c.name)}</b> ${u.atk}/${u.hp}\n攻撃する相手をタップ</div>`;
  }
}

function showInfo(u) {
  const c = CARD_MAP[u.id];
  const kws = ['taunt', 'rush', 'shield', 'drain'].filter(k => u[k]).map(k => KW_HELP[k]);
  const fx = (c.fx || []).length ? cardText({ ...c, kw: null }) : '';
  $('#detail').innerHTML = `<div class="dtxt"><b>${c.emoji} ${esc(c.name)}</b> ${u.atk}/${u.hp}${u.sick && !u.rush ? '（次のターンから攻撃可）' : ''}\n${esc([...kws, fx].filter(Boolean).join('\n')) || '効果なし'}</div>`;
}

function findViewUnit(uid) {
  for (const P of B.view.players) { const u = P.board.find(x => x.uid === uid); if (u) return u; }
  return null;
}

function playSel(target) {
  const i = sel.i;
  sel = null;
  B.act({ type: 'play', hand: i, target });
}

function bindBattle() {
  const v = B.view, me = v.me;
  const myTurn = v.turn === me && !v.over;
  const targets = currentTargets();
  const tryTarget = tid => {
    if (!targets.includes(tid)) return false;
    if (sel.kind === 'hand') playSel(tid);
    else { const uid = sel.uid; sel = null; B.act({ type: 'attack', unit: uid, target: tid }); }
    return true;
  };
  $$('#hand [data-hand]').forEach(el => el.addEventListener('click', e => {
    e.stopPropagation();
    const i = +el.dataset.hand;
    if (!myTurn) { sel = null; const c = CARD_MAP[v.players[me].hand[i]]; renderBattle(); $('#detail').innerHTML = `<div class="dtxt"><b>${c.emoji} ${esc(c.name)}</b>（${c.cost}マナ）\n${esc(cardText(c)) || '効果なし'}</div>`; return; }
    if (sel?.kind === 'hand' && sel.i === i) {
      const c = CARD_MAP[v.players[me].hand[i]];
      const needT = c.target && validTargets(v, me, c.target).length;
      if (!needT && !playError(v, me, i, null)) return playSel(null);
    }
    sel = { kind: 'hand', i };
    renderBattle();
  }));
  $$(".board .unit").forEach(el => el.addEventListener('click', e => {
    e.stopPropagation();
    const uid = +el.dataset.tid;
    if (sel && tryTarget(uid)) return;
    const u = findViewUnit(uid);
    const mine = v.players[me].board.some(x => x.uid === uid);
    if (mine && myTurn && canAttack(u)) { sel = sel?.kind === 'unit' && sel.uid === uid ? null : { kind: 'unit', uid }; renderBattle(); return; }
    if (!u) return;
    sel = null; renderBattle(); showInfo(u);
  }));
  $$('#battle .hero').forEach(el => el.addEventListener('click', e => {
    e.stopPropagation();
    if (sel) tryTarget(el.dataset.tid);
  }));
}
$('#battle').addEventListener('click', e => {
  if (!B || e.target.closest('.detail, .battle-tools, .emote-row, .end-btn')) return;
  if (sel) { sel = null; renderBattle(); }
});

// タイマー表示（オンライン）
setInterval(() => { if (B?.mode === 'online') tickTimer(); }, 500);
function tickTimer() {
  if (B?.mode !== 'online' || !B.deadline || B.view?.over) { $('#timerMe') && ($('#timerMe').textContent = ''); return; }
  const sec = Math.max(0, Math.ceil((B.deadline - Date.now()) / 1000));
  const mine = B.view.turn === B.view.me;
  const el = $(mine ? '#timerMe' : '#timerOpp'), other = $(mine ? '#timerOpp' : '#timerMe');
  if (other) other.textContent = '';
  if (el) { el.textContent = `⏱ ${sec}`; el.classList.toggle('low', sec <= 15); }
}

$('#logBtn').addEventListener('click', e => {
  e.stopPropagation();
  if (!B?.view) return;
  modal(`<h3>ログ</h3><div class="log-list">${B.view.log.map(l => esc(l)).join('<br>')}</div><button class="mbtn" id="mClose">閉じる</button>`, box => box.querySelector('#mClose').onclick = closeModal);
});
$('#concedeBtn').addEventListener('click', e => {
  e.stopPropagation();
  if (!B) return;
  if (B.view?.over) return leaveBattle();
  modal(`<h3>降参しますか？</h3><div class="row3" style="grid-template-columns:1fr 1fr"><button class="mbtn" id="mNo">続ける</button><button class="mbtn primary" id="mYes">降参</button></div>`, box => {
    box.querySelector('#mNo').onclick = closeModal;
    box.querySelector('#mYes').onclick = () => { closeModal(); B.act({ type: 'concede' }); };
  });
});
$('#emoteRow').innerHTML = EMOTES.map(e => `<button data-e="${e}">${e}</button>`).join('');
$('#emoteBtn').addEventListener('click', e => { e.stopPropagation(); $('#emoteRow').classList.toggle('hidden'); });
$$('#emoteRow button').forEach(b => b.addEventListener('click', e => {
  e.stopPropagation();
  $('#emoteRow').classList.add('hidden');
  if (B?.mode === 'online') { B.net.send({ t: 'emote', e: b.dataset.e }); showEmote('#myEmote', b.dataset.e); }
}));
function showEmote(sel, e) {
  const el = $(sel);
  el.textContent = e;
  el.classList.remove('hidden');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add('hidden'), 2000);
}

function onGameOver(v) {
  if (rewarded) return;
  rewarded = true;
  const win = v.winner === v.me, draw = v.winner === -1;
  let reward;
  if (B.mode === 'solo') reward = draw ? 15 : win ? SOLO[B.level].reward : 10;
  else reward = draw ? 40 : win ? 100 : 30;
  save.coins += reward;
  if (win) save.stats.w++; else if (!draw) save.stats.l++;
  persist();
  const cur = B;
  setTimeout(() => {
    if (B !== cur || !B.view?.over) return;
    modal(`
      <div class="big">${draw ? '🤝' : win ? '🏆' : '💀'}</div>
      <h3>${draw ? '引き分け' : win ? '勝利！' : '敗北…'}</h3>
      <div class="reward">+${reward} 🪙</div>
      <p style="text-align:center">所持コイン: ${save.coins}</p>
      ${B.mode === 'online' ? '<p style="text-align:center" id="rematchNote"></p>' : ''}
      <button class="mbtn primary" id="mAgain">${B.mode === 'solo' ? 'もう一度' : '再戦をリクエスト'}</button>
      <button class="mbtn" id="mPack">🎴 パックを引く</button>
      <button class="mbtn ghost" id="mHome">ホームへ</button>`, box => {
      box.querySelector('#mAgain').onclick = () => {
        if (B.mode === 'solo') { const lv = B.level; closeModal(); startSolo(lv); }
        else { B.net.send({ t: 'rematch', deck: save.deck }); box.querySelector('#mAgain').disabled = true; box.querySelector('#rematchNote').textContent = '相手の返事を待っています…'; }
      };
      box.querySelector('#mPack').onclick = () => { leaveBattle(); show('pack'); };
      box.querySelector('#mHome').onclick = () => leaveBattle();
    });
    $('#modal').dataset.lock = '1';
  }, 900);
}

function leaveBattle() {
  delete $('#modal').dataset.lock;
  closeModal();
  if (B?.mode === 'online') B.net.close();
  B = null;
  show('home');
}

// ================= オンライン =================
function renderOnline() {
  $('#nameInput').value = save.name;
  $('#onlineMenu').classList.remove('hidden');
  $('#onlineWait').classList.add('hidden');
}
$('#nameInput').addEventListener('change', () => { save.name = $('#nameInput').value.trim().slice(0, 12); persist(); });
const myName = () => (save.name = ($('#nameInput').value.trim() || save.name || 'プレイヤー').slice(0, 12), persist(), save.name);

let net = null;
function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
function waitUI(text, code) {
  $('#onlineMenu').classList.add('hidden');
  $('#onlineWait').classList.remove('hidden');
  $('#waitText').textContent = text;
  $('#roomCodeBox').classList.toggle('hidden', !code);
  if (code) $('#roomCode').textContent = code;
}
$('#randomBtn').addEventListener('click', async () => {
  myName();
  waitUI('対戦相手を探しています…');
  try {
    const r = await (await fetch('/api/match')).json();
    connect(r.room, { random: true, host: r.host });
  } catch { toast('サーバーに接続できません'); renderOnline(); }
});
$('#createRoomBtn').addEventListener('click', () => { myName(); const code = genCode(); waitUI('友達の参加を待っています…', code); connect(code, {}); });
$('#joinRoomBtn').addEventListener('click', () => {
  const code = $('#roomInput').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length < 3) return toast('ルームコードを入力してください');
  myName(); waitUI('接続中…'); connect(code, {});
});
$('#copyLinkBtn').addEventListener('click', async () => {
  const url = `${location.origin}${location.pathname}#room=${$('#roomCode').textContent}`;
  try { await navigator.clipboard.writeText(url); toast('招待リンクをコピーしました'); } catch { toast(url, 4000); }
});
$('#cancelWaitBtn').addEventListener('click', () => { net?.close(); renderOnline(); });
$('#onlineBack').addEventListener('click', () => { net?.close(); show('home'); });

function connect(room, opts) {
  net?.close();
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  let ws, closedByUser = false, retries = 0, keepTimer = null, started = false;
  const tokenKey = 'pb_tok_' + room;
  const n = {
    room,
    send(m) { if (ws?.readyState === 1) ws.send(JSON.stringify(m)); },
    close() {
      closedByUser = true;
      clearInterval(keepTimer);
      if (opts.random && opts.host && !started) fetch('/api/match?cancel=' + room).catch(() => {});
      try { n.send({ t: 'leave' }); ws?.close(); } catch {}
      if (net === n) net = null;
    },
  };
  net = n;
  if (opts.random && opts.host) keepTimer = setInterval(() => fetch('/api/match?keep=' + room).catch(() => {}), 5000);

  const open = () => {
    ws = new WebSocket(`${proto}//${location.host}/ws/${room}`);
    ws.onopen = () => { retries = 0; n.send({ t: 'join', name: save.name, deck: save.deck, token: sessionStorage.getItem(tokenKey) }); };
    ws.onmessage = e => {
      let m; try { m = JSON.parse(e.data); } catch { return; }
      if (net !== n) return;
      switch (m.t) {
        case 'joined': try { sessionStorage.setItem(tokenKey, m.token); } catch {} break;
        case 'waiting': if (!opts.random) waitUI('友達の参加を待っています…', room); else waitUI('対戦相手を探しています…'); break;
        case 'state': {
          clearInterval(keepTimer);
          const fresh = !B || B.mode !== 'online' || B.net !== n || (B.view?.over && !m.v.over);
          if (fresh) {
            started = true;
            B = { mode: 'online', net: n, view: null, me: m.v.me, oppEmoji: '🧝', act: a => n.send({ t: 'action', a }) };
            enterBattle();
          }
          B.deadline = m.deadline;
          B.oppOffline = m.oppOnline === false;
          updateBattle(m.v);
          break;
        }
        case 'error':
          toast(m.msg);
          if (m.fatal) { closedByUser = true; renderOnline(); }
          break;
        case 'emote': showEmote('#oppEmote', m.e); break;
        case 'opp_away': if (B?.net === n) { B.oppOffline = true; renderBattle(); } toast('相手の接続が切れました。復帰を待っています…', 2500); break;
        case 'opp_back': if (B?.net === n) { B.oppOffline = false; renderBattle(); } toast('相手が復帰しました'); break;
        case 'opp_left': toast('相手が退出しました', 2500); { const b = $('#mAgain'); if (b) { b.disabled = true; $('#rematchNote') && ($('#rematchNote').textContent = '相手は退出しました'); } } break;
        case 'rematch_req': { const note = $('#rematchNote'); if (note) note.textContent = '相手が再戦を希望しています！'; else toast('相手が再戦を希望しています'); break; }
      }
    };
    ws.onclose = () => {
      if (closedByUser || net !== n) return;
      if (retries++ < 5) { setTimeout(() => { if (!closedByUser && net === n) open(); }, 1000 * retries); }
      else { toast('接続が切れました'); if (B?.net === n) leaveBattle(); else renderOnline(); }
    };
  };
  open();
}

// ================= 起動 =================
save = loadSave();
persist();
show('home');
fetch('/api/health', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(j => {
  onlineAvailable = !!j?.online;
  if (!$('#home').classList.contains('hidden')) renderHome();
  const m = location.hash.match(/room=([A-Z0-9]+)/i);
  if (m && onlineAvailable) {
    history.replaceState(null, '', location.pathname);
    show('online');
    $('#roomInput').value = m[1].toUpperCase();
    toast('ルームコードが入力されました。「参加」を押してね');
  }
}).catch(() => {});
