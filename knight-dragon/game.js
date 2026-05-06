(() => {
'use strict';

// ============================================================
// SOUND ENGINE (WebAudio - chip tune style)
// ============================================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.seOn = true;
    this.bgmOn = false;
    this._melodyTimer = null;
    this._bassTimer = null;
  }
  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    } catch (e) {}
  }
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  toggleSe() { this.seOn = !this.seOn; return this.seOn; }
  toggleBgm() {
    this.bgmOn = !this.bgmOn;
    if (this.bgmOn) this.startBgm(); else this.stopBgm();
    return this.bgmOn;
  }
  _tone({ freq, type = 'square', dur = 0.1, vol = 0.1, attack = 0.005, slide = 0, delay = 0 }) {
    if (!this.seOn || !this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.linearRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }
  _noise({ dur = 0.1, vol = 0.1, freq = 1000, delay = 0 }) {
    if (!this.seOn || !this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const samples = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, samples, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < samples; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter).connect(gain).connect(this.ctx.destination);
    src.start(t0);
  }
  hit()      { this._tone({ freq: 220, dur: 0.08, vol: 0.18, slide: -120 }); this._noise({ dur: 0.05, vol: 0.06, freq: 800 }); }
  weakHit()  { this._tone({ freq: 440, dur: 0.12, vol: 0.16, type: 'square', slide: 200 }); this._tone({ freq: 660, dur: 0.1, vol: 0.1, type: 'triangle', delay: 0.03 }); }
  crit()     { this._tone({ freq: 800, dur: 0.18, vol: 0.18, slide: -500, type: 'sawtooth' }); this._tone({ freq: 600, dur: 0.2, vol: 0.13, type: 'triangle', delay: 0.02 }); this._noise({ dur: 0.1, vol: 0.05, freq: 2000 }); }
  guard()    { this._noise({ dur: 0.08, vol: 0.1, freq: 2500 }); this._tone({ freq: 300, dur: 0.06, vol: 0.08, type: 'square' }); }
  just()     { this._tone({ freq: 1200, dur: 0.15, vol: 0.13, type: 'sine' }); this._tone({ freq: 1600, dur: 0.18, vol: 0.1, type: 'sine', delay: 0.04 }); this._tone({ freq: 2000, dur: 0.12, vol: 0.08, type: 'sine', delay: 0.08 }); }
  miracle()  { [1100, 1320, 1760, 2200, 2640].forEach((f, i) => this._tone({ freq: f, dur: 0.5, vol: 0.13, type: 'triangle', delay: i * 0.05 })); }
  early()    { this._tone({ freq: 200, dur: 0.05, vol: 0.08, type: 'square' }); }
  piyo()     { this._tone({ freq: 600, dur: 0.08, vol: 0.13, type: 'sine', slide: 800 }); this._tone({ freq: 1400, dur: 0.1, vol: 0.1, type: 'sine', delay: 0.1 }); this._tone({ freq: 880, dur: 0.12, vol: 0.08, type: 'triangle', delay: 0.18 }); }
  enemyAtk() { this._tone({ freq: 110, dur: 0.18, vol: 0.18, type: 'sawtooth', slide: -50 }); this._noise({ dur: 0.1, vol: 0.07, freq: 300 }); }
  apShort()  { this._tone({ freq: 200, dur: 0.06, vol: 0.08, type: 'square' }); }
  special()  { [392, 466, 587, 698, 880, 1047, 1318].forEach((f, i) => this._tone({ freq: f, dur: 0.25, vol: 0.13, type: 'square', delay: i * 0.05 })); this._noise({ dur: 0.4, vol: 0.06, freq: 4000, delay: 0.05 }); }
  victory()  { [523, 659, 784, 1047, 1319].forEach((f, i) => this._tone({ freq: f, dur: 0.3, vol: 0.15, type: 'square', delay: i * 0.15 })); }
  defeat()   { [400, 350, 300, 200].forEach((f, i) => this._tone({ freq: f, dur: 0.4, vol: 0.15, type: 'sawtooth', delay: i * 0.2 })); }
  startBgm() {
    if (!this.ctx) return;
    this.stopBgm();
    const melody = [
      [392, 0.25], [466, 0.25], [587, 0.5],
      [466, 0.25], [392, 0.25], [349, 0.5],
      [311, 0.25], [349, 0.25], [392, 0.5],
      [466, 0.25], [587, 0.25], [466, 0.5],
      [392, 0.25], [349, 0.25], [311, 0.5],
      [349, 0.5], [392, 0.5],
    ];
    const bass = [
      [98, 0.5], [98, 0.5], [131, 0.5], [131, 0.5],
      [110, 0.5], [110, 0.5], [98, 0.5], [98, 0.5],
    ];
    let m = 0, b = 0;
    const playMelody = () => {
      if (!this.bgmOn) return;
      const [f, d] = melody[m];
      this._tone({ freq: f, dur: d * 0.85, vol: 0.045, type: 'square' });
      m = (m + 1) % melody.length;
      this._melodyTimer = setTimeout(playMelody, d * 1000);
    };
    const playBass = () => {
      if (!this.bgmOn) return;
      const [f, d] = bass[b];
      this._tone({ freq: f, dur: d * 0.9, vol: 0.05, type: 'triangle' });
      b = (b + 1) % bass.length;
      this._bassTimer = setTimeout(playBass, d * 1000);
    };
    playMelody();
    playBass();
  }
  stopBgm() {
    if (this._melodyTimer) clearTimeout(this._melodyTimer);
    if (this._bassTimer) clearTimeout(this._bassTimer);
    this._melodyTimer = null;
    this._bassTimer = null;
  }
}

