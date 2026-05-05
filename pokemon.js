(() => {
'use strict';
const D = window.PMD;
const $ = id => document.getElementById(id);

// ===== DOM =====
const canvas = $('game'), ctx = canvas.getContext('2d');
const overlay = $('overlay'), startBtn = $('startBtn'), continueBtn = $('continueBtn');
const textbox = $('textbox'), textContent = $('textContent');
const battleMenu = $('battleMenu'), battleContent = $('battleContent');
const partyModal = $('partyModal'), partyGrid = $('partyGrid'), closeParty = $('closeParty');
const partyCntEl = $('partyCnt'), moneyEl = $('money'), badgesEl = $('badges'), ballsEl = $('balls'), potionsEl = $('potions');

// ===== Save =====
const SAVE_KEY = 'monfight_v1';
const defaultSave = {
  party: [], caught: [],
  starterTaken: false, defeatedGym: false,
  legendDefeated: { draginus: false, honooou: false },
  badges: 0, money: 100, balls: 5, potions: 3,
  px: 4, py: 4, pdir: 'down',
};
let save = { ...defaultSave };
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) save = { ...defaultSave, ...JSON.parse(raw) };
  } catch (e) {}
}
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }
function updateHUD() {
  partyCntEl.textContent = save.party.length;
  moneyEl.textContent = save.money;
  badgesEl.textContent = save.badges;
  ballsEl.textContent = save.balls;
  potionsEl.textContent = save.potions;
}

// ===== Audio (synthesized) =====
const Sfx = {
  ctx: null,
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) { this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = 0.4; this.master.connect(this.ctx.destination); }
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  tone(f, d, t = 'square', v = 0.16, slide = null) {
    if (!this.ctx) return;
    const tt = this.ctx.currentTime, osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.type = t; osc.frequency.setValueAtTime(f, tt);
    if (slide !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), tt + d);
    g.gain.setValueAtTime(v, tt); g.gain.exponentialRampToValueAtTime(0.001, tt + d);
    osc.connect(g).connect(this.master); osc.start(tt); osc.stop(tt + d + 0.02);
  },
  step()    { this.tone(220, 0.04, 'square', 0.06); },
  bump()    { this.tone(140, 0.10, 'sawtooth', 0.12, 80); },
  encounter() { this.tone(440, 0.08, 'square', 0.18, 880); setTimeout(() => this.tone(660, 0.16, 'square', 0.18, 1320), 90); },
  hit()     { this.tone(180, 0.08, 'sawtooth', 0.20, 100); },
  superEffective() { this.tone(800, 0.08, 'square', 0.22, 1600); setTimeout(() => this.tone(1200, 0.10, 'square', 0.22), 90); },
  faint()   { this.tone(440, 0.10, 'square', 0.22); setTimeout(() => this.tone(330, 0.10, 'square', 0.22), 110); setTimeout(() => this.tone(220, 0.30, 'square', 0.22, 110), 220); },
  catchOk() { this.tone(523, 0.10, 'triangle', 0.20); setTimeout(() => this.tone(659, 0.10, 'triangle', 0.20), 100); setTimeout(() => this.tone(784, 0.10, 'triangle', 0.20), 200); setTimeout(() => this.tone(1047, 0.30, 'triangle', 0.22), 300); },
  catchFail() { this.tone(220, 0.20, 'sawtooth', 0.18, 110); },
  heal()    { this.tone(880, 0.10, 'triangle', 0.18); setTimeout(() => this.tone(1320, 0.20, 'triangle', 0.20), 100); },
  victory() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.12, 'triangle', 0.22), i * 130)); },
  badge()   { [659, 784, 988, 1175, 1568].forEach((f, i) => setTimeout(() => this.tone(f, 0.15, 'triangle', 0.24), i * 150)); },
  legend()  { [82, 110, 165, 220, 330, 440, 660].forEach((f, i) => setTimeout(() => this.tone(f, 0.20, 'sawtooth', 0.20), i * 200)); },
};

// ===== Canvas / virtual resolution =====
const VW = 320, VH = 192;
const TS = 16;
function resize() {
  canvas.width = VW; canvas.height = VH;
  const stage = canvas.parentElement;
  const sw = stage.clientWidth, sh = stage.clientHeight;
  const scale = Math.min(sw / VW, sh / VH);
  canvas.style.width = (VW * scale) + 'px';
  canvas.style.height = (VH * scale) + 'px';
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 200));

