(() => {
'use strict';

// ===== DOM =====
const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d');
const scoreEl = $('score'), bestEl = $('best'), alliesEl = $('allies'), coinsEl = $('coins'), firepowEl = $('firepow');
const overlay = $('overlay'), startBtn = $('startBtn'), gachaBtn = $('gachaBtn'), equipBtn = $('equipBtn');
const titleEl = overlay.querySelector('h1'), descEl = overlay.querySelector('.desc'), lastScoreEl = $('lastScore');
const muteBtn = $('muteBtn'), bossTextEl = $('bossText');
const gachaModal = $('gachaModal'), gachaTickets = $('gachaTickets'), pullStage = $('pullStage'), pullBtn = $('pullBtn'), closeGachaBtn = $('closeGachaBtn');
const equipModal = $('equipModal'), equipGrid = $('equipGrid'), equipStatus = $('equipStatus'), closeEquipBtn = $('closeEquipBtn');

// ===== Save =====
const SAVE_KEY = 'tapRunnerSave_v3';
const defaultSave = { best: 0, muted: false, coins: 0, unlocked: [], equipped: [] };
let save = { ...defaultSave };
try {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) save = { ...defaultSave, ...JSON.parse(raw) };
} catch (e) {}
const oldBest = parseInt(localStorage.getItem('tapRunnerBest') || '0', 10);
if (oldBest > save.best) save.best = oldBest;
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }

// ===== Companions =====
const COMPANIONS = {
  guard:    { name: 'ガード',       rarity: 'N',  icon: '🛡️', desc: 'スタート時に仲間+1' },
  coiner:   { name: 'コインリッチ', rarity: 'N',  icon: '💰', desc: 'コイン獲得+1' },
  shooter:  { name: 'シューター',   rarity: 'N',  icon: '⚡', desc: '攻撃クールダウン-25%' },
  magnet:   { name: 'マグネット',   rarity: 'R',  icon: '🧲', desc: 'コインを引き寄せる' },
  healer:   { name: 'ヒーラー',     rarity: 'R',  icon: '💚', desc: '15秒ごとに仲間が復活' },
  bomber:   { name: 'ボマー',       rarity: 'R',  icon: '💣', desc: '12秒ごとに前方を爆破' },
  autogun:  { name: 'オートガン',   rarity: 'SR', icon: '🔫', desc: '自動で弾を撃つ' },
  golden:   { name: 'ゴールデン',   rarity: 'SR', icon: '✨', desc: 'コイン獲得x2' },
  legend:   { name: 'レジェンド',   rarity: 'SSR', icon: '👑', desc: 'スタート+2 / 自動射撃 / コインx2' },
};
const RARITY_COLOR = { N: '#9e9e9e', R: '#42a5f5', SR: '#ffb300', SSR: '#e040fb' };
const RARITY_WEIGHT = { N: 60, R: 28, SR: 10, SSR: 2 };
const COMPANION_IDS = Object.keys(COMPANIONS);

function pullGacha() {
  const total = COMPANION_IDS.reduce((s, id) => s + RARITY_WEIGHT[COMPANIONS[id].rarity], 0);
  let r = Math.random() * total;
  for (const id of COMPANION_IDS) {
    r -= RARITY_WEIGHT[COMPANIONS[id].rarity];
    if (r <= 0) return id;
  }
  return COMPANION_IDS[0];
}

// ===== Audio =====
const Sfx = {
  ctx: null, muted: !!save.muted,
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  toneAt(freq, when, dur, type = 'square', vol = 0.18, slideTo = null) {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), when + dur);
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.0008, when + dur);
    osc.connect(g).connect(this.master);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  },
  tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx) return;
    this.toneAt(freq, this.ctx.currentTime, dur, type, vol, slideTo);
  },
  seq(notes) {
    if (!this.ctx) return;
    let t = this.ctx.currentTime;
    for (const n of notes) {
      this.toneAt(n.f, t, n.d, n.t || 'square', n.v ?? 0.18, n.s ?? null);
      t += (n.gap ?? n.d * 0.7);
    }
  },
  jump()        { this.tone(520, 0.10, 'square', 0.16, 760); },
  doubleJump()  { this.tone(740, 0.10, 'square', 0.16, 1100); },
  recruit()     { this.seq([{f:660,d:0.08,t:'triangle',v:0.20},{f:880,d:0.08,t:'triangle',v:0.20},{f:1175,d:0.18,t:'triangle',v:0.22}]); },
  shield()      { this.tone(220, 0.25, 'sawtooth', 0.20, 110); },
  hit()         { this.seq([{f:330,d:0.12,v:0.22},{f:220,d:0.14,v:0.22},{f:110,d:0.32,v:0.22,s:60}]); },
  fall()        { this.tone(660, 0.5, 'sawtooth', 0.22, 80); },
  attack()      { this.tone(880, 0.07, 'square', 0.12, 1400); },
  bossHit()     { this.tone(140, 0.12, 'sawtooth', 0.22, 80); },
  bossDie()     { this.seq([{f:800,d:0.10,v:0.22},{f:1000,d:0.10,v:0.22},{f:1200,d:0.10,v:0.22},{f:1500,d:0.30,t:'triangle',v:0.26}]); },
  bossAlert()   { this.seq([{f:220,d:0.12,t:'sawtooth',v:0.20},{f:220,d:0.12,t:'sawtooth',v:0.20},{f:330,d:0.18,t:'sawtooth',v:0.22}]); },
  coinGet()     { this.tone(1200, 0.06, 'triangle', 0.10, 1600); },
  bigCoin()     { this.seq([{f:880,d:0.06,t:'triangle',v:0.16},{f:1320,d:0.06,t:'triangle',v:0.18},{f:1760,d:0.14,t:'triangle',v:0.20}]); },
  powerup()     { this.seq([{f:660,d:0.08,t:'triangle',v:0.18},{f:990,d:0.10,t:'triangle',v:0.20},{f:1320,d:0.16,t:'triangle',v:0.22}]); },
  bomb()        { this.tone(120, 0.30, 'sawtooth', 0.24, 40); },
  pullN()       { this.tone(440, 0.20, 'triangle', 0.18, 600); },
  pullR()       { this.seq([{f:440,d:0.10},{f:660,d:0.10},{f:880,d:0.20,t:'triangle'}]); },
  pullSR()      { this.seq([{f:523,d:0.10},{f:659,d:0.10},{f:784,d:0.10},{f:1047,d:0.30,t:'triangle'}]); },
  pullSSR()     { this.seq([{f:523,d:0.08},{f:659,d:0.08},{f:784,d:0.08},{f:1047,d:0.08},{f:1319,d:0.08},{f:1568,d:0.50,t:'triangle',v:0.26}]); },
};

// ===== BGM =====
const BGM_NORMAL = [
  { b: 110, l: 440 }, { b: 0, l: 0 }, { b: 0, l: 523 }, { b: 0, l: 0 },
  { b: 110, l: 659 }, { b: 0, l: 0 }, { b: 0, l: 523 }, { b: 0, l: 440 },
  { b: 87.31, l: 523 }, { b: 0, l: 0 }, { b: 0, l: 587 }, { b: 0, l: 0 },
  { b: 98, l: 587 }, { b: 0, l: 0 }, { b: 0, l: 523 }, { b: 0, l: 440 },
];
const BGM_BOSS = [
  { b: 82.41, l: 392 }, { b: 0, l: 0 }, { b: 0, l: 466 }, { b: 0, l: 0 },
  { b: 82.41, l: 622 }, { b: 0, l: 0 }, { b: 0, l: 466 }, { b: 0, l: 392 },
  { b: 73.42, l: 392 }, { b: 0, l: 0 }, { b: 0, l: 587 }, { b: 0, l: 466 },
  { b: 65.41, l: 622 }, { b: 0, l: 0 }, { b: 0, l: 466 }, { b: 0, l: 587 },
];
const Bgm = {
  playing: false, scheduledUntil: 0, step: 0, timer: null,
  start() {
    if (this.playing) return;
    Sfx.init(); Sfx.resume();
    if (!Sfx.ctx) return;
    this.playing = true;
    this.step = 0;
    this.scheduledUntil = Sfx.ctx.currentTime + 0.05;
    this.scheduleAhead();
    this.timer = setInterval(() => this.scheduleAhead(), 80);
  },
  stop() {
    this.playing = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  },
  scheduleAhead() {
    if (!this.playing || !Sfx.ctx) return;
    const lookahead = Sfx.ctx.currentTime + 0.3;
    const bossMode = state && state.boss;
    const pattern = bossMode ? BGM_BOSS : BGM_NORMAL;
    const bpm = bossMode ? 150 : 122;
    const stepDur = 60 / bpm / 2;
    while (this.scheduledUntil < lookahead) {
      const n = pattern[this.step % pattern.length];
      if (n.b) Sfx.toneAt(n.b, this.scheduledUntil, 0.18, 'triangle', 0.07);
      if (n.l) Sfx.toneAt(n.l, this.scheduledUntil, 0.10, 'square', 0.04);
      if (this.step % 2 === 0) Sfx.toneAt(160, this.scheduledUntil, 0.03, 'square', 0.02);
      this.scheduledUntil += stepDur;
      this.step++;
    }
  }
};

function updateMuteUI() { muteBtn.textContent = Sfx.muted ? '🔇' : '♪'; }
muteBtn.addEventListener('click', e => {
  e.stopPropagation();
  Sfx.init();
  Sfx.muted = !Sfx.muted;
  save.muted = Sfx.muted;
  persist();
  updateMuteUI();
  if (Sfx.muted) Bgm.stop();
  else if (state.running) Bgm.start();
});
updateMuteUI();