const sound = new SoundEngine();

// ============================================================
// CANVAS
// ============================================================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const W = canvas.width;
const H = canvas.height;

// ============================================================
// DATA
// ============================================================
const WEAPONS = {
  sword:  { name: '剣',     dmg: 8,  pp: 14, color: '#7be0ff', icon: '⚔' },
  spear:  { name: '槍',     dmg: 7,  pp: 14, color: '#ffd066', icon: '🔱' },
  hammer: { name: 'ハンマー', dmg: 12, pp: 12, color: '#cc8855', icon: '🔨' },
};

const ENEMIES = {
  dragon: { name: 'ドラゴン', hp: 110, weak: 'spear',  atkDmg: 14, atk: [2.2, 3.4], color: '#d62828', accent: '#ffce5a' },
  golem:  { name: 'ゴーレム', hp: 150, weak: 'hammer', atkDmg: 16, atk: [2.6, 3.8], color: '#9aa0a8', accent: '#5a5f6b' },
  ghost:  { name: 'ゴースト', hp: 80,  weak: 'sword',  atkDmg: 11, atk: [1.6, 2.6], color: '#c8d0ff', accent: '#fff' },
};

const ENEMY_ORDER = ['ghost', 'dragon', 'golem'];

const SPECIAL_MOVES = {
  'sword,sword,sword':    { name: '剣聖斬',     dmg: 36, color: '#7be0ff', hits: 3 },
  'spear,spear,spear':    { name: '貫穿撃',     dmg: 32, color: '#ffd066', hits: 1 },
  'hammer,hammer,hammer': { name: '大地砕',     dmg: 44, color: '#cc8855', hits: 1 },
  'sword,spear,hammer':   { name: '聖騎士奥義', dmg: 60, color: '#ff80ff', hits: 4 },
  'hammer,spear,sword':   { name: '英雄連舞',   dmg: 50, color: '#ffeb3b', hits: 4 },
};

// ============================================================
// STATE
// ============================================================
let state;
let lastTime = 0;
let shake = 0;

function resetState() {
  state = {
    scene: 'battle',
    knight: createKnight(),
    enemyIndex: 0,
    enemy: createEnemy(ENEMY_ORDER[0]),
    floatTexts: [],
    combo: 0,
    time: 0,
    shieldUntil: 0,
    flashTimer: 0,
    weakHint: '',
    weakHintTimer: 0,
    weaponHistory: [],
    specialFx: null,
    specialFxTimer: 0,
    specialPending: 0,
  };
}

function createKnight() {
  return { hp: 120, maxHp: 120, ap: 5, maxAp: 5, apRegen: 0.7, x: 220, y: 340, hitTimer: 0, attackAnim: 0 };
}

function createEnemy(type) {
  const p = ENEMIES[type];
  return {
    type, name: p.name, hp: p.hp, maxHp: p.hp,
    weak: p.weak, atkDmg: p.atkDmg, atk: p.atk,
    color: p.color, accent: p.accent,
    x: 580, y: 340,
    pp: 0, maxPp: 100, stunned: false, stunTimer: 0,
    attackTimer: rand(p.atk[0], p.atk[1]) + 1.0,
    hitTimer: 0,
    bob: 0,
  };
}