// ===== State =====
const state = {
  scene: 'title', // title | overworld | battle
  // Movement
  tx: 4, ty: 4, fromTx: 4, fromTy: 4,
  pdir: 'down',
  moving: false, moveProgress: 0,
  stepCount: 0,
  cam: { x: 0, y: 0 },
  // Map runtime modifications
  mapOverride: {}, // key "x,y" -> char
  // Text
  text: { active: false, queue: [], onDone: null },
  // Battle
  battle: null,
  // Anim timers
  anims: [],
  // Pending after-text actions
  pendingEncounter: null,
};

// ===== Map helpers (with override) =====
function tileAtRT(tx, ty) {
  const k = tx + ',' + ty;
  if (state.mapOverride[k]) return state.mapOverride[k];
  return D.tileAt(tx, ty);
}
function setTile(tx, ty, ch) { state.mapOverride[tx + ',' + ty] = ch; }

// ===== Text box =====
function showText(msg, onDone) {
  state.text.queue = msg.split('|').map(s => s.trim()).filter(Boolean);
  state.text.onDone = onDone || null;
  state.text.active = true;
  advanceText();
}
function advanceText() {
  if (state.text.queue.length === 0) {
    textbox.classList.remove('active');
    state.text.active = false;
    const cb = state.text.onDone; state.text.onDone = null;
    if (cb) cb();
    return;
  }
  textContent.textContent = state.text.queue.shift();
  textbox.classList.add('active');
}

// ===== Movement =====
function tryMove(dir) {
  if (state.scene !== 'overworld' || state.moving || state.text.active || state.battle) return;
  state.pdir = dir;
  const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
  const dy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
  const nx = state.tx + dx, ny = state.ty + dy;
  const ch = tileAtRT(nx, ny);
  const tile = D.TILES[ch];
  if (!tile) { Sfx.bump(); return; }
  if (tile.walk === false) { Sfx.bump(); return; }
  if (tile.walk === 'bridge' && save.badges < 1) {
    showText('ここから先は橋がかかっていない…|バッジを取れば渡れるかもしれない。');
    Sfx.bump();
    return;
  }
  // Legendary tile: trigger encounter when stepping ON it (we treat as walk: false but special)
  state.fromTx = state.tx; state.fromTy = state.ty;
  state.tx = nx; state.ty = ny;
  state.moving = true; state.moveProgress = 0;
  state.stepCount++;
}

function onArrive() {
  state.fromTx = state.tx; state.fromTy = state.ty;
  const ch = tileAtRT(state.tx, state.ty);
  const tile = D.TILES[ch];
  if (tile && tile.legend) {
    interactLegend(tile.legend, state.tx, state.ty);
    return;
  }
  if (tile && tile.encounter) {
    if (Math.random() < 0.13) {
      const enc = D.pickEncounter(D.encounterAt(state.tx, state.ty));
      Sfx.encounter();
      setTimeout(() => startEncounter(enc), 350);
    }
  }
}

function interact() {
  if (state.scene !== 'overworld' || state.moving || state.battle) return;
  if (state.text.active) { advanceText(); return; }
  const dx = state.pdir === 'left' ? -1 : state.pdir === 'right' ? 1 : 0;
  const dy = state.pdir === 'up' ? -1 : state.pdir === 'down' ? 1 : 0;
  const fx = state.tx + dx, fy = state.ty + dy;
  const ch = tileAtRT(fx, fy);
  if (ch === 'S') interactStarter();
  else if (ch === 'L') interactGym();
  else if (ch === '1') interactLegend('draginus', fx, fy);
  else if (ch === '2') interactLegend('honooou', fx, fy);
  else if (ch === 'D') showText('鍵がかかっている。');
  else if (ch === 'R' || ch === 'B') {} // walls: no interaction
}

// ===== Camera =====
function smoothPos() {
  const t = state.moveProgress;
  return {
    x: state.fromTx + (state.tx - state.fromTx) * t,
    y: state.fromTy + (state.ty - state.fromTy) * t,
  };
}
function updateCam() {
  const p = smoothPos();
  state.cam.x = p.x * TS - VW / 2 + TS / 2;
  state.cam.y = p.y * TS - VH / 2 + TS / 2;
  state.cam.x = Math.max(0, Math.min(D.MAP_W * TS - VW, state.cam.x));
  state.cam.y = Math.max(0, Math.min(D.MAP_H * TS - VH, state.cam.y));
}