// ===== Canvas =====
const DPR = Math.min(window.devicePixelRatio || 1, 2);
let W = 0, H = 0, groundY = 0;
const GROUND_RATIO = 0.82;
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  canvas.width = w * DPR; canvas.height = h * DPR;
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  W = w; H = h; groundY = H * GROUND_RATIO;
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 200));
resize();

// ===== Constants =====
const GRAVITY = 2400;
const JUMP_VEL = -780;
const DBL_JUMP_VEL = -680;
const BASE_SPEED = 320;
const MAX_SPEED = 600;        // softer cap
const SPEED_RAMP = 3;          // gentle ramp (was 8)
const INVULN_TIME = 1.2;
const BASE_ATTACK_CD = 0.34;
const PROJECTILE_SPEED = 800;
const CYCLE_LENGTH = 1000;     // one full day per 1000 score
const BOSS_PHASE = 0.80;       // boss spawns at this fraction of cycle (= night)
const COIN_VALUE_BASE = 1;
const GACHA_COST = 100;

// ===== Day / Night palette =====
// Linear interpolation between keyframes.
// Each frame: [phaseT, topRGB, midRGB, botRGB]
const SKY_PALETTE = [
  [0.00, [120, 60, 110], [240, 130, 110], [255, 200, 130]], // dawn
  [0.18, [60, 100, 170], [120, 170, 220], [200, 230, 240]], // morning to day
  [0.35, [40, 70, 150],  [80, 130, 200],  [170, 200, 230]], // bright day
  [0.55, [50, 70, 140],  [110, 130, 200], [200, 180, 200]], // late day
  [0.68, [80, 50, 130],  [200, 80, 100],  [255, 150, 90]],  // sunset
  [0.78, [40, 30, 90],   [120, 50, 100],  [200, 90, 70]],   // dusk
  [0.85, [10, 12, 38],   [22, 26, 70],    [50, 40, 110]],   // night
  [1.00, [10, 12, 38],   [22, 26, 70],    [50, 40, 110]],   // night (held)
];
function lerp(a, b, t) { return a + (b - a) * t; }
function lerpColor(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}
function rgbStr(c) { return `rgb(${c[0]|0},${c[1]|0},${c[2]|0})`; }
function getSky(t) {
  for (let i = 0; i < SKY_PALETTE.length - 1; i++) {
    const a = SKY_PALETTE[i], b = SKY_PALETTE[i + 1];
    if (t >= a[0] && t <= b[0]) {
      const lt = (b[0] === a[0]) ? 0 : (t - a[0]) / (b[0] - a[0]);
      return { top: lerpColor(a[1], b[1], lt), mid: lerpColor(a[2], b[2], lt), bot: lerpColor(a[3], b[3], lt) };
    }
  }
  const last = SKY_PALETTE[SKY_PALETTE.length - 1];
  return { top: last[1], mid: last[2], bot: last[3] };
}

// stars seeded once
const STARS = [];
for (let i = 0; i < 70; i++) STARS.push({ x: Math.random(), y: Math.random() * 0.65, r: 0.5 + Math.random() * 1.6, seed: Math.random() * 1000 });

// ===== State =====
const state = {
  running: false, over: false,
  speed: BASE_SPEED, distance: 0, score: 0,
  cycleStart: 0, bossSpawnedThisCycle: false,
  obstacles: [], coins: [], pickups: [],
  clouds: [], particles: [], allies: [],
  projectiles: [], enemyShots: [], floatTexts: [],
  bgScroll: 0, shake: 0, invuln: 0, flash: 0,
  obstacleCount: 0,
  spawnTimer: 0, spawnNext: 1.4,
  coinTimer: 0, coinNext: 1.0,
  pickupTimer: 12,
  attackCd: 0,
  firePower: 1,
  boss: null, bossPending: false,
  spawnPaused: false, bossClear: 0,
  effects: null,
  healTimer: 0, bombTimer: 0, autogunTimer: 0,
};

const player = {
  x: 0, y: 0, vy: 0, w: 38, h: 46,
  onGround: true, jumps: 0, runFrame: 0, trail: [],
  falling: false, dying: false,
};

bestEl.textContent = save.best;
coinsEl.textContent = save.coins;

function getCyclePhase() {
  return Math.min(0.9999, Math.max(0, (state.score - state.cycleStart) / CYCLE_LENGTH));
}

function maxJumps() { return 2 + state.allies.length; }
function getAttackCd() { return BASE_ATTACK_CD * (state.effects?.cdMul || 1) * Math.pow(0.85, state.firePower - 1); }

function makeAlly() {
  return { x: player.x, y: player.y, hue: 270 + Math.random() * 40, bob: Math.random() * Math.PI * 2 };
}

function applyCompanions() {
  state.effects = { coinValue: COIN_VALUE_BASE, cdMul: 1, magnet: 0, healInterval: 0, autogun: false, bomber: false, coinSpawnMul: 1 };
  for (const id of save.equipped) {
    if (id === 'guard')    state.allies.push(makeAlly());
    if (id === 'coiner')   state.effects.coinValue += 1;
    if (id === 'shooter')  state.effects.cdMul *= 0.75;
    if (id === 'magnet')   state.effects.magnet = 160;
    if (id === 'healer')   state.effects.healInterval = 15;
    if (id === 'bomber')   state.effects.bomber = true;
    if (id === 'autogun')  state.effects.autogun = true;
    if (id === 'golden')   state.effects.coinValue *= 2;
    if (id === 'legend')   {
      state.allies.push(makeAlly()); state.allies.push(makeAlly());
      state.effects.autogun = true;
      state.effects.coinValue *= 2;
      state.effects.coinSpawnMul = 1.4;
    }
  }
  alliesEl.textContent = state.allies.length;
}

function resetPlayer() {
  player.x = W * 0.22; player.y = groundY - player.h;
  player.vy = 0; player.onGround = true; player.jumps = 0;
  player.runFrame = 0; player.trail = [];
  player.falling = false; player.dying = false;
}

function reset() {
  Sfx.init(); Sfx.resume();
  state.running = true; state.over = false;
  state.speed = BASE_SPEED; state.distance = 0; state.score = 0;
  state.cycleStart = 0; state.bossSpawnedThisCycle = false;
  state.obstacles = []; state.coins = []; state.pickups = [];
  state.clouds = []; state.particles = []; state.allies = [];
  state.projectiles = []; state.enemyShots = []; state.floatTexts = [];
  state.shake = 0; state.invuln = 0; state.flash = 0;
  state.obstacleCount = 0;
  state.spawnTimer = 0; state.spawnNext = 1.4;
  state.coinTimer = 0; state.coinNext = 1.0;
  state.pickupTimer = 12;
  state.attackCd = 0;
  state.firePower = 1;
  state.boss = null; state.bossPending = false;
  state.spawnPaused = false; state.bossClear = 0;
  state.healTimer = 0; state.bombTimer = 6; state.autogunTimer = 0;
  resetPlayer();
  seedClouds();
  applyCompanions();
  firepowEl.textContent = state.firePower;
  coinsEl.textContent = save.coins;
  overlay.classList.add('hidden');
  bossTextEl.classList.remove('show');
  if (!Sfx.muted) Bgm.start();
}

function seedClouds() {
  state.clouds.length = 0;
  for (let i = 0; i < 6; i++) {
    state.clouds.push({
      x: Math.random() * W,
      y: 30 + Math.random() * (groundY * 0.55),
      r: 18 + Math.random() * 28,
      speed: 20 + Math.random() * 30,
    });
  }
}

// ===== Inputs =====
function jump() {
  if (!state.running || player.dying) return;
  if (player.jumps < maxJumps()) {
    player.vy = player.jumps === 0 ? JUMP_VEL : DBL_JUMP_VEL;
    player.onGround = false;
    player.jumps++;
    spawnPuff();
    if (player.jumps === 1) Sfx.jump(); else Sfx.doubleJump();
  }
}
function attack() {
  if (!state.running || player.dying) return;
  if (state.attackCd > 0) return;
  state.attackCd = getAttackCd();
  state.projectiles.push({
    x: player.x + player.w, y: player.y + player.h * 0.5,
    vx: PROJECTILE_SPEED, vy: 0, life: 1.2, age: 0, r: 7,
  });
  for (let i = 0; i < 5; i++) {
    state.particles.push({ x: player.x + player.w, y: player.y + player.h * 0.5,
      vx: 60 + Math.random()*80, vy: -40 + Math.random()*80,
      life: 0.25, age: 0, r: 2 + Math.random()*2, c: '#fff59d' });
  }
  Sfx.attack();
}

function spawnPuff() {
  for (let i = 0; i < 8; i++) state.particles.push({
    x: player.x + player.w * 0.3, y: player.y + player.h,
    vx: -120 + Math.random()*60, vy: -40 + Math.random()*80,
    life: 0.45, age: 0, r: 2 + Math.random()*3, c: '#ffffff'
  });
}
function burst(x, y, c1='#ff7043', c2='#ffd54f', n=20) {
  for (let i = 0; i < n; i++) {
    const a = Math.random()*Math.PI*2, sp = 80 + Math.random()*220;
    state.particles.push({ x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp - 60,
      life: 0.7, age: 0, r: 2 + Math.random()*4,
      c: Math.random() < 0.5 ? c1 : c2 });
  }
}
function floatText(text, x, y, color='#ffeb3b', size=20) {
  state.floatTexts.push({ text, x, y, vy: -60, age: 0, life: 1.2, color, size });
}

// ===== Spawning =====
function getDifficulty() { return Math.min(8, Math.floor(state.score / 250)); }