function rand(a, b) { return a + Math.random() * (b - a); }

function addFloat(text, x, y, color, ttl = 0.9, size = 22) {
  state.floatTexts.push({ text, x, y, color, ttl, maxTtl: ttl, size });
}

function previewSpecial(history) {
  if (history.length < 2) return null;
  const [a, b] = history.slice(-2);
  for (const [key, sp] of Object.entries(SPECIAL_MOVES)) {
    const parts = key.split(',');
    if (parts[0] === a && parts[1] === b) {
      return { needWeapon: parts[2], name: sp.name, color: sp.color };
    }
  }
  return null;
}

// ============================================================
// ACTIONS
// ============================================================
function attack(weaponKey) {
  if (state.scene !== 'battle') return;
  const k = state.knight, e = state.enemy;
  if (k.ap < 1) {
    addFloat('AP不足!', k.x, k.y - 60, '#ff8080', 0.8, 16);
    sound.apShort();
    return;
  }
  k.ap -= 1;
  k.attackAnim = 0.3;

  state.weaponHistory.push(weaponKey);
  if (state.weaponHistory.length > 3) state.weaponHistory.shift();

  let special = null;
  if (state.weaponHistory.length === 3) {
    special = SPECIAL_MOVES[state.weaponHistory.join(',')];
  }

  if (special) {
    state.weaponHistory = [];
    fireSpecial(special, weaponKey);
    return;
  }

  // Normal attack
  const w = WEAPONS[weaponKey];
  const isWeak = e.weak === weaponKey;
  const crit = e.stunned;
  const mult = (isWeak ? 1.5 : 1.0) * (crit ? 2 : 1);
  const dmg = Math.round(w.dmg * mult);
  e.hp = Math.max(0, e.hp - dmg);
  e.hitTimer = 0.3;
  shake = Math.min(8, shake + (crit ? 6 : 3));

  if (crit) sound.crit();
  else if (isWeak) sound.weakHit();
  else sound.hit();

  if (!e.stunned) {
    e.pp += w.pp * (isWeak ? 2.6 : 1);
    if (e.pp >= e.maxPp) {
      e.pp = e.maxPp;
      e.stunned = true;
      e.stunTimer = 4;
      e.attackTimer = 999;
      sound.piyo();
      addFloat('PIYO!!', e.x, e.y - 90, '#ffeb3b', 1.4, 28);
    }
  } else {
    k.ap = Math.min(k.maxAp, k.ap + 0.6);
  }

  let label = '';
  if (crit) label = 'CRIT! ';
  else if (isWeak) label = 'WEAK! ';
  addFloat(label + dmg, e.x + (Math.random() * 30 - 15), e.y - 30, crit ? '#ff5252' : (isWeak ? '#ffd066' : '#ffffff'), 0.85);

  if (isWeak && !crit) {
    state.weakHint = `${w.name} は ${e.name} の弱点！`;
    state.weakHintTimer = 1.2;
  }

  if (e.hp <= 0) onEnemyDefeated();
}

function fireSpecial(special, lastWeapon) {
  const e = state.enemy;
  shake = 18;
  state.flashTimer = 0.6;
  state.specialFx = { name: special.name, color: special.color, hits: special.hits };
  state.specialFxTimer = 1.4;
  sound.special();

  // multi-hit damage spread
  const totalDmg = special.dmg;
  const hits = special.hits || 1;
  const perHit = Math.round(totalDmg / hits);
  for (let i = 0; i < hits; i++) {
    setTimeout(() => {
      if (state.scene !== 'battle' || !state.enemy) return;
      const en = state.enemy;
      en.hp = Math.max(0, en.hp - perHit);
      en.hitTimer = 0.3;
      shake = Math.min(20, shake + 5);
      addFloat(`-${perHit}`, en.x + (Math.random() * 60 - 30), en.y - 30 - i * 20, special.color, 0.9, 26);
      if (en.hp <= 0) onEnemyDefeated();
    }, i * 120);
  }
  addFloat(special.name + '!!', W / 2, 180, special.color, 1.6, 38);
}