// ===== Battle =====
function freshActiveMon() {
  for (const m of save.party) if (m.hp > 0) return m;
  return null;
}
function startEncounter(enc) {
  const wild = D.makeMon(enc.id, enc.level);
  startBattleData({ wild, isWild: true });
}
function startBattleData({ wild, isLeader, team }) {
  const player = freshActiveMon();
  if (!player) { showText('戦えるモンスターがいない!'); return; }
  state.battle = {
    type: isLeader ? 'leader' : (wild ? 'wild' : 'static'),
    enemyTeam: team || (wild ? [{ id: wild.id, level: wild.level, instance: wild }] : []),
    enemyIdx: 0,
    enemy: wild || (team && D.makeMon(team[0].id, team[0].level)),
    player: player ? player : null,
    queue: [],
    awaiting: null, // 'menu' | 'fight' | 'item' | 'switch' | 'text'
    flash: 0,
    enemyShakeT: 0,
    playerShakeT: 0,
    runs: 0,
  };
  state.scene = 'battle';
  // Init enemy if from team list
  if (state.battle.enemy && state.battle.enemy.maxHp === undefined) {
    state.battle.enemy = D.makeMon(state.battle.enemy.id, state.battle.enemy.level);
  }
  hideBattleMenu();
  setTimeout(() => {
    queueText(`${isLeader ? 'ジムリーダーは' : '野生の'}${state.battle.enemy.name}が現れた!`);
    queueText(`いけ! ${state.battle.player.name}!`);
    runQueue(showRootMenu);
  }, 400);
}
function queueText(msg) { state.battle.queue.push({ kind: 'text', msg }); }
function queueAct(fn)   { state.battle.queue.push({ kind: 'act', fn }); }

function runQueue(after) {
  if (!state.battle) { if (after) after(); return; }
  // Idempotent: if already processing, just remember the new after callback
  if (state.battle._running) {
    if (after) (state.battle._afters = state.battle._afters || []).push(after);
    return;
  }
  state.battle._running = true;
  state.battle._afters = after ? [after] : [];
  function step() {
    if (!state.battle) return;
    if (state.battle.queue.length === 0) {
      state.battle._running = false;
      const afters = state.battle._afters || [];
      state.battle._afters = [];
      afters.forEach(a => a && a());
      return;
    }
    const it = state.battle.queue.shift();
    if (it.kind === 'text') showText(it.msg, step);
    else if (it.kind === 'act') it.fn(step);
  }
  step();
}

// Battle menu
function hideBattleMenu() { battleMenu.classList.remove('active'); }
function showBattleMenu(items) {
  battleContent.innerHTML = '';
  items.forEach(it => {
    const b = document.createElement('button');
    b.className = 'menuBtn'; b.disabled = !!it.disabled;
    b.innerHTML = it.label;
    b.onclick = () => { Sfx.init(); Sfx.resume(); it.onClick && it.onClick(); };
    battleContent.appendChild(b);
  });
  battleMenu.classList.add('active');
}
function showRootMenu() {
  if (!state.battle) return;
  state.battle.awaiting = 'menu';
  showBattleMenu([
    { label: '⚔ たたかう',    onClick: showFightMenu },
    { label: '🎒 バッグ',     onClick: showBagMenu },
    { label: '🔄 こうたい',   onClick: showSwitchMenu, disabled: save.party.filter(m => m.hp > 0).length < 2 },
    { label: '🏃 にげる',     onClick: tryRun, disabled: state.battle.type === 'leader' },
  ]);
}
function showFightMenu() {
  const p = state.battle.player;
  const items = p.moves.map(mid => {
    const m = D.MOVES[mid];
    return {
      label: `<span>${m.name}</span><span class="tag ${m.type}">${m.type}</span>`,
      onClick: () => playerUseMove(mid),
    };
  });
  items.push({ label: '← もどる', onClick: showRootMenu });
  showBattleMenu(items);
}
function showBagMenu() {
  showBattleMenu([
    { label: `🔴 モンボール (${save.balls})`, onClick: useBall, disabled: save.balls <= 0 || state.battle.type === 'leader' },
    { label: `💊 きずぐすり (${save.potions})`, onClick: usePotion, disabled: save.potions <= 0 },
    { label: '← もどる', onClick: showRootMenu },
  ]);
}
function showSwitchMenu() {
  const items = save.party.map((m, i) => ({
    label: `${m.name} Lv${m.level} HP ${m.hp}/${m.maxHp}`,
    onClick: () => {
      if (m.hp <= 0) { return; }
      if (state.battle.player === m) { showRootMenu(); return; }
      hideBattleMenu();
      queueText(`${state.battle.player.name} もどれ! 行け ${m.name}!`);
      queueAct(done => { state.battle.player = m; done(); });
      runQueue(showRootMenu);
    },
    disabled: m.hp <= 0,
  }));
  items.push({ label: '← もどる', onClick: showRootMenu });
  showBattleMenu(items);
}