function spawnObstacle() {
  state.obstacleCount++;
  const diff = getDifficulty();
  if (state.obstacleCount % 6 === 0) {
    state.obstacles.push({ kind: 'friend', x: W + 36, y: groundY - 32, w: 32, h: 32, bob: 0 });
    return;
  }
  const pool = [];
  pool.push({ kind: 'spike', w: 20 + Math.random() * 22 });
  pool.push({ kind: 'block', w: 32 + Math.random() * 18 });
  if (diff >= 1) pool.push({ kind: 'fireball', w: 0 });
  if (diff >= 2) pool.push({ kind: 'hole', w: 60 + Math.random() * 40 });
  if (diff >= 3) { pool.push({ kind: 'spike', w: 30 }); pool.push({ kind: 'block', w: 40 }); }
  const t = pool[Math.floor(Math.random() * pool.length)];
  if (t.kind === 'spike') {
    const h = 28 + Math.random() * 36;
    state.obstacles.push({ kind: 'spike', x: W + t.w, y: groundY - h, w: t.w, h });
  } else if (t.kind === 'block') {
    const h = 90 + Math.random() * 50;
    state.obstacles.push({ kind: 'block', x: W + t.w, y: groundY - h, w: t.w, h, hp: 1 });
  } else if (t.kind === 'fireball') {
    const fy = groundY - 30 - Math.random() * 100;
    state.obstacles.push({ kind: 'fireball', x: W + 24, y: fy, w: 30, h: 30,
      vx: -(state.speed + 80 + Math.random() * 40), spin: 0 });
  } else if (t.kind === 'hole') {
    state.obstacles.push({ kind: 'hole', x: W + t.w, y: groundY, w: t.w, h: H - groundY });
  }
}
function spawnCoinGroup() {
  const baseY = groundY - 50 - Math.random() * 130;
  const count = 4 + Math.floor(Math.random() * 4);
  const startX = W + 20;
  const arc = Math.random() < 0.5;
  for (let i = 0; i < count; i++) {
    let cy = baseY;
    if (arc) cy = baseY + Math.sin(i / (count - 1) * Math.PI) * -40;
    state.coins.push({ x: startX + i * 28, y: cy, r: 9, bob: i * 0.4, collected: false });
  }
}
function spawnPickup() {
  state.pickups.push({ kind: 'firerate', x: W + 20, y: groundY - 70 - Math.random() * 100, w: 26, h: 26, bob: 0 });
}

// ===== Boss =====
function spawnBoss() {
  state.boss = {
    x: W + 80, y: groundY - 180, targetX: W * 0.78, targetY: groundY - 180,
    w: 90, h: 80, hp: 8, maxHp: 8, phase: 'enter', bob: 0,
    shootCd: 1.6, hitFlash: 0, eyeAngle: 0,
  };
  state.bossPending = false;
  state.spawnPaused = true;
  bossTextEl.classList.add('show');
  setTimeout(() => bossTextEl.classList.remove('show'), 1400);
  Sfx.bossAlert();
}
function bossDefeated() {
  if (!state.boss) return;
  for (let i = 0; i < 3; i++) burst(state.boss.x + Math.random()*state.boss.w, state.boss.y + Math.random()*state.boss.h, '#ff5252', '#ffeb3b', 24);
  state.shake = 1.0;
  // Boss reward: premium coins worth 5x each
  const bossX = state.boss.x + state.boss.w/2, bossY = state.boss.y + state.boss.h/2;
  for (let i = 0; i < 14; i++) {
    state.coins.push({
      x: bossX + (Math.random()-0.5)*60,
      y: bossY,
      r: 13, bob: Math.random()*Math.PI*2, collected: false,
      vx: -80 - Math.random()*120, vy: -260 - Math.random()*220,
      value: 5,
    });
  }
  floatText('BOSS DOWN!', state.boss.x + state.boss.w/2, state.boss.y, '#ff5252', 26);
  Sfx.bossDie();
  state.boss = null;
  state.bossClear = 1.2;
  // Move to next morning
  state.cycleStart = state.score;
  state.bossSpawnedThisCycle = false;
  state.enemyShots = [];
}
function updateBoss(dt) {
  const b = state.boss; if (!b) return;
  b.bob += dt * 2;
  b.eyeAngle = Math.atan2((player.y + player.h/2) - (b.y + b.h/2), (player.x + player.w/2) - (b.x + b.w/2));
  if (b.hitFlash > 0) b.hitFlash = Math.max(0, b.hitFlash - dt * 4);
  if (b.phase === 'enter') {
    b.x += (b.targetX - b.x) * dt * 1.5;
    b.y += (b.targetY - b.y) * dt * 1.5;
    if (Math.abs(b.x - b.targetX) < 6) { b.phase = 'fight'; b.shootCd = 1.0; }
  } else {
    b.y = b.targetY + Math.sin(b.bob) * 24;
    b.x = b.targetX + Math.cos(b.bob * 0.6) * 18;
    b.shootCd -= dt;
    if (b.shootCd <= 0) {
      const count = b.hp <= 4 ? 3 : (b.hp <= 6 ? 2 : 1);
      for (let i = 0; i < count; i++) {
        const px = player.x + player.w/2, py = player.y + player.h/2;
        const dx = px - (b.x + b.w/2), dy = py - (b.y + b.h/2);
        const sp = 320 + Math.random()*80;
        const ang = Math.atan2(dy, dx) + (i - (count-1)/2) * 0.15;
        state.enemyShots.push({ x: b.x + b.w/2, y: b.y + b.h/2,
          vx: Math.cos(ang)*sp, vy: Math.sin(ang)*sp, r: 9, age: 0, life: 4 });
      }
      b.shootCd = b.hp <= 3 ? 1.0 : (b.hp <= 6 ? 1.4 : 1.7);
    }
  }
}

// ===== Helpers =====
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function circRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx, dy = cy - ny;
  return dx*dx + dy*dy < r*r;
}

function recruitFriend(o) {
  state.allies.push(makeAlly());
  alliesEl.textContent = state.allies.length;
  burst(o.x + o.w/2, o.y + o.h/2, '#ce93d8', '#fff59d', 18);
  player.vy = -440; player.onGround = false;
  player.jumps = Math.max(0, player.jumps - 1);
  Sfx.recruit();
  floatText('FRIEND+', player.x + player.w/2, player.y - 10, '#ce93d8');
}
function loseAlly() {
  state.allies.pop();
  alliesEl.textContent = state.allies.length;
  state.invuln = INVULN_TIME;
  state.flash = 0.5;
  state.shake = 0.6;
  Sfx.shield();
  floatText('SAVED!', player.x + player.w/2, player.y - 10, '#ffeb3b');
}
function damagePlayer() {
  if (state.invuln > 0) return;
  if (state.allies.length > 0) loseAlly();
  else gameOver();
}

function detonateBomb() {
  let destroyed = 0;
  burst(W * 0.6, groundY - 100, '#ff5252', '#ffeb3b', 30);
  state.shake = 0.6;
  Sfx.bomb();
  for (let i = state.obstacles.length - 1; i >= 0 && destroyed < 4; i--) {
    const o = state.obstacles[i];
    if (o.kind === 'friend' || o.kind === 'hole' || o.kind === 'fireball') continue;
    if (o.x > player.x + player.w && o.x < W) {
      burst(o.x + (o.w||20)/2, o.y + (o.h||20)/2, '#ff5252', '#ffeb3b', 12);
      state.obstacles.splice(i, 1);
      destroyed++;
    }
  }
}