function tryGuard() {
  if (state.scene !== 'battle') return;
  const k = state.knight, e = state.enemy;
  state.shieldUntil = state.time + 0.35;

  if (e.stunned || e.attackTimer > 0.7) {
    addFloat('早い!', k.x, k.y - 60, '#aaa', 0.6, 16);
    sound.early();
    return;
  }

  const t = e.attackTimer;
  let kind, dmgMult, apGain = 0, hpGain = 0, color = '#80c0ff';
  if (t < 0.07)      { kind = 'MIRACLE'; dmgMult = 0;   apGain = 2; hpGain = 18; color = '#ff80ff'; }
  else if (t < 0.20) { kind = 'JUST';    dmgMult = 0.1; apGain = 1; color = '#ffeb3b'; }
  else               { kind = 'GUARD';   dmgMult = 0.4; color = '#80c0ff'; }

  const dmg = Math.round(e.atkDmg * dmgMult);
  k.hp = Math.max(0, k.hp - dmg);
  k.hp = Math.min(k.maxHp, k.hp + hpGain);
  k.ap = Math.min(k.maxAp, k.ap + apGain);
  state.combo++;
  state.flashTimer = kind === 'MIRACLE' ? 0.4 : kind === 'JUST' ? 0.25 : 0.15;

  if (kind === 'MIRACLE') sound.miracle();
  else if (kind === 'JUST') sound.just();
  else sound.guard();

  let detail = `${kind}`;
  if (dmg > 0) detail += ` -${dmg}`;
  if (hpGain > 0) detail += ` +HP${hpGain}`;
  addFloat(detail, k.x, k.y - 50, color, 1.3, kind === 'MIRACLE' ? 30 : 24);

  e.attackTimer = rand(e.atk[0], e.atk[1]);
  if (!e.stunned) e.pp = Math.min(e.maxPp, e.pp + state.combo * 4);
}

function onEnemyAttackLand() {
  const k = state.knight, e = state.enemy;
  k.hp = Math.max(0, k.hp - e.atkDmg);
  k.hitTimer = 0.3;
  shake = Math.min(10, shake + 8);
  sound.enemyAtk();
  addFloat(`-${e.atkDmg}`, k.x, k.y - 30, '#ff6b6b', 0.85);
  e.attackTimer = rand(e.atk[0], e.atk[1]);
  state.combo = 0;
  if (k.hp <= 0) onDefeat();
}

function onEnemyDefeated() {
  state.enemyIndex++;
  if (state.enemyIndex >= ENEMY_ORDER.length) {
    onVictory();
    return;
  }
  const next = ENEMY_ORDER[state.enemyIndex];
  state.enemy.hp = 0;
  setTimeout(() => {
    if (state.scene !== 'battle') return;
    state.enemy = createEnemy(next);
    state.weaponHistory = [];
    addFloat(`次の敵: ${state.enemy.name}`, W / 2, 100, '#fff', 1.5, 26);
  }, 700);
}

function onVictory() {
  state.scene = 'victory';
  sound.victory();
  showOverlay('VICTORY', '全ての敵を倒した！', 'victory');
}

function onDefeat() {
  state.scene = 'defeat';
  sound.defeat();
  showOverlay('DEFEAT', '騎士は倒れた...', 'defeat');
}

function showOverlay(title, text, cls) {
  const ov = document.getElementById('overlay');
  const t = document.getElementById('overlay-title');
  document.getElementById('overlay-text').textContent = text;
  t.textContent = title;
  t.className = cls;
  ov.classList.remove('hidden');
}

function hideOverlay() {
  document.getElementById('overlay').classList.add('hidden');
}