// Damage formula
function calcDamage(attacker, defender, move) {
  if (Math.random() * 100 > move.acc) return { miss: true };
  const stab = attacker.type === move.type ? 1.5 : 1;
  const e = D.eff(move.type, defender.type);
  const r = 0.85 + Math.random() * 0.15;
  const crit = Math.random() < 0.0625 ? 1.5 : 1;
  let dmg = ((2 * attacker.level / 5 + 2) * move.power * attacker.atk / Math.max(1, defender.def) / 50 + 2) * stab * e * r * crit;
  return { dmg: Math.max(1, Math.floor(dmg)), eff: e, crit: crit > 1 };
}

function playerUseMove(mid) {
  hideBattleMenu();
  const move = D.MOVES[mid];
  // Determine order by speed
  const enemyMoveId = state.battle.enemy.moves[Math.floor(Math.random() * state.battle.enemy.moves.length)];
  const enemyMove = D.MOVES[enemyMoveId];
  const playerFirst = state.battle.player.spd >= state.battle.enemy.spd;
  if (playerFirst) {
    runMoveSeq(state.battle.player, state.battle.enemy, move, true, () => {
      if (state.battle.enemy.hp <= 0) return;
      runMoveSeq(state.battle.enemy, state.battle.player, enemyMove, false, postTurn);
    });
  } else {
    runMoveSeq(state.battle.enemy, state.battle.player, enemyMove, false, () => {
      if (state.battle.player.hp <= 0) return;
      runMoveSeq(state.battle.player, state.battle.enemy, move, true, postTurn);
    });
  }
}

function runMoveSeq(att, def, move, isPlayer, after) {
  queueText(`${att.name}の ${move.name}!`);
  queueAct(done => {
    const r = calcDamage(att, def, move);
    if (r.miss) {
      queueText('しかし当たらなかった!');
      done();
      return;
    }
    def.hp = Math.max(0, def.hp - r.dmg);
    if (isPlayer) state.battle.enemyShakeT = 0.5;
    else state.battle.playerShakeT = 0.5;
    state.battle.flash = 0.25;
    Sfx.hit();
    if (r.eff > 1) { queueText('効果はばつぐんだ!'); Sfx.superEffective(); }
    else if (r.eff < 1 && r.eff > 0) queueText('効果はいまひとつのようだ…');
    else if (r.eff === 0) queueText('ぜんぜん効いていない!');
    if (r.crit) queueText('急所に当たった!');
    if (def.hp <= 0) {
      Sfx.faint();
      queueText(`${def.name}は たおれた!`);
      queueAct(done2 => { handleFaint(isPlayer, done2); });
    }
    done();
  });
  runQueue(after);
}

function handleFaint(playerWasAtt, after) {
  // playerWasAtt = true means player attacked, so DEFENDER (enemy) fainted
  if (playerWasAtt) {
    // Enemy fainted - grant XP
    const gain = Math.floor(state.battle.enemy.exp * state.battle.enemy.level / 7);
    state.battle.player.xp = (state.battle.player.xp || 0) + gain;
    queueText(`${state.battle.player.name}は ${gain} EXPもらった!`);
    let leveled = false;
    while (state.battle.player.xp >= state.battle.player.xpNext && state.battle.player.level < 100) {
      state.battle.player.xp -= state.battle.player.xpNext;
      state.battle.player.level++;
      const sp = D.MONSTERS[state.battle.player.id];
      const oldMaxHp = state.battle.player.maxHp;
      state.battle.player.maxHp = Math.floor((2 * sp.hp * state.battle.player.level) / 100) + state.battle.player.level + 10;
      state.battle.player.hp += (state.battle.player.maxHp - oldMaxHp);
      state.battle.player.atk = Math.floor((2 * sp.atk * state.battle.player.level) / 100) + 5;
      state.battle.player.def = Math.floor((2 * sp.def * state.battle.player.level) / 100) + 5;
      state.battle.player.spd = Math.floor((2 * sp.spd * state.battle.player.level) / 100) + 5;
      state.battle.player.xpNext = Math.floor(Math.pow(state.battle.player.level + 1, 3) - Math.pow(state.battle.player.level, 3));
      leveled = true;
      queueText(`${state.battle.player.name}は Lv${state.battle.player.level}に上がった!`);
    }
    queueAct(done => {
      state.battle.enemyIdx++;
      if (state.battle.enemyTeam.length > state.battle.enemyIdx) {
        const nx = state.battle.enemyTeam[state.battle.enemyIdx];
        state.battle.enemy = D.makeMon(nx.id, nx.level);
        queueText(`相手は次に ${state.battle.enemy.name} を繰り出した!`);
        queueAct(d2 => { showRootMenu(); d2(); });
        done();
      } else {
        endBattle('victory');
        done();
      }
    });
  } else {
    queueAct(done => {
      const next = freshActiveMon();
      if (next) {
        state.battle.player = next;
        queueText(`いけ! ${next.name}!`);
        queueAct(d2 => { showRootMenu(); d2(); });
        done();
      } else {
        endBattle('defeat');
        done();
      }
    });
  }
  after();
}