// ===== Main update =====
function update(dt) {
  if (!state.running) return;

  // dying (falling off-screen): stop spawning, just gravity
  if (player.dying) {
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;
    if (player.y > H + 80) {
      finalizeDeath('穴に落ちた！');
    }
    return;
  }

  if (!state.boss && !state.bossPending) state.speed = Math.min(MAX_SPEED, state.speed + SPEED_RAMP * dt);
  state.distance += state.speed * dt;
  state.score = Math.floor(state.distance / 10);
  scoreEl.textContent = state.score;
  state.bgScroll = (state.bgScroll + state.speed * dt * 0.5) % 1000;

  // boss trigger via day cycle: night = boss
  if (!state.boss && !state.bossPending && !state.bossSpawnedThisCycle) {
    if (getCyclePhase() >= BOSS_PHASE) {
      state.bossPending = true; state.spawnPaused = true;
      state.bossSpawnedThisCycle = true;
    }
  }
  if (state.bossPending && state.obstacles.length === 0) {
    state.bossClear -= dt;
    if (state.bossClear <= 0) { spawnBoss(); state.bossClear = 0; }
  } else if (state.bossPending) state.bossClear = 0.4;
  if (!state.boss && state.bossClear > 0) {
    state.bossClear = Math.max(0, state.bossClear - dt);
    if (state.bossClear === 0) state.spawnPaused = false;
  }

  if (state.attackCd > 0) state.attackCd = Math.max(0, state.attackCd - dt);

  if (state.effects.autogun) {
    state.autogunTimer -= dt;
    if (state.autogunTimer <= 0) { attack(); state.autogunTimer = 0.55; }
  }
  if (state.effects.healInterval > 0) {
    state.healTimer += dt;
    if (state.healTimer >= state.effects.healInterval && state.allies.length < 4) {
      state.allies.push(makeAlly());
      alliesEl.textContent = state.allies.length;
      floatText('+1', player.x + player.w/2, player.y - 10, '#a5d6a7');
      state.healTimer = 0;
      Sfx.recruit();
    }
  }
  if (state.effects.bomber) {
    state.bombTimer -= dt;
    if (state.bombTimer <= 0) { detonateBomb(); state.bombTimer = 12; }
  }

  // player physics
  player.vy += GRAVITY * dt;
  player.y += player.vy * dt;
  let overHole = false;
  for (const o of state.obstacles) {
    if (o.kind === 'hole' &&
        player.x + player.w * 0.7 > o.x + 4 &&
        player.x + player.w * 0.3 < o.x + o.w - 4) { overHole = true; break; }
  }
  if (overHole) {
    // No ground beneath - keep falling. If we cross the ground line, mark falling.
    if (player.y + player.h >= groundY) {
      if (!player.falling) {
        player.falling = true;
        Sfx.fall();
      }
      player.onGround = false;
      // do NOT clamp to ground - let player fall through
    }
  } else if (player.y + player.h >= groundY) {
    if (player.falling) {
      // landed safely (jumped out of hole)
      player.falling = false;
    }
    player.y = groundY - player.h;
    player.vy = 0;
    if (!player.onGround) { player.onGround = true; player.jumps = 0; }
  }
  // off-screen = death (clears all allies)
  if (player.y > H + 60 && !player.dying) {
    state.allies = [];
    alliesEl.textContent = 0;
    player.dying = true;
    state.shake = 0.4;
    Sfx.fall();
    return;
  }
  player.runFrame += dt * 12;

  // ally trail
  player.trail.unshift({ x: player.x + player.w/2, y: player.y + player.h/2 });
  if (player.trail.length > 220) player.trail.length = 220;
  for (let i = 0; i < state.allies.length; i++) {
    const idx = Math.min(player.trail.length - 1, 18 + i * 14);
    const t = player.trail[idx];
    if (t) { state.allies[i].x = t.x; state.allies[i].y = t.y; }
    state.allies[i].bob += dt * 6;
  }

  // spawn obstacles
  if (!state.spawnPaused) {
    state.spawnTimer += dt;
    if (state.spawnTimer >= state.spawnNext) {
      spawnObstacle();
      state.spawnTimer = 0;
      const sf = state.speed / BASE_SPEED;
      state.spawnNext = (0.85 + Math.random() * 0.9) / Math.max(1, sf * 0.75);
    }
    state.coinTimer += dt;
    if (state.coinTimer >= state.coinNext) {
      if (Math.random() < state.effects.coinSpawnMul) spawnCoinGroup();
      state.coinTimer = 0;
      state.coinNext = 0.6 + Math.random() * 1.0;
    }
    state.pickupTimer -= dt;
    if (state.pickupTimer <= 0) {
      spawnPickup();
      state.pickupTimer = 14 + Math.random() * 10;
    }
  }

  // move obstacles
  for (const o of state.obstacles) {
    if (o.kind === 'fireball') { o.x += o.vx * dt; o.spin = (o.spin || 0) + dt * 10; }
    else o.x -= state.speed * dt;
    if (o.kind === 'friend') o.bob += dt * 5;
  }
  state.obstacles = state.obstacles.filter(o => o.x + (o.w||30) > -30);

  // coins
  for (const c of state.coins) {
    if (c.vx !== undefined) {
      c.vx += 60 * dt; if (c.vx > -state.speed) c.vx = -state.speed;
      c.vy = (c.vy || 0) + 600 * dt;
      c.x += c.vx * dt; c.y += c.vy * dt;
      if (c.y > groundY - c.r) { c.y = groundY - c.r; c.vy = -c.vy * 0.4; if (Math.abs(c.vy) < 30) delete c.vy; }
    } else {
      c.x -= state.speed * dt;
    }
    c.bob += dt * 4;
    if (state.effects.magnet > 0) {
      const dx = (player.x + player.w/2) - c.x, dy = (player.y + player.h/2) - c.y;
      const d = Math.hypot(dx, dy);
      if (d < state.effects.magnet && d > 0.1) {
        const f = (1 - d / state.effects.magnet) * 700 * dt;
        c.x += dx/d * f; c.y += dy/d * f;
      }
    }
  }
  state.coins = state.coins.filter(c => !c.collected && c.x + c.r > -10);

  // pickups
  for (const p of state.pickups) { p.x -= state.speed * dt; p.bob = (p.bob||0) + dt * 4; }
  state.pickups = state.pickups.filter(p => p.x + p.w > -10);

  // projectiles
  for (const p of state.projectiles) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  state.projectiles = state.projectiles.filter(p => p.age < p.life && p.x < W + 30);

  for (let pi = state.projectiles.length - 1; pi >= 0; pi--) {
    const p = state.projectiles[pi]; let hit = false;
    if (state.boss && circRect(p.x, p.y, p.r, state.boss)) {
      state.boss.hp--; state.boss.hitFlash = 1;
      burst(p.x, p.y, '#ff5252', '#fff', 10);
      Sfx.bossHit();
      hit = true;
      if (state.boss.hp <= 0) bossDefeated();
    } else {
      for (let oi = state.obstacles.length - 1; oi >= 0; oi--) {
        const o = state.obstacles[oi];
        // Spike, friend, hole, fireball: not destructible by projectile
        if (o.kind === 'spike' || o.kind === 'friend' || o.kind === 'hole' || o.kind === 'fireball') continue;
        if (circRect(p.x, p.y, p.r, o)) {
          if (o.kind === 'block') {
            o.hp = (o.hp || 1) - 1;
            burst(p.x, p.y, '#fff', '#7e57c2', 8);
            if (o.hp <= 0) { state.obstacles.splice(oi, 1); state.distance += 30; }
            hit = true; break;
          }
        }
      }
    }
    if (hit) state.projectiles.splice(pi, 1);
  }

  // enemy shots
  for (const e of state.enemyShots) { e.age += dt; e.x += e.vx * dt; e.y += e.vy * dt; }
  state.enemyShots = state.enemyShots.filter(e => e.age < e.life && e.x > -30 && e.x < W + 30 && e.y < groundY + 10);

  updateBoss(dt);

  // clouds
  for (const c of state.clouds) {
    c.x -= c.speed * dt;
    if (c.x + c.r < 0) { c.x = W + c.r; c.y = 30 + Math.random()*(groundY*0.55); c.r = 18 + Math.random()*28; }
  }
  for (const p of state.particles) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 400 * dt; }
  state.particles = state.particles.filter(p => p.age < p.life);
  for (const t of state.floatTexts) { t.age += dt; t.y += t.vy * dt; t.vy += 60 * dt; }
  state.floatTexts = state.floatTexts.filter(t => t.age < t.life);

  if (state.invuln > 0) state.invuln = Math.max(0, state.invuln - dt);
  if (state.flash > 0) state.flash = Math.max(0, state.flash - dt);
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 4);

  // collisions: player vs obstacles
  const pBox = { x: player.x + 6, y: player.y + 4, w: player.w - 12, h: player.h - 6 };
  for (let i = state.obstacles.length - 1; i >= 0; i--) {
    const o = state.obstacles[i];
    if (o.kind === 'hole') continue;
    if (!rectsOverlap(pBox, o)) continue;
    if (o.kind === 'friend') {
      const stomping = player.vy > 60 && (pBox.y + pBox.h) < o.y + o.h * 0.6;
      if (stomping) { recruitFriend(o); state.obstacles.splice(i, 1); }
      else if (state.invuln <= 0) {
        if (state.allies.length > 0) { loseAlly(); state.obstacles.splice(i, 1); }
        else { gameOver(); break; }
      }
    } else {
      if (state.invuln > 0) continue;
      if (state.allies.length > 0) {
        loseAlly();
        if (o.kind === 'fireball' || o.kind === 'block') state.obstacles.splice(i, 1);
      } else { gameOver(); break; }
    }
  }
  if (state.invuln <= 0) {
    for (let i = state.enemyShots.length - 1; i >= 0; i--) {
      const e = state.enemyShots[i];
      if (circRect(e.x, e.y, e.r, pBox)) {
        state.enemyShots.splice(i, 1);
        damagePlayer();
        if (state.over) break;
      }
    }
  }
  if (state.boss && state.invuln <= 0 && rectsOverlap(pBox, state.boss)) damagePlayer();

  for (let i = state.coins.length - 1; i >= 0; i--) {
    const c = state.coins[i];
    const dx = (player.x + player.w/2) - c.x, dy = (player.y + player.h/2) - c.y;
    if (dx*dx + dy*dy < (c.r + 18) ** 2) {
      state.coins.splice(i, 1);
      const mul = c.value || 1;
      const v = state.effects.coinValue * mul;
      save.coins += v;
      coinsEl.textContent = save.coins;
      if (mul >= 5) {
        Sfx.bigCoin();
        burst(c.x, c.y, '#ff5252', '#fff59d', 14);
        floatText('+' + v, c.x, c.y - 8, '#ffeb3b', 18);
      } else {
        Sfx.coinGet();
        if (i % 4 === 0) burst(c.x, c.y, '#ffeb3b', '#fff59d', 6);
      }
    }
  }
  for (let i = state.pickups.length - 1; i >= 0; i--) {
    const p = state.pickups[i];
    if (rectsOverlap({ x: p.x, y: p.y, w: p.w, h: p.h }, pBox)) {
      state.pickups.splice(i, 1);
      if (p.kind === 'firerate') {
        state.firePower = Math.min(5, state.firePower + 1);
        firepowEl.textContent = state.firePower;
        floatText('FIRE x' + state.firePower, p.x, p.y, '#00e5ff', 22);
        Sfx.powerup();
        burst(p.x + p.w/2, p.y + p.h/2, '#00e5ff', '#fff', 16);
      }
    }
  }
}