// ============================================================
// UPDATE
// ============================================================
function update(dt) {
  state.time += dt;
  if (shake > 0) shake = Math.max(0, shake - 30 * dt);
  if (state.flashTimer > 0) state.flashTimer -= dt;
  if (state.weakHintTimer > 0) state.weakHintTimer -= dt;
  if (state.specialFxTimer > 0) {
    state.specialFxTimer -= dt;
    if (state.specialFxTimer <= 0) state.specialFx = null;
  }

  for (const f of state.floatTexts) {
    f.ttl -= dt;
    f.y -= 28 * dt;
  }
  state.floatTexts = state.floatTexts.filter(f => f.ttl > 0);

  if (state.scene !== 'battle') return;
  const k = state.knight, e = state.enemy;
  if (k.hitTimer > 0) k.hitTimer -= dt;
  if (k.attackAnim > 0) k.attackAnim -= dt;
  if (e.hitTimer > 0) e.hitTimer -= dt;

  if (k.ap < k.maxAp) k.ap = Math.min(k.maxAp, k.ap + k.apRegen * dt);

  e.bob += dt;

  if (e.hp <= 0) return;

  if (e.stunned) {
    e.stunTimer -= dt;
    if (e.stunTimer <= 0) {
      e.stunned = false;
      e.pp = 0;
      e.attackTimer = rand(e.atk[0], e.atk[1]);
      addFloat('復活', e.x, e.y - 80, '#fff', 0.8, 18);
    }
  } else {
    e.attackTimer -= dt;
    if (e.attackTimer <= 0) onEnemyAttackLand();
  }
}