function postTurn() {
  if (!state.battle) return;
  if (state.battle.enemy.hp <= 0) return; // already handled
  if (state.battle.player.hp <= 0) return; // already handled
  showRootMenu();
}

function endBattle(result) {
  hideBattleMenu();
  if (result === 'victory') {
    Sfx.victory();
    if (state.battle.type === 'leader') {
      queueText('ジムリーダー:「まいった! バッジを受け取れ。」');
      queueAct(done => {
        save.badges += 1;
        save.defeatedGym = true;
        save.balls += 5;
        save.money += 500;
        Sfx.badge();
        // Spawn legendaries on walkable tiles after gym victory
        if (!save.legendDefeated.draginus) setTile(5, 12, '1');
        if (!save.legendDefeated.honooou) setTile(33, 4, '2');
        persist(); updateHUD();
        queueText('バッジを手に入れた! ボール+5、$500もらった!');
        queueText('伝説のモンスターが地図に現れた!');
        queueText('町の周辺を探してみよう…');
        done();
      });
    } else {
      const cash = state.battle.enemy.level * 8;
      save.money += cash; persist(); updateHUD();
      queueText(`$${cash} を手に入れた!`);
    }
    queueAct(done => { exitBattle(); done(); });
  } else if (result === 'defeat') {
    queueText('あなたのモンスターはみんな倒れた…');
    queueText('町に戻された…');
    queueAct(done => {
      save.party.forEach(m => { m.hp = m.maxHp; });
      save.px = 4; save.py = 4; save.pdir = 'down';
      state.tx = 4; state.ty = 4; state.fromTx = 4; state.fromTy = 4;
      save.money = Math.max(0, save.money - 100);
      persist(); updateHUD();
      exitBattle();
      done();
    });
  } else if (result === 'caught') {
    queueText(`${state.battle.enemy.name}を 捕まえた!`);
    queueAct(done => {
      const caught = D.makeMon(state.battle.enemy.id, state.battle.enemy.level);
      caught.hp = state.battle.enemy.hp;
      if (save.party.length < 6) save.party.push(caught);
      if (!save.caught.includes(state.battle.enemy.id)) save.caught.push(state.battle.enemy.id);
      if (state.battle.staticLegend) {
        save.legendDefeated[state.battle.staticLegend] = true;
        const k = state.battle.legendXY;
        if (k) setTile(k[0], k[1], '.');
      }
      persist(); updateHUD();
      done();
    });
    queueText('図鑑に登録した。');
    queueAct(done => { exitBattle(); done(); });
  } else if (result === 'fled') {
    queueText('うまく逃げ切れた!');
    queueAct(done => { exitBattle(); done(); });
  }
}

function exitBattle() {
  hideBattleMenu();
  state.scene = 'overworld';
  state.battle = null;
}

function useBall() {
  hideBattleMenu();
  if (state.battle.type === 'leader') return showRootMenu();
  save.balls--;
  persist(); updateHUD();
  queueText('モンボールを投げた!');
  queueAct(done => {
    const enemy = state.battle.enemy;
    const f = ((3 * enemy.maxHp - 2 * enemy.hp) * enemy.catch) / (3 * enemy.maxHp);
    const prob = Math.min(0.95, f / 200);
    const ok = Math.random() < prob;
    setTimeout(() => {
      if (ok) {
        Sfx.catchOk();
        endBattle('caught');
      } else {
        Sfx.catchFail();
        queueText('しまった! 出てきてしまった!');
        queueAct(d2 => {
          const enemyMoveId = enemy.moves[Math.floor(Math.random() * enemy.moves.length)];
          const enemyMove = D.MOVES[enemyMoveId];
          runMoveSeq(enemy, state.battle.player, enemyMove, false, () => {
            if (state.battle.player.hp > 0) showRootMenu();
          });
          d2();
        });
      }
      done();
    }, 700);
  });
  runQueue();
}