function gameOver() { finalizeDeath('もう一度挑戦しよう！'); }
function finalizeDeath(msg) {
  if (state.over) return;
  state.running = false; state.over = true;
  state.shake = 1;
  if (!player.dying) burst(player.x + player.w/2, player.y + player.h/2);
  Sfx.hit();
  Bgm.stop();
  if (state.score > save.best) save.best = state.score;
  persist();
  bestEl.textContent = save.best;
  setTimeout(() => {
    titleEl.textContent = 'GAME OVER';
    descEl.textContent = msg;
    lastScoreEl.textContent = `SCORE  ${state.score}    BEST  ${save.best}    🪙${save.coins}`;
    startBtn.textContent = 'RETRY';
    overlay.classList.remove('hidden');
  }, 700);
}

// ===== Drawing =====
function roundRect(x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
}

function drawSky() {
  const t = state.running ? getCyclePhase() : 0.3;
  const sky = getSky(t);
  const grd = ctx.createLinearGradient(0, 0, 0, groundY);
  grd.addColorStop(0, rgbStr(sky.top));
  grd.addColorStop(0.6, rgbStr(sky.mid));
  grd.addColorStop(1, rgbStr(sky.bot));
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, groundY);

  // Stars (visible during dusk -> night)
  if (t > 0.72) {
    const a = Math.min(1, (t - 0.72) / 0.10);
    ctx.globalAlpha = a;
    ctx.fillStyle = '#fff';
    const tNow = performance.now() * 0.001;
    for (const s of STARS) {
      const tw = (Math.sin(tNow + s.seed) + 1) * 0.5;
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * groundY, s.r * (0.4 + tw * 0.6), 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // Sun (rises and sets across day)
  if (t < 0.72) {
    const sunT = Math.max(0, Math.min(1, (t - 0.02) / 0.7));
    const sx = sunT * W;
    const sy = groundY * 0.75 - Math.sin(sunT * Math.PI) * groundY * 0.55;
    const a = (t < 0.06 ? (t - 0.02) / 0.04 : t > 0.66 ? Math.max(0, (0.72 - t) / 0.06) : 1);
    const isSetting = t > 0.55;
    const sunColor = isSetting ? '#ff7043' : (t < 0.18 ? '#ffb74d' : '#fff59d');
    ctx.globalAlpha = Math.max(0, a);
    const grd2 = ctx.createRadialGradient(sx, sy, 8, sx, sy, 90);
    grd2.addColorStop(0, sunColor);
    grd2.addColorStop(1, 'rgba(255,200,100,0)');
    ctx.fillStyle = grd2;
    ctx.fillRect(sx - 90, sy - 90, 180, 180);
    ctx.fillStyle = sunColor;
    ctx.beginPath(); ctx.arc(sx, sy, 22, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  // Moon at night
  if (t > 0.78) {
    const a = Math.min(1, (t - 0.78) / 0.05);
    ctx.globalAlpha = a;
    const mx = W * 0.82, my = groundY * 0.22;
    const grd3 = ctx.createRadialGradient(mx, my, 8, mx, my, 60);
    grd3.addColorStop(0, 'rgba(255,255,230,0.5)');
    grd3.addColorStop(1, 'rgba(255,255,230,0)');
    ctx.fillStyle = grd3;
    ctx.fillRect(mx - 60, my - 60, 120, 120);
    ctx.fillStyle = '#f5f5dc';
    ctx.beginPath(); ctx.arc(mx, my, 26, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.beginPath(); ctx.arc(mx - 8, my - 4, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + 6, my + 8, 6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(mx - 4, my + 10, 3, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawMountains() {
  const t = state.running ? getCyclePhase() : 0.3;
  const sky = getSky(t);
  // Far mountains - dim, slow scroll
  const fr = (sky.bot[0] * 0.45) | 0, fg = (sky.bot[1] * 0.50) | 0, fb = (sky.bot[2] * 0.50) | 0;
  ctx.fillStyle = `rgb(${fr},${fg},${fb})`;
  const sFar = -((state.distance * 0.06) % 220);
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  for (let i = 0, x = sFar - 220; x < W + 220; i++, x += 110) {
    const peak = 50 + ((i * 13) % 35) + Math.abs(Math.sin(i * 1.7)) * 25;
    ctx.lineTo(x, groundY);
    ctx.lineTo(x + 55, groundY - peak);
    ctx.lineTo(x + 110, groundY);
  }
  ctx.lineTo(W, groundY);
  ctx.closePath();
  ctx.fill();
  // Snow caps when sky bright
  if (t > 0.1 && t < 0.65) {
    ctx.fillStyle = `rgba(255,255,255,${0.4 * Math.min(1, (0.65 - Math.abs(t - 0.35)) * 2)})`;
    let x = sFar - 220;
    for (let i = 0; x < W + 220; i++, x += 110) {
      const peak = 50 + ((i * 13) % 35) + Math.abs(Math.sin(i * 1.7)) * 25;
      ctx.beginPath();
      ctx.moveTo(x + 47, groundY - peak + 14);
      ctx.lineTo(x + 55, groundY - peak);
      ctx.lineTo(x + 63, groundY - peak + 14);
      ctx.closePath();
      ctx.fill();
    }
  }
  // Near rolling hills - greenish, faster scroll
  const nr = (sky.bot[0] * 0.25 + 30) | 0, ng = (sky.bot[1] * 0.45 + 50) | 0, nb = (sky.bot[2] * 0.30 + 30) | 0;
  ctx.fillStyle = `rgb(${nr},${ng},${nb})`;
  const sNear = -((state.distance * 0.16) % 160);
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  for (let i = 0, x = sNear - 160; x < W + 160; i++, x += 80) {
    const peak = 22 + ((i * 11) % 22);
    ctx.quadraticCurveTo(x + 40, groundY - peak, x + 80, groundY);
  }
  ctx.lineTo(W, groundY);
  ctx.closePath();
  ctx.fill();
  // Tiny tree silhouettes on near hills (only during day-ish)
  if (t < 0.7) {
    const tr = (nr * 0.6) | 0, tg = (ng * 0.7) | 0, tb = (nb * 0.6) | 0;
    ctx.fillStyle = `rgba(${tr},${tg},${tb},${t < 0.65 ? 0.85 : 0.45})`;
    let x = sNear - 160;
    for (let i = 0; x < W + 160; i++, x += 80) {
      if (i % 3 === 1) {
        const tx = x + 60, ty = groundY - 10;
        ctx.beginPath(); ctx.arc(tx, ty - 6, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillRect(tx - 1, ty - 4, 2, 5);
      }
    }
  }
}

function drawGround() {
  // Main ground body
  ctx.fillStyle = '#1c2440';
  ctx.fillRect(0, groundY, W, H - groundY);
  // Stone-block top edge (Mario-ish)
  const blockW = 56;
  const off = -((state.distance) % blockW);
  for (let x = off - blockW; x < W + blockW; x += blockW) {
    ctx.fillStyle = '#3d4a8a';
    ctx.fillRect(x, groundY, blockW - 2, 14);
    // Top highlight
    ctx.fillStyle = '#7986cb';
    ctx.fillRect(x, groundY, blockW - 2, 3);
    // Side shadow
    ctx.fillStyle = '#2a3370';
    ctx.fillRect(x + blockW - 5, groundY + 3, 3, 11);
    // Separator
    ctx.fillStyle = '#0e1430';
    ctx.fillRect(x + blockW - 2, groundY, 2, 14);
    // Inner crack
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x + 6, groundY + 8, 14, 1);
  }
  // Floor stripes deeper
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  const sw = 30;
  const off2 = -((state.distance) % (sw * 2));
  for (let x = off2; x < W; x += sw * 2) ctx.fillRect(x, groundY + 22, sw, 3);
  // Holes
  for (const o of state.obstacles) {
    if (o.kind !== 'hole') continue;
    ctx.fillStyle = '#0a0d1d';
    ctx.fillRect(o.x, groundY - 2, o.w, H - groundY + 4);
    const grad = ctx.createLinearGradient(o.x, groundY, o.x, groundY + 60);
    grad.addColorStop(0, 'rgba(0,0,0,0.7)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(o.x + 2, groundY, 5, 50);
    ctx.fillRect(o.x + o.w - 7, groundY, 5, 50);
  }
}

function drawClouds() {
  const t = state.running ? getCyclePhase() : 0.3;
  const isDay = t < 0.7;
  const ca = t > 0.78 ? Math.max(0.05, 0.18 - (t - 0.78) * 1.3) : 0.95;
  for (const c of state.clouds) {
    // Body fluffy
    ctx.fillStyle = isDay ? `rgba(255,255,255,${ca})` : `rgba(220,220,240,${ca})`;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI*2);
    ctx.arc(c.x + c.r*0.75, c.y + 3, c.r*0.85, 0, Math.PI*2);
    ctx.arc(c.x - c.r*0.65, c.y + 4, c.r*0.78, 0, Math.PI*2);
    ctx.arc(c.x + c.r*0.25, c.y - c.r*0.45, c.r*0.65, 0, Math.PI*2);
    ctx.arc(c.x - c.r*0.3, c.y - c.r*0.3, c.r*0.55, 0, Math.PI*2);
    ctx.fill();
    // Soft underside shadow
    if (isDay) {
      ctx.fillStyle = `rgba(150,180,220,${ca * 0.45})`;
      ctx.beginPath();
      ctx.arc(c.x, c.y + c.r*0.5, c.r*0.8, 0, Math.PI*2);
      ctx.arc(c.x + c.r*0.6, c.y + c.r*0.55, c.r*0.65, 0, Math.PI*2);
      ctx.arc(c.x - c.r*0.5, c.y + c.r*0.55, c.r*0.6, 0, Math.PI*2);
      ctx.fill();
    }
  }
}

function drawCutie(cx, cy, r, hue) {
  // Cute purple kawaii blob with pointy ears
  // Soft glow
  ctx.fillStyle = `hsla(${hue}, 60%, 60%, 0.22)`;
  ctx.beginPath(); ctx.arc(cx, cy, r * 1.5, 0, Math.PI*2); ctx.fill();
  // Body with gradient
  const grad = ctx.createRadialGradient(cx - r*0.3, cy - r*0.4, 1, cx, cy, r);
  grad.addColorStop(0, `hsl(${hue}, 65%, 75%)`);
  grad.addColorStop(1, `hsl(${hue}, 55%, 55%)`);
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
  // Pointy ears
  ctx.fillStyle = `hsl(${hue}, 55%, 55%)`;
  ctx.beginPath();
  ctx.moveTo(cx - r*0.6, cy - r*0.55);
  ctx.lineTo(cx - r*0.95, cy - r*1.2);
  ctx.lineTo(cx - r*0.15, cy - r*0.85);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + r*0.6, cy - r*0.55);
  ctx.lineTo(cx + r*0.95, cy - r*1.2);
  ctx.lineTo(cx + r*0.15, cy - r*0.85);
  ctx.closePath(); ctx.fill();
  // Inner ear pink
  ctx.fillStyle = '#f8bbd0';
  ctx.beginPath();
  ctx.moveTo(cx - r*0.55, cy - r*0.65);
  ctx.lineTo(cx - r*0.78, cy - r*1.05);
  ctx.lineTo(cx - r*0.32, cy - r*0.85);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + r*0.55, cy - r*0.65);
  ctx.lineTo(cx + r*0.78, cy - r*1.05);
  ctx.lineTo(cx + r*0.32, cy - r*0.85);
  ctx.closePath(); ctx.fill();
  // Cheek blush
  ctx.fillStyle = 'rgba(255,105,180,0.45)';
  ctx.beginPath(); ctx.arc(cx - r*0.55, cy + r*0.25, r*0.18, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r*0.55, cy + r*0.25, r*0.18, 0, Math.PI*2); ctx.fill();
  // Sparkly eyes
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath(); ctx.ellipse(cx - r*0.32, cy - r*0.05, r*0.22, r*0.32, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + r*0.32, cy - r*0.05, r*0.22, r*0.32, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx - r*0.25, cy - r*0.18, r*0.11, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r*0.39, cy - r*0.18, r*0.11, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx - r*0.40, cy + r*0.08, r*0.05, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r*0.24, cy + r*0.08, r*0.05, 0, Math.PI*2); ctx.fill();
  // Smile
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(cx, cy + r*0.35, r*0.18, 0, Math.PI); ctx.stroke();
}

function drawAllies() {
  for (let i = 0; i < state.allies.length; i++) {
    const a = state.allies[i];
    const bob = Math.sin(a.bob) * 3, r = 13;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(a.x, groundY + 4, r*0.8, 4, 0, 0, Math.PI*2); ctx.fill();
    drawCutie(a.x, a.y + bob, r, a.hue);
  }
}

// ===== Mini Dragon Player (chibi anime style) =====
function drawPlayer() {
  const px = player.x, py = player.y, w = player.w, h = player.h;
  const grounded = player.onGround && !player.falling;
  const ss = grounded ? 1 : Math.max(0.3, 1 - (groundY - (py + h)) / 200);
  if (!player.falling || player.y < groundY) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(px + w/2, groundY + 4, (w/2)*ss, 5*ss, 0, 0, Math.PI*2); ctx.fill();
  }
  const blink = state.invuln > 0 ? (Math.floor(state.invuln*18) % 2 === 0 ? 0.4 : 1) : 1;
  ctx.globalAlpha = blink;

  const cx = px + w/2;
  const rf = player.runFrame;

  // Tail behind
  const tailWag = Math.sin(rf * 0.7) * 4;
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.ellipse(px + 1, py + h * 0.66 + tailWag, 8, 5, -0.4, 0, Math.PI*2);
  ctx.fill();
  // Tail spade tip
  ctx.beginPath();
  ctx.moveTo(px - 5, py + h * 0.56 + tailWag);
  ctx.lineTo(px - 12, py + h * 0.5 + tailWag);
  ctx.lineTo(px - 10, py + h * 0.65 + tailWag);
  ctx.lineTo(px - 12, py + h * 0.78 + tailWag);
  ctx.lineTo(px - 5, py + h * 0.72 + tailWag);
  ctx.closePath();
  ctx.fill();

  // Wing (orange/peach, bat-like)
  const flap = grounded ? Math.sin(rf * 1.4) * 4 : Math.sin(rf * 6) * 8;
  ctx.fillStyle = '#ffab91';
  ctx.beginPath();
  ctx.moveTo(cx - 3, py + h * 0.42);
  ctx.quadraticCurveTo(cx - 14, py + h * 0.16 - flap, cx + 5, py + h * 0.14 - flap*0.3);
  ctx.quadraticCurveTo(cx + 2, py + h * 0.32, cx - 3, py + h * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.30)';
  ctx.beginPath();
  ctx.moveTo(cx - 3, py + h * 0.42);
  ctx.quadraticCurveTo(cx - 12, py + h * 0.20 - flap, cx + 4, py + h * 0.18 - flap*0.3);
  ctx.lineTo(cx - 3, py + h * 0.45);
  ctx.closePath();
  ctx.fill();
  // wing membrane lines
  ctx.strokeStyle = '#ff8a65';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 3, py + h * 0.42);
  ctx.lineTo(cx + 3, py + h * 0.20 - flap*0.3);
  ctx.stroke();

  // Body (chubby, gradient)
  const bodyGrad = ctx.createRadialGradient(cx + 2, py + h*0.5, 4, cx, py + h*0.62, w/1.6);
  bodyGrad.addColorStop(0, '#9ccc65');
  bodyGrad.addColorStop(1, '#33691e');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(cx + 1, py + h * 0.62, w/2 - 4, h/2 - 6, 0, 0, Math.PI*2);
  ctx.fill();

  // Belly cream
  ctx.fillStyle = '#fff9c4';
  ctx.beginPath();
  ctx.ellipse(cx + 2, py + h * 0.72, w/2 - 11, h/2 - 12, 0, 0, Math.PI*2);
  ctx.fill();
  // Belly soft stripes
  ctx.fillStyle = 'rgba(180,160,80,0.30)';
  for (let i = 0; i < 3; i++) {
    const sy = py + h * 0.66 + i * 4;
    ctx.beginPath();
    ctx.ellipse(cx + 2, sy, w/2 - 13, 0.7, 0, 0, Math.PI*2);
    ctx.fill();
  }

  // Back spikes (cream triangles)
  ctx.fillStyle = '#fff59d';
  for (let i = 0; i < 3; i++) {
    const sx = cx - 7 + i * 4;
    ctx.beginPath();
    ctx.moveTo(sx - 2, py + h * 0.45);
    ctx.lineTo(sx, py + h * 0.36);
    ctx.lineTo(sx + 2, py + h * 0.45);
    ctx.closePath();
    ctx.fill();
  }

  // Head (3/4 chibi)
  const headX = px + w * 0.74, headY = py + h * 0.32;
  const headGrad = ctx.createRadialGradient(headX + 2, headY - 3, 4, headX, headY, 14);
  headGrad.addColorStop(0, '#aed581');
  headGrad.addColorStop(1, '#33691e');
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.arc(headX, headY, 12, 0, Math.PI*2);
  ctx.fill();
  // Snout
  ctx.beginPath();
  ctx.ellipse(headX + 8, headY + 4, 7, 5, 0.1, 0, Math.PI*2);
  ctx.fill();

  // Cheek blush (kawaii)
  ctx.fillStyle = 'rgba(255,105,180,0.45)';
  ctx.beginPath();
  ctx.arc(headX + 6, headY + 6, 2.4, 0, Math.PI*2);
  ctx.fill();

  // Mouth (open with little fang)
  ctx.fillStyle = '#3d1a1a';
  ctx.beginPath();
  ctx.ellipse(headX + 9, headY + 6, 2.5, 1.8, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(headX + 8, headY + 5.2);
  ctx.lineTo(headX + 9, headY + 7.2);
  ctx.lineTo(headX + 10, headY + 5.2);
  ctx.closePath(); ctx.fill();

  // Horns (cream, slight outline)
  ctx.fillStyle = '#fff8e1';
  ctx.strokeStyle = '#bcaaa4';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(headX - 4, headY - 6);
  ctx.lineTo(headX - 6, headY - 14);
  ctx.lineTo(headX, headY - 9);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(headX + 3, headY - 8);
  ctx.lineTo(headX + 2, headY - 16);
  ctx.lineTo(headX + 7, headY - 9);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  // BIG anime eye
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.ellipse(headX + 2, headY - 1, 4, 5.5, 0, 0, Math.PI*2);
  ctx.fill();
  // iris (warm orange-brown)
  ctx.fillStyle = '#ff9966';
  ctx.beginPath();
  ctx.ellipse(headX + 2.5, headY, 3, 4.5, 0, 0, Math.PI*2);
  ctx.fill();
  // pupil
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(headX + 2.5, headY + 0.5, 1.5, 0, Math.PI*2);
  ctx.fill();
  // big shine
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(headX + 3.5, headY - 2, 1.6, 0, Math.PI*2);
  ctx.fill();
  // small shine
  ctx.beginPath();
  ctx.arc(headX + 1, headY + 1.8, 0.6, 0, Math.PI*2);
  ctx.fill();

  // Tiny T-rex front arm
  ctx.fillStyle = '#43a047';
  const armSwing = grounded ? Math.sin(rf + Math.PI) * 3 : 4;
  roundRect(px + w * 0.62, py + h * 0.6 + armSwing, 5, 8, 2, true);
  ctx.fillStyle = '#fff8e1';
  ctx.fillRect(px + w * 0.62, py + h * 0.6 + armSwing + 7, 5, 1);

  // Legs
  ctx.fillStyle = '#2e7d32';
  const ls = grounded ? Math.sin(rf) * 6 : -3;
  const rs = grounded ? Math.sin(rf + Math.PI) * 6 : -3;
  roundRect(px + w * 0.32, py + h - 7, 7, 7 + Math.max(0, ls), 2, true);
  roundRect(px + w * 0.55, py + h - 7, 7, 7 + Math.max(0, rs), 2, true);
  ctx.fillStyle = '#fff8e1';
  ctx.fillRect(px + w * 0.32, py + h - 1 + Math.max(0, ls), 7, 1);
  ctx.fillRect(px + w * 0.55, py + h - 1 + Math.max(0, rs), 7, 1);

  // Attack glow at mouth
  if (state.attackCd <= 0 && state.running && !player.dying) {
    ctx.fillStyle = 'rgba(255,150,50,0.9)';
    ctx.beginPath(); ctx.arc(headX + 13, headY + 4, 2 + state.firePower * 0.6, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawObstacles() {
  for (const o of state.obstacles) {
    if (o.kind === 'spike') {
      const segs = Math.max(1, Math.floor(o.w / 12));
      for (let i = 0; i < segs; i++) {
        const sx = o.x + i * (o.w / segs);
        const sw = o.w / segs;
        // Main red
        ctx.fillStyle = '#ef5350';
        ctx.beginPath();
        ctx.moveTo(sx, o.y + o.h);
        ctx.lineTo(sx + sw/2, o.y);
        ctx.lineTo(sx + sw, o.y + o.h);
        ctx.closePath(); ctx.fill();
        // Highlight (left half)
        ctx.fillStyle = '#ff8a80';
        ctx.beginPath();
        ctx.moveTo(sx + 1, o.y + o.h - 1);
        ctx.lineTo(sx + sw/2 - 0.5, o.y + 2);
        ctx.lineTo(sx + sw/2 - 0.5, o.y + o.h - 1);
        ctx.closePath(); ctx.fill();
        // Shadow (right half)
        ctx.fillStyle = '#b71c1c';
        ctx.beginPath();
        ctx.moveTo(sx + sw/2 + 0.5, o.y + 2);
        ctx.lineTo(sx + sw - 1, o.y + o.h - 1);
        ctx.lineTo(sx + sw/2 + 0.5, o.y + o.h - 1);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = 'rgba(120,30,30,0.65)';
      ctx.fillRect(o.x, o.y + o.h - 4, o.w, 4);
    } else if (o.kind === 'block') {
      // Brick wall with texture
      const brickH = 16, halfBW = 18;
      // Main background
      ctx.fillStyle = '#5e35b1';
      roundRect(o.x, o.y, o.w, o.h, 4, true);
      // Brick courses
      const rows = Math.ceil(o.h / brickH);
      for (let r = 0; r < rows; r++) {
        const ry = o.y + r * brickH;
        const stagger = (r % 2) * halfBW;
        for (let bx = o.x - halfBW + stagger; bx < o.x + o.w; bx += halfBW * 2) {
          const x0 = Math.max(o.x, bx), x1 = Math.min(o.x + o.w, bx + halfBW * 2 - 2);
          if (x1 <= x0) continue;
          // Brick face
          ctx.fillStyle = '#7e57c2';
          ctx.fillRect(x0 + 1, ry + 1, x1 - x0 - 1, Math.min(brickH - 2, o.y + o.h - ry - 1));
          // Top highlight
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.fillRect(x0 + 1, ry + 1, x1 - x0 - 1, 2);
          // Right shadow
          ctx.fillStyle = 'rgba(0,0,0,0.20)';
          ctx.fillRect(x1 - 2, ry + 1, 1, Math.min(brickH - 2, o.y + o.h - ry - 1));
        }
      }
      // Outer border
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(o.x + 0.5, o.y + 0.5, o.w - 1, o.h - 1);
      // Crosshair "shoot me" hint
      ctx.strokeStyle = '#fff59d'; ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(255,235,100,0.7)';
      ctx.shadowBlur = 6;
      const mcx = o.x + o.w/2, mcy = o.y + o.h/2;
      ctx.beginPath(); ctx.arc(mcx, mcy, 7, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mcx - 11, mcy); ctx.lineTo(mcx - 4, mcy);
      ctx.moveTo(mcx + 4, mcy); ctx.lineTo(mcx + 11, mcy);
      ctx.moveTo(mcx, mcy - 11); ctx.lineTo(mcx, mcy - 4);
      ctx.moveTo(mcx, mcy + 4); ctx.lineTo(mcx, mcy + 11);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (o.kind === 'fireball') {
      const cxF = o.x + o.w/2, cyF = o.y + o.h/2;
      const gd = ctx.createRadialGradient(cxF, cyF, 4, cxF, cyF, o.w);
      gd.addColorStop(0, 'rgba(255,235,59,0.9)');
      gd.addColorStop(0.5, 'rgba(255,138,101,0.6)');
      gd.addColorStop(1, 'rgba(255,82,82,0)');
      ctx.fillStyle = gd;
      ctx.fillRect(cxF - o.w, cyF - o.w, o.w*2, o.w*2);
      ctx.fillStyle = '#ff8a65';
      ctx.beginPath(); ctx.arc(cxF, cyF, o.w*0.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff59d';
      ctx.beginPath(); ctx.arc(cxF + Math.cos(o.spin)*3, cyF + Math.sin(o.spin)*3, o.w*0.25, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,138,101,0.4)';
      for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(cxF + i * 6, cyF + Math.sin(o.spin + i)*3, o.w*0.4 - i*2, 0, Math.PI*2);
        ctx.fill();
      }
    } else if (o.kind === 'friend') {
      const bob = Math.sin(o.bob) * 2;
      drawCutie(o.x + o.w/2, o.y + o.h/2 + bob, o.w/2, 285);
      // Down arrow hint above
      ctx.fillStyle = '#fff59d';
      const ay = o.y - 8 + Math.sin(o.bob * 2) * 2;
      ctx.beginPath();
      ctx.moveTo(o.x + o.w/2, ay + 6);
      ctx.lineTo(o.x + o.w/2 - 5, ay - 2);
      ctx.lineTo(o.x + o.w/2 + 5, ay - 2);
      ctx.closePath(); ctx.fill();
    }
  }
}
function drawCoins() {
  for (const c of state.coins) {
    const bob = Math.sin(c.bob) * 2;
    const w = Math.abs(Math.cos(c.bob)) * c.r * 2 + 4;
    const isPremium = (c.value || 1) >= 5;
    if (isPremium) {
      // halo
      const gd = ctx.createRadialGradient(c.x, c.y + bob, 4, c.x, c.y + bob, c.r * 2.4);
      gd.addColorStop(0, 'rgba(255,235,59,0.55)');
      gd.addColorStop(0.5, 'rgba(255,82,82,0.25)');
      gd.addColorStop(1, 'rgba(255,82,82,0)');
      ctx.fillStyle = gd;
      ctx.fillRect(c.x - c.r*2.4, c.y + bob - c.r*2.4, c.r*4.8, c.r*4.8);
      // edge
      ctx.fillStyle = '#7c1d1d';
      ctx.beginPath(); ctx.ellipse(c.x, c.y + bob + 2, w/2 + 1, c.r + 1, 0, 0, Math.PI*2); ctx.fill();
      // gem face (gradient)
      const gf = ctx.createLinearGradient(c.x, c.y + bob - c.r, c.x, c.y + bob + c.r);
      gf.addColorStop(0, '#fff59d');
      gf.addColorStop(0.5, '#ff5252');
      gf.addColorStop(1, '#7e57c2');
      ctx.fillStyle = gf;
      ctx.beginPath(); ctx.ellipse(c.x, c.y + bob, w/2, c.r, 0, 0, Math.PI*2); ctx.fill();
      // shine
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath(); ctx.ellipse(c.x - 3, c.y + bob - 4, w/4, c.r/3, -0.3, 0, Math.PI*2); ctx.fill();
      // "5"
      if (w > 8) {
        ctx.fillStyle = '#fff';
        ctx.font = '900 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2;
        ctx.strokeText('5', c.x, c.y + bob);
        ctx.fillText('5', c.x, c.y + bob);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      }
      // sparkle particle
      if (Math.random() < 0.18) {
        state.particles.push({
          x: c.x + (Math.random()-0.5) * c.r * 2,
          y: c.y + bob + (Math.random()-0.5) * c.r * 2,
          vx: (Math.random()-0.5) * 30, vy: -20 - Math.random() * 30,
          life: 0.5, age: 0, r: 1.5 + Math.random(), c: Math.random() < 0.5 ? '#fff59d' : '#ff5252',
        });
      }
    } else {
      ctx.fillStyle = '#b8860b';
      ctx.beginPath(); ctx.ellipse(c.x, c.y + bob + 1, w/2, c.r, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffd700';
      ctx.beginPath(); ctx.ellipse(c.x, c.y + bob, w/2, c.r, 0, 0, Math.PI*2); ctx.fill();
      if (w > 6) {
        ctx.fillStyle = '#fff59d';
        ctx.font = '700 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('¥', c.x, c.y + bob);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      }
    }
  }
}
function drawPickups() {
  for (const p of state.pickups) {
    const bob = Math.sin(p.bob) * 3;
    const cx = p.x + p.w/2, cy = p.y + p.h/2 + bob;
    const gd = ctx.createRadialGradient(cx, cy, 4, cx, cy, p.w);
    gd.addColorStop(0, 'rgba(0,229,255,0.9)');
    gd.addColorStop(1, 'rgba(0,229,255,0)');
    ctx.fillStyle = gd;
    ctx.fillRect(cx - p.w, cy - p.w, p.w*2, p.w*2);
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - 10);
    ctx.lineTo(cx + 4, cy - 2);
    ctx.lineTo(cx - 1, cy - 1);
    ctx.lineTo(cx + 5, cy + 10);
    ctx.lineTo(cx - 4, cy + 2);
    ctx.lineTo(cx + 1, cy + 1);
    ctx.closePath(); ctx.fill();
  }
}
function drawProjectiles() {
  for (const p of state.projectiles) {
    ctx.fillStyle = 'rgba(255,235,100,0.4)';
    ctx.beginPath(); ctx.arc(p.x - 14, p.y, p.r*1.4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff59d';
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(p.x + 1, p.y - 1, p.r*0.55, 0, Math.PI*2); ctx.fill();
  }
}
function drawEnemyShots() {
  for (const e of state.enemyShots) {
    ctx.fillStyle = 'rgba(255,82,82,0.4)';
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r*1.5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ff5252';
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(e.x - 1, e.y - 1, e.r*0.4, 0, Math.PI*2); ctx.fill();
  }
}
function drawBoss() {
  const b = state.boss; if (!b) return;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(b.x + b.w/2, groundY + 4, b.w*0.4, 6, 0, 0, Math.PI*2); ctx.fill();
  const gx = b.x + b.w/2, gy = b.y + b.h/2;
  const grd = ctx.createRadialGradient(gx, gy, 10, gx, gy, b.w);
  grd.addColorStop(0, 'rgba(255,82,82,0.4)');
  grd.addColorStop(1, 'rgba(255,82,82,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(gx - b.w, gy - b.w, b.w*2, b.w*2);
  ctx.fillStyle = b.hitFlash > 0 ? '#ffcdd2' : '#c62828';
  roundRect(b.x, b.y, b.w, b.h, 18, true);
  ctx.fillStyle = '#8e0000';
  for (let i = 0; i < 5; i++) {
    const sx = b.x + 12 + i * ((b.w - 24)/4);
    ctx.beginPath();
    ctx.moveTo(sx - 5, b.y + 5);
    ctx.lineTo(sx, b.y - 8);
    ctx.lineTo(sx + 5, b.y + 5);
    ctx.closePath(); ctx.fill();
  }
  const ecx = b.x + b.w/2, ecy = b.y + b.h*0.45;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(ecx, ecy, 16, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#1a1a2e';
  const px2 = ecx + Math.cos(b.eyeAngle)*6, py2 = ecy + Math.sin(b.eyeAngle)*6;
  ctx.beginPath(); ctx.arc(px2, py2, 7, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ff5252';
  ctx.beginPath(); ctx.arc(px2 - 2, py2 - 2, 2, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#1a1a2e';
  roundRect(b.x + b.w*0.25, b.y + b.h*0.72, b.w*0.5, 8, 3, true);
  const hpW = b.w + 16, hpH = 8, hpX = b.x - 8, hpY = b.y - 22;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  roundRect(hpX, hpY, hpW, hpH, 4, true);
  ctx.fillStyle = '#ff5252';
  roundRect(hpX + 2, hpY + 2, (hpW - 4) * (b.hp / b.maxHp), hpH - 4, 3, true);
}
function drawParticles() {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
    ctx.fillStyle = p.c;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function drawFloats() {
  for (const t of state.floatTexts) {
    const a = 1 - t.age / t.life;
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = t.color;
    ctx.font = `900 ${t.size}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 4;
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

function render() {
  ctx.clearRect(0, 0, W, H);
  let sx = 0, sy = 0;
  if (state.shake > 0) {
    sx = (Math.random() - 0.5) * 12 * state.shake;
    sy = (Math.random() - 0.5) * 12 * state.shake;
  }
  drawSky();
  ctx.save();
  ctx.translate(sx, sy);
  drawClouds();
  drawMountains();
  drawGround();
  drawAllies();
  drawCoins();
  drawPickups();
  drawObstacles();
  drawBoss();
  drawProjectiles();
  drawEnemyShots();
  drawPlayer();
  drawParticles();
  drawFloats();
  ctx.restore();
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${state.flash * 0.6})`;
    ctx.fillRect(0, 0, W, H);
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

// ===== Input =====
function onTap(e) {
  if (e.cancelable) e.preventDefault();
  Sfx.init(); Sfx.resume();
  if (!state.running) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX ?? (e.touches && e.touches[0].clientX) ?? 0) - rect.left;
  if (x < W / 2) jump(); else attack();
}
canvas.addEventListener('pointerdown', onTap);
window.addEventListener('keydown', e => {
  if (!gachaModal.classList.contains('hidden') || !equipModal.classList.contains('hidden')) return;
  Sfx.init(); Sfx.resume();
  if (e.code === 'Space' || e.code === 'KeyZ' || e.code === 'ArrowUp') {
    e.preventDefault();
    if (state.over || !state.running) {
      if (overlay.classList.contains('hidden')) return;
      reset();
    } else jump();
  } else if (e.code === 'KeyX' || e.code === 'ArrowRight') {
    e.preventDefault();
    if (state.running) attack();
  } else if (e.code === 'KeyM') muteBtn.click();
});
startBtn.addEventListener('click', () => { Sfx.init(); Sfx.resume(); reset(); });

// ===== Gacha UI =====
function refreshGacha() {
  gachaTickets.textContent = `所持コイン: ${save.coins}🪙 / 1回${GACHA_COST}🪙`;
  pullBtn.disabled = save.coins < GACHA_COST;
}
function showPullResult(id, isDup) {
  const c = COMPANIONS[id];
  pullStage.innerHTML = '';
  const card = document.createElement('div'); card.className = 'pullCard';
  const r = document.createElement('div'); r.className = 'rarity ' + c.rarity; r.textContent = c.rarity;
  const ic = document.createElement('div'); ic.className = 'icon'; ic.textContent = c.icon;
  const nm = document.createElement('div'); nm.className = 'cName'; nm.textContent = c.name;
  const ds = document.createElement('div'); ds.className = 'cDesc'; ds.textContent = c.desc;
  card.append(r, ic, nm, ds);
  if (isDup) { const d = document.createElement('div'); d.className = 'dup'; d.textContent = 'DUPLICATE'; card.appendChild(d); }
  pullStage.appendChild(card);
  setTimeout(() => card.classList.add('pop'), 30);
  if (c.rarity === 'SSR') Sfx.pullSSR();
  else if (c.rarity === 'SR') Sfx.pullSR();
  else if (c.rarity === 'R') Sfx.pullR();
  else Sfx.pullN();
}
function doPull() {
  if (save.coins < GACHA_COST) return;
  save.coins -= GACHA_COST;
  const id = pullGacha();
  const isDup = save.unlocked.includes(id);
  if (!isDup) save.unlocked.push(id);
  persist();
  coinsEl.textContent = save.coins;
  showPullResult(id, isDup);
  refreshGacha();
}
gachaBtn.addEventListener('click', () => { Sfx.init(); Sfx.resume(); refreshGacha(); pullStage.innerHTML = '<div style="opacity:0.5;font-size:13px;">PULLボタンで引く</div>'; gachaModal.classList.remove('hidden'); });
pullBtn.addEventListener('click', doPull);
closeGachaBtn.addEventListener('click', () => gachaModal.classList.add('hidden'));

// ===== Equip UI =====
function refreshEquip() {
  equipStatus.textContent = `装備中: ${save.equipped.length} / 3`;
  equipGrid.innerHTML = '';
  for (const id of COMPANION_IDS) {
    const c = COMPANIONS[id];
    const owned = save.unlocked.includes(id);
    const equipped = save.equipped.includes(id);
    const item = document.createElement('div');
    item.className = 'cItem' + (owned ? '' : ' locked') + (equipped ? ' equipped' : '');
    const rb = document.createElement('div'); rb.className = 'rb'; rb.style.background = RARITY_COLOR[c.rarity]; rb.textContent = c.rarity;
    const ic = document.createElement('div'); ic.className = 'ic'; ic.textContent = owned ? c.icon : '？';
    const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = owned ? c.name : '???';
    const ds = document.createElement('div'); ds.className = 'ds'; ds.textContent = owned ? c.desc : '未入手';
    item.append(rb, ic, nm, ds);
    if (equipped) { const e = document.createElement('div'); e.className = 'eqMark'; e.textContent = 'EQ'; item.appendChild(e); }
    if (owned) {
      item.addEventListener('click', () => {
        if (equipped) save.equipped = save.equipped.filter(x => x !== id);
        else if (save.equipped.length < 3) save.equipped.push(id);
        persist();
        refreshEquip();
      });
    }
    equipGrid.appendChild(item);
  }
}
equipBtn.addEventListener('click', () => { refreshEquip(); equipModal.classList.remove('hidden'); });
closeEquipBtn.addEventListener('click', () => equipModal.classList.add('hidden'));

// ===== Init =====
resetPlayer();
seedClouds();
firepowEl.textContent = 1;
requestAnimationFrame(t => { last = t; loop(t); });
})();