// ============================================================
// RENDER
// ============================================================
function render() {
  const ox = (Math.random() - 0.5) * shake;
  const oy = (Math.random() - 0.5) * shake;
  ctx.save();
  ctx.translate(ox, oy);

  drawBackground();

  if (state.flashTimer > 0) {
    ctx.fillStyle = `rgba(255,255,255,${state.flashTimer * 0.4})`;
    ctx.fillRect(0, 0, W, H);
  }

  drawKnight(state.knight);
  drawEnemy(state.enemy);

  drawHpBar(state.knight, '騎士', 30, 30, 250);
  drawHpBar(state.enemy, state.enemy.name, W - 280, 30, 250);
  drawPpBar(state.enemy, W - 280, 70, 250);
  drawApBar(state.knight, 30, 70, 250);

  drawAttackIndicator(state.enemy);

  drawComboHud();

  if (state.specialFx) {
    drawSpecialFx();
  }

  for (const f of state.floatTexts) {
    const alpha = Math.min(1, f.ttl / f.maxTtl);
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${f.size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = f.color;
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillText(f.text, f.x, f.y);
    ctx.globalAlpha = 1;
  }

  if (state.weakHintTimer > 0) {
    ctx.globalAlpha = Math.min(1, state.weakHintTimer);
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#ffd066';
    ctx.strokeText(state.weakHint, W / 2, 130);
    ctx.fillText(state.weakHint, W / 2, 130);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2a3060');
  g.addColorStop(1, '#162038');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#1a4030';
  ctx.fillRect(0, H - 120, W, 120);
  ctx.fillStyle = '#244a3a';
  for (let i = 0; i < W; i += 16) {
    const h = ((i * 37) % 13);
    ctx.fillRect(i, H - 120, 8, 6 + h);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let i = 0; i < 30; i++) {
    const x = (i * 73 + state.time * 8) % W;
    const y = (i * 41) % (H - 150);
    ctx.fillRect(x, y, 2, 2);
  }
}

function px(x, y, c, w = 4, h = 4) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function drawKnight(k) {
  const flash = k.hitTimer > 0 && Math.floor(k.hitTimer * 20) % 2 === 0;
  const guardUp = state.time < state.shieldUntil;
  const atkLunge = k.attackAnim > 0 ? Math.sin(k.attackAnim / 0.3 * Math.PI) * 12 : 0;
  const x = k.x + atkLunge, y = k.y;

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y + 50, 36, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  const skin = flash ? '#fff' : '#ffd9b3';
  const armor = flash ? '#fff' : '#4080d0';
  const armorDark = flash ? '#fff' : '#264a78';
  const metal = flash ? '#fff' : '#c8cfd6';
  const metalDark = flash ? '#fff' : '#7a8088';

  px(x - 16, y - 60, metal, 32, 8);
  px(x - 20, y - 56, metal, 40, 12);
  px(x - 16, y - 44, metalDark, 32, 4);
  px(x - 12, y - 56, '#d04040', 4, 16);
  px(x - 8, y - 40, skin, 16, 8);
  px(x - 4, y - 36, '#222', 4, 4);
  px(x + 4, y - 36, '#222', 4, 4);

  px(x - 20, y - 32, armor, 40, 32);
  px(x - 24, y - 28, armor, 8, 24);
  px(x + 16, y - 28, armor, 8, 24);
  px(x - 16, y - 28, armorDark, 32, 4);
  px(x - 4, y - 24, '#ffd700', 8, 8);

  px(x - 16, y, armorDark, 12, 24);
  px(x + 4, y, armorDark, 12, 24);
  px(x - 16, y + 24, '#3a4050', 12, 8);
  px(x + 4, y + 24, '#3a4050', 12, 8);

  if (guardUp) {
    const sy = y - 20 + Math.sin(state.time * 30) * 1;
    px(x - 44, sy - 16, '#4a90e0', 16, 36);
    px(x - 40, sy - 12, '#80c0ff', 8, 28);
    px(x - 38, sy - 8, '#ffd700', 4, 4);
    ctx.strokeStyle = `rgba(180,220,255,${0.4 + Math.random() * 0.3})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x - 36, sy + 2, 30, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    px(x + 26, y - 36, metal, 4, 36);
    px(x + 22, y - 40, metalDark, 12, 4);
  }
}

function drawEnemy(e) {
  if (e.hp <= 0) return;
  const flash = e.hitTimer > 0 && Math.floor(e.hitTimer * 20) % 2 === 0;
  const bobY = Math.sin(e.bob * 2) * 3;
  const x = e.x, y = e.y + bobY;

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(e.x, e.y + 54, 44, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  const c = flash ? '#fff' : e.color;
  const a = flash ? '#fff' : e.accent;

  if (e.type === 'dragon') {
    px(x - 12, y - 64, c, 32, 24);
    px(x - 16, y - 60, c, 8, 16);
    px(x + 20, y - 60, c, 8, 16);
    px(x + 16, y - 56, '#ff0', 4, 4);
    px(x + 16, y - 48, '#000', 4, 4);
    px(x - 8, y - 50, c, 12, 8);
    px(x - 4, y - 46, '#fff', 4, 4);
    px(x - 28, y - 30, a, 24, 28);
    px(x + 28, y - 30, a, 24, 28);
    px(x - 20, y - 40, c, 40, 56);
    px(x - 24, y - 32, c, 8, 32);
    px(x + 20, y - 32, c, 8, 32);
    px(x - 16, y - 8, a, 32, 8);
    px(x - 12, y + 16, c, 12, 24);
    px(x + 4, y + 16, c, 12, 24);
    px(x + 24, y - 4, c, 32, 8);
    px(x + 52, y - 4, c, 8, 8);
  } else if (e.type === 'golem') {
    px(x - 16, y - 60, c, 32, 24);
    px(x - 8, y - 52, '#f00', 4, 4);
    px(x + 4, y - 52, '#f00', 4, 4);
    px(x - 24, y - 36, c, 48, 40);
    px(x - 32, y - 32, c, 12, 32);
    px(x + 20, y - 32, c, 12, 32);
    px(x - 16, y - 28, a, 32, 4);
    px(x - 12, y - 16, a, 8, 12);
    px(x + 4, y - 16, a, 8, 12);
    px(x - 16, y + 4, c, 16, 24);
    px(x, y + 4, c, 16, 24);
  } else if (e.type === 'ghost') {
    ctx.globalAlpha = 0.85;
    px(x - 24, y - 56, c, 48, 40);
    px(x - 28, y - 48, c, 56, 28);
    px(x - 24, y - 16, c, 48, 32);
    for (let i = 0; i < 5; i++) {
      px(x - 24 + i * 12, y + 16 + Math.sin(state.time * 4 + i) * 4, c, 8, 12);
    }
    ctx.globalAlpha = 1;
    px(x - 12, y - 40, '#000', 6, 8);
    px(x + 6, y - 40, '#000', 6, 8);
    px(x - 8, y - 24, '#000', 16, 4);
  }

  if (e.stunned) {
    const angle = state.time * 6;
    for (let i = 0; i < 3; i++) {
      const a2 = angle + i * (Math.PI * 2 / 3);
      const sx = x + Math.cos(a2) * 30;
      const sy = y - 80 + Math.sin(a2) * 6;
      ctx.fillStyle = '#ffeb3b';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★', sx, sy);
    }
  }
}

function drawAttackIndicator(e) {
  if (e.stunned || e.hp <= 0) return;
  const t = e.attackTimer;
  if (t > 1.5) return;
  const x = e.x, y = e.y - 100;

  if (t < 0.7) {
    const pulse = 1 + Math.sin(state.time * 30) * 0.15;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#ff3030';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000';
    ctx.strokeText('!!', 0, 0);
    ctx.fillText('!!', 0, 0);
    ctx.restore();
  }

  const num = Math.ceil(t * 2);
  ctx.fillStyle = t < 0.2 ? '#ff80ff' : t < 0.5 ? '#ffeb3b' : '#fff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000';
  ctx.strokeText(num.toString(), x, y + 28);
  ctx.fillText(num.toString(), x, y + 28);

  const barW = 80;
  const barX = x - barW / 2;
  const barY = y + 36;
  ctx.fillStyle = '#000';
  ctx.fillRect(barX - 1, barY - 1, barW + 2, 8);
  ctx.fillStyle = '#444';
  ctx.fillRect(barX, barY, barW, 6);
  const pct = Math.max(0, Math.min(1, 1 - t / 1.5));
  ctx.fillStyle = t < 0.2 ? '#ff80ff' : t < 0.5 ? '#ffeb3b' : '#ff8040';
  ctx.fillRect(barX, barY, barW * pct, 6);
}

function drawHpBar(ent, label, x, y, w) {
  ctx.fillStyle = '#000';
  ctx.fillRect(x - 2, y - 2, w + 4, 22);
  ctx.fillStyle = '#222';
  ctx.fillRect(x, y, w, 18);
  const pct = Math.max(0, ent.hp / ent.maxHp);
  ctx.fillStyle = pct > 0.5 ? '#4caf50' : pct > 0.25 ? '#ffb300' : '#f44336';
  ctx.fillRect(x, y, w * pct, 18);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${label}  ${Math.ceil(ent.hp)}/${ent.maxHp}`, x + 6, y + 13);
}

function drawPpBar(e, x, y, w) {
  ctx.fillStyle = '#000';
  ctx.fillRect(x - 2, y - 2, w + 4, 12);
  ctx.fillStyle = '#222';
  ctx.fillRect(x, y, w, 8);
  const pct = e.pp / e.maxPp;
  ctx.fillStyle = e.stunned ? '#ffeb3b' : '#ff8040';
  ctx.fillRect(x, y, w * pct, 8);
  ctx.fillStyle = '#aaa';
  ctx.font = '10px sans-serif';
  ctx.fillText('PP (ピヨ)', x, y - 2);
}

function drawApBar(k, x, y, w) {
  ctx.fillStyle = '#aaa';
  ctx.font = '10px sans-serif';
  ctx.fillText(`AP ${k.ap.toFixed(1)} / ${k.maxAp}`, x, y - 2);
  const slotW = (w - 8) / k.maxAp;
  for (let i = 0; i < k.maxAp; i++) {
    const sx = x + i * slotW + (i > 0 ? 2 : 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(sx - 1, y - 1, slotW - 2 + 2, 14);
    const filled = Math.max(0, Math.min(1, k.ap - i));
    ctx.fillStyle = '#222';
    ctx.fillRect(sx, y, slotW - 2, 12);
    if (filled > 0) {
      ctx.fillStyle = '#ffd066';
      ctx.fillRect(sx, y, (slotW - 2) * filled, 12);
    }
  }
}

function drawWeaponIcon(type, x, y, size) {
  const half = size / 2;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (type === 'sword') {
    ctx.fillStyle = '#cfeeff';
    ctx.fillRect(-2, -half + 4, 4, size - 12);
    ctx.fillStyle = '#7be0ff';
    ctx.fillRect(-1, -half + 4, 2, size - 12);
    ctx.fillStyle = '#888';
    ctx.fillRect(-half + 6, half - 10, size - 12, 3);
    ctx.fillStyle = '#a5621a';
    ctx.fillRect(-2, half - 8, 4, 6);
  } else if (type === 'spear') {
    ctx.fillStyle = '#ffd066';
    ctx.beginPath();
    ctx.moveTo(0, -half + 2);
    ctx.lineTo(-4, -half + 8);
    ctx.lineTo(0, -half + 14);
    ctx.lineTo(4, -half + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#a5621a';
    ctx.fillRect(-1, -half + 14, 2, size - 16);
  } else if (type === 'hammer') {
    ctx.fillStyle = '#cc8855';
    ctx.fillRect(-half + 4, -half + 5, size - 8, 8);
    ctx.fillStyle = '#a06030';
    ctx.fillRect(-half + 4, -half + 12, size - 8, 2);
    ctx.fillStyle = '#a5621a';
    ctx.fillRect(-1, -half + 14, 2, size - 16);
  }
  ctx.restore();
}

function drawComboHud() {
  const slotSize = 36;
  const gap = 8;
  const totalW = slotSize * 3 + gap * 2;
  const sx = W / 2 - totalW / 2;
  const sy = H - 60;

  ctx.fillStyle = '#aaa';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('COMBO', W / 2, sy - 6);

  for (let i = 0; i < 3; i++) {
    const x = sx + i * (slotSize + gap);
    const w = state.weaponHistory[i];
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 1, sy - 1, slotSize + 2, slotSize + 2);
    ctx.fillStyle = w ? '#2a3060' : '#15182a';
    ctx.fillRect(x, sy, slotSize, slotSize);
    ctx.strokeStyle = w ? '#5080d0' : '#30364a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, sy + 1, slotSize - 2, slotSize - 2);
    if (w) {
      drawWeaponIcon(w, x + slotSize / 2, sy + slotSize / 2, 28);
    } else {
      ctx.fillStyle = '#3a4060';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', x + slotSize / 2, sy + slotSize / 2);
      ctx.textBaseline = 'alphabetic';
    }
  }

  const preview = previewSpecial(state.weaponHistory);
  if (preview) {
    const text = `次に [${WEAPONS[preview.needWeapon].name}] で → ${preview.name}!`;
    const pulse = 0.85 + Math.sin(state.time * 8) * 0.15;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = preview.color;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';
    ctx.strokeText(text, W / 2, sy + slotSize + 18);
    ctx.fillText(text, W / 2, sy + slotSize + 18);
    ctx.globalAlpha = 1;
  }
}

function drawSpecialFx() {
  const fx = state.specialFx;
  const t = state.specialFxTimer;
  const phase = 1 - t / 1.4;
  ctx.save();

  const radial = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 500);
  radial.addColorStop(0, fx.color + 'cc');
  radial.addColorStop(0.4, fx.color + '40');
  radial.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = Math.min(1, t * 1.5) * 0.5;
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2 + state.time * 4;
    const r = 50 + phase * 300;
    const x = W / 2 + Math.cos(ang) * r;
    const y = H / 2 + Math.sin(ang) * r;
    ctx.fillStyle = fx.color;
    ctx.globalAlpha = Math.max(0, t / 1.4);
    ctx.fillRect(x - 4, y - 4, 8, 8);
  }
  ctx.restore();
}

// ============================================================
// LOOP & UI
// ============================================================
function loop(now) {
  if (!lastTime) lastTime = now;
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function bindUi() {
  const ensureAudio = () => { sound.init(); sound.resume(); };

  for (const btn of document.querySelectorAll('.weapon')) {
    btn.addEventListener('click', () => { ensureAudio(); attack(btn.dataset.weapon); });
  }
  document.getElementById('shield').addEventListener('click', () => { ensureAudio(); tryGuard(); });
  document.getElementById('restart').addEventListener('click', () => {
    hideOverlay();
    resetState();
  });

  const btnSe = document.getElementById('btn-se');
  const btnBgm = document.getElementById('btn-bgm');
  btnSe.addEventListener('click', () => {
    ensureAudio();
    const on = sound.toggleSe();
    btnSe.classList.toggle('off', !on);
    btnSe.textContent = on ? '🔊 SE' : '🔇 SE';
  });
  btnBgm.addEventListener('click', () => {
    ensureAudio();
    const on = sound.toggleBgm();
    btnBgm.classList.toggle('off', !on);
    btnBgm.textContent = on ? '🎵 BGM' : '🎵 BGM';
  });

  window.addEventListener('keydown', (ev) => {
    ensureAudio();
    if (state.scene !== 'battle') {
      if (ev.code === 'Enter' || ev.code === 'Space') {
        hideOverlay();
        resetState();
      }
      return;
    }
    if (ev.code === 'Digit1' || ev.code === 'Numpad1') attack('sword');
    else if (ev.code === 'Digit2' || ev.code === 'Numpad2') attack('spear');
    else if (ev.code === 'Digit3' || ev.code === 'Numpad3') attack('hammer');
    else if (ev.code === 'Space') { ev.preventDefault(); tryGuard(); }
  });
}

resetState();
bindUi();
requestAnimationFrame(loop);

})();