function usePotion() {
  hideBattleMenu();
  const p = state.battle.player;
  if (p.hp >= p.maxHp) { showText('すでに体力満タン。', showRootMenu); return; }
  save.potions--; persist(); updateHUD();
  const heal = Math.min(20, p.maxHp - p.hp);
  p.hp += heal;
  Sfx.heal();
  queueText(`${p.name} は ${heal} 回復した!`);
  queueAct(done => {
    const enemyMoveId = state.battle.enemy.moves[Math.floor(Math.random() * state.battle.enemy.moves.length)];
    const enemyMove = D.MOVES[enemyMoveId];
    runMoveSeq(state.battle.enemy, state.battle.player, enemyMove, false, () => {
      if (state.battle.player.hp > 0) showRootMenu();
    });
    done();
  });
  runQueue();
}

function tryRun() {
  hideBattleMenu();
  if (state.battle.type === 'leader') return showRootMenu();
  state.battle.runs++;
  const speed = state.battle.player.spd, oSpeed = state.battle.enemy.spd;
  const odds = ((speed * 32) / Math.max(1, oSpeed / 4) + 30 * state.battle.runs) % 256;
  const ok = Math.random() * 256 < odds || speed > oSpeed * 1.5;
  if (ok) {
    endBattle('fled');
    runQueue();
  } else {
    queueText('にげられない!');
    queueAct(done => {
      const enemyMoveId = state.battle.enemy.moves[Math.floor(Math.random() * state.battle.enemy.moves.length)];
      const enemyMove = D.MOVES[enemyMoveId];
      runMoveSeq(state.battle.enemy, state.battle.player, enemyMove, false, () => {
        if (state.battle.player.hp > 0) showRootMenu();
      });
      done();
    });
    runQueue();
  }
}

// ===== NPC interactions =====
function interactStarter() {
  if (!save.starterTaken) {
    showText('博士:「冒険には相棒が必要じゃ。|これを持っていきなさい。リーファ じゃ。」', () => {
      const mon = D.makeMon('leafin', 5);
      save.party.push(mon);
      save.starterTaken = true;
      if (!save.caught.includes('leafin')) save.caught.push('leafin');
      persist(); updateHUD();
      Sfx.heal();
      showText('リーファ をパーティに加えた!|草むらでモンスターと戦って捕まえなさい。');
    });
  } else {
    showText('博士:「順調かのう?|草むらにはいろんなモンスターがおる。」');
  }
}

function interactGym() {
  if (save.party.length === 0) { showText('まずは博士に話しかけてモンスターをもらおう!'); return; }
  if (save.badges >= 1) {
    showText('ジムリーダー:「もう負けたよ!|伝説のモンスターを探してみな。」');
    return;
  }
  showText('ジムリーダー:「電気タイプの達人だ!|私のモンスターと勝負だ!」', () => {
    startBattleData({ isLeader: true, team: [
      { id: 'pijiko',  level: 10 },
      { id: 'pikamon', level: 14 },
    ]});
  });
}

function interactLegend(id, fx, fy) {
  if (save.legendDefeated[id]) { showText('もう何もいない…'); return; }
  if (save.party.length === 0) { showText('モンスターがいない! まずは博士のところへ!'); return; }
  if (save.badges < 1) { showText('神聖な気配を感じる…|ジムバッジが必要そうだ。'); return; }
  Sfx.legend();
  showText(`伝説の ${D.MONSTERS[id].name} があらわれた!`, () => {
    const wild = D.makeMon(id, id === 'draginus' ? 30 : 32);
    state.battle = null; // reset
    startBattleData({ wild });
    state.battle.staticLegend = id;
    state.battle.legendXY = [fx, fy];
  });
}

// ===== Render =====
function drawHpBar(x, y, mon, showHp) {
  ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, 70, showHp ? 22 : 16);
  ctx.fillStyle = '#fff'; ctx.fillRect(x, y, 68, showHp ? 20 : 14);
  ctx.fillStyle = '#000';
  ctx.font = 'bold 8px sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(`${mon.name} Lv${mon.level}`, x + 3, y + 2);
  // hp bar
  ctx.fillStyle = '#000'; ctx.fillRect(x + 3, y + 11, 60, 3);
  const ratio = mon.hp / mon.maxHp;
  ctx.fillStyle = ratio > 0.5 ? '#4caf50' : ratio > 0.2 ? '#ffc107' : '#f44336';
  ctx.fillRect(x + 3, y + 11, Math.ceil(60 * ratio), 3);
  if (showHp) ctx.fillText(`${mon.hp}/${mon.maxHp}`, x + 3, y + 14);
}

function renderOverworld() {
  // Sky/grass background
  ctx.fillStyle = '#5fbb6a';
  ctx.fillRect(0, 0, VW, VH);
  const startTx = Math.floor(state.cam.x / TS);
  const startTy = Math.floor(state.cam.y / TS);
  for (let ty = startTy; ty <= startTy + (VH / TS) + 1; ty++) {
    for (let tx = startTx; tx <= startTx + (VW / TS) + 1; tx++) {
      const ch = tileAtRT(tx, ty);
      const tile = D.TILES[ch];
      if (!tile) continue;
      const sx = Math.round(tx * TS - state.cam.x);
      const sy = Math.round(ty * TS - state.cam.y);
      tile.paint(ctx, sx, sy, TS);
    }
  }
  // Player
  const p = smoothPos();
  const px = Math.round(p.x * TS - state.cam.x);
  const py = Math.round(p.y * TS - state.cam.y);
  D.drawSprite(ctx, D.PLAYER_SPR[state.pdir], px, py - 4, 1);
}

function renderBattle() {
  // Sky
  const grd = ctx.createLinearGradient(0, 0, 0, VH * 0.7);
  grd.addColorStop(0, '#84c5e8'); grd.addColorStop(1, '#cdebff');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, VW, VH * 0.7);
  // Ground
  ctx.fillStyle = '#7ec97e'; ctx.fillRect(0, VH * 0.65, VW, VH * 0.35);
  ctx.fillStyle = '#5fbb6a'; ctx.fillRect(0, VH * 0.7, VW, VH * 0.3);
  // platforms
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(VW * 0.78, VH * 0.55, 38, 8, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(VW * 0.22, VH * 0.84, 44, 9, 0, 0, Math.PI*2); ctx.fill();
  // shake
  let exShake = 0, eyShake = 0, pxShake = 0, pyShake = 0;
  if (state.battle) {
    if (state.battle.enemyShakeT > 0) {
      exShake = (Math.random() - 0.5) * 8 * state.battle.enemyShakeT;
      eyShake = (Math.random() - 0.5) * 4 * state.battle.enemyShakeT;
    }
    if (state.battle.playerShakeT > 0) {
      pxShake = (Math.random() - 0.5) * 8 * state.battle.playerShakeT;
      pyShake = (Math.random() - 0.5) * 4 * state.battle.playerShakeT;
    }
    // enemy
    const e = state.battle.enemy;
    if (e) {
      D.drawSprite(ctx, D.SPRITES[e.id], Math.round(VW * 0.62 + exShake), Math.round(28 + eyShake), 3);
      drawHpBar(8, 8, e, false);
    }
    // player
    const p = state.battle.player;
    if (p) {
      D.drawSprite(ctx, D.SPRITES[p.id], Math.round(VW * 0.08 + pxShake), Math.round(94 + pyShake), 3);
      drawHpBar(VW - 80, 95, p, true);
    }
    // flash
    if (state.battle.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${state.battle.flash})`;
      ctx.fillRect(0, 0, VW, VH);
    }
  }
}

function render() {
  ctx.clearRect(0, 0, VW, VH);
  ctx.imageSmoothingEnabled = false;
  if (state.scene === 'overworld') renderOverworld();
  else if (state.scene === 'battle') renderBattle();
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  // Movement animation
  if (state.moving) {
    state.moveProgress += dt * 5;
    if (state.moveProgress >= 1) {
      state.moveProgress = 1;
      state.moving = false;
      Sfx.step();
      onArrive();
    }
  }
  if (state.battle) {
    if (state.battle.enemyShakeT > 0) state.battle.enemyShakeT = Math.max(0, state.battle.enemyShakeT - dt * 4);
    if (state.battle.playerShakeT > 0) state.battle.playerShakeT = Math.max(0, state.battle.playerShakeT - dt * 4);
    if (state.battle.flash > 0) state.battle.flash = Math.max(0, state.battle.flash - dt * 3);
  }
  updateCam();
  render();
  requestAnimationFrame(loop);
}

// ===== Input =====
const heldDirs = new Set();
let dirRepeatTimer = 0;
function onDir(dir) { Sfx.init(); Sfx.resume(); tryMove(dir); }
['du','dd','dl','dr'].forEach(id => {
  const el = $(id);
  const dir = id === 'du' ? 'up' : id === 'dd' ? 'down' : id === 'dl' ? 'left' : 'right';
  el.addEventListener('pointerdown', e => { e.preventDefault(); heldDirs.add(dir); onDir(dir); });
  el.addEventListener('pointerup', e => { e.preventDefault(); heldDirs.delete(dir); });
  el.addEventListener('pointercancel', e => { heldDirs.delete(dir); });
  el.addEventListener('pointerleave', e => { heldDirs.delete(dir); });
});
$('actA').addEventListener('click', () => { Sfx.init(); Sfx.resume();
  if (state.text.active) advanceText();
  else if (state.scene === 'overworld') interact();
});
$('actB').addEventListener('click', () => {
  if (state.scene === 'overworld' && !state.text.active && !state.battle) togglePartyModal();
});
window.addEventListener('keydown', e => {
  Sfx.init(); Sfx.resume();
  const k = e.key;
  if (state.text.active) {
    if (k === 'Enter' || k === ' ' || k === 'a' || k === 'z' || k === 'A' || k === 'Z') { e.preventDefault(); advanceText(); }
    return;
  }
  if (state.scene === 'overworld' && !state.battle) {
    if (k === 'ArrowUp' || k === 'w') { e.preventDefault(); tryMove('up'); }
    else if (k === 'ArrowDown' || k === 's') { e.preventDefault(); tryMove('down'); }
    else if (k === 'ArrowLeft' || k === 'a') { e.preventDefault(); tryMove('left'); }
    else if (k === 'ArrowRight' || k === 'd') { e.preventDefault(); tryMove('right'); }
    else if (k === 'Enter' || k === ' ' || k === 'z') { e.preventDefault(); interact(); }
    else if (k === 'b' || k === 'x') togglePartyModal();
  }
});

// Auto-repeat held directions
setInterval(() => {
  if (state.scene !== 'overworld' || state.moving || state.text.active || state.battle) return;
  if (heldDirs.size > 0) {
    const dir = heldDirs.values().next().value;
    tryMove(dir);
  }
}, 60);

// ===== Party modal =====
function togglePartyModal() {
  if (partyModal.classList.contains('hidden')) {
    refreshPartyModal();
    partyModal.classList.remove('hidden');
  } else {
    partyModal.classList.add('hidden');
  }
}
function refreshPartyModal() {
  partyGrid.innerHTML = '';
  if (save.party.length === 0) {
    const e = document.createElement('div');
    e.style.opacity = '0.6';
    e.textContent = 'まだモンスターがいない';
    partyGrid.appendChild(e);
    return;
  }
  for (let i = 0; i < save.party.length; i++) {
    const m = save.party[i];
    const card = document.createElement('div');
    card.className = 'partyCard' + (m.hp <= 0 ? ' fainted' : '');
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const cx = c.getContext('2d'); cx.imageSmoothingEnabled = false;
    if (D.SPRITES[m.id]) D.drawSprite(cx, D.SPRITES[m.id], 0, 0, 4);
    const info = document.createElement('div'); info.className = 'partyInfo';
    const ratio = m.hp / m.maxHp;
    info.innerHTML = `<div class="nm">${m.name} <span class="tag ${m.type}">${m.type}</span></div>
      <div>Lv${m.level}  HP ${m.hp}/${m.maxHp}</div>
      <div class="hpbar"><div class="hpfill ${ratio<0.2?'crit':ratio<0.5?'low':''}" style="width:${ratio*100}%"></div></div>`;
    card.appendChild(c); card.appendChild(info);
    partyGrid.appendChild(card);
  }
}
closeParty.addEventListener('click', () => partyModal.classList.add('hidden'));

// ===== Title / start =====
loadSave();
updateHUD();
continueBtn.style.display = save.party.length > 0 ? '' : 'none';
function start(continueRun) {
  Sfx.init(); Sfx.resume();
  if (continueRun) {
    state.tx = save.px; state.ty = save.py;
    state.fromTx = save.px; state.fromTy = save.py;
    state.pdir = save.pdir;
    state.mapOverride = {};
    if (save.defeatedGym) {
      if (!save.legendDefeated.draginus) setTile(5, 12, '1');
      if (!save.legendDefeated.honooou) setTile(33, 4, '2');
    }
  } else {
    save = JSON.parse(JSON.stringify(defaultSave));
    state.tx = save.px; state.ty = save.py;
    state.fromTx = save.px; state.fromTy = save.py;
    state.pdir = save.pdir;
    state.mapOverride = {};
    persist(); updateHUD();
  }
  state.scene = 'overworld';
  overlay.classList.add('hidden');
  resize();
  if (!save.starterTaken) {
    setTimeout(() => showText('博士:「やあ! きみ!|モンスターの世界へようこそ!|そこの私に話しかけてくれ。」'), 500);
  }
}
startBtn.addEventListener('click', () => start(false));
continueBtn.addEventListener('click', () => start(true));

// Auto-save player position periodically
setInterval(() => {
  if (state.scene === 'overworld') {
    save.px = state.tx; save.py = state.ty; save.pdir = state.pdir;
    persist();
  }
}, 5000);

// ===== Init =====
resize();
requestAnimationFrame(t => { last = t; loop(t); });
})();
