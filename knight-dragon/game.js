(() => {
'use strict';

// ============================================================
// SOUND ENGINE
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
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  toggleSe() { this.seOn = !this.seOn; return this.seOn; }
  toggleBgm() { this.bgmOn = !this.bgmOn; if (this.bgmOn) this.startBgm(); else this.stopBgm(); return this.bgmOn; }
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
  swordSlash() { this._tone({ freq: 1400, dur: 0.07, vol: 0.14, type: 'sawtooth', slide: -1000 }); this._noise({ dur: 0.05, vol: 0.07, freq: 5500 }); }
  spearStab()  { this._tone({ freq: 700, dur: 0.05, vol: 0.13, type: 'square', slide: 500 }); this._tone({ freq: 1500, dur: 0.04, vol: 0.08, type: 'sine', delay: 0.04 }); }
  hammerSmash(){ this._tone({ freq: 80,  dur: 0.22, vol: 0.22, type: 'sawtooth', slide: -30 }); this._noise({ dur: 0.18, vol: 0.13, freq: 220 }); this._tone({ freq: 60, dur: 0.1, vol: 0.15, type: 'triangle', delay: 0.12 }); }
  drop()       { [659, 880, 1175].forEach((f, i) => this._tone({ freq: f, dur: 0.18, vol: 0.13, type: 'triangle', delay: i * 0.08 })); this._tone({ freq: 1568, dur: 0.4, vol: 0.1, type: 'sine', delay: 0.3 }); }
  weakHit()  { this._tone({ freq: 440, dur: 0.12, vol: 0.16, type: 'square', slide: 200 }); this._tone({ freq: 660, dur: 0.1, vol: 0.1, type: 'triangle', delay: 0.03 }); }
  crit()     { this._tone({ freq: 800, dur: 0.18, vol: 0.18, slide: -500, type: 'sawtooth' }); this._tone({ freq: 600, dur: 0.2, vol: 0.13, type: 'triangle', delay: 0.02 }); this._noise({ dur: 0.1, vol: 0.05, freq: 2000 }); }
  guard()    { this._noise({ dur: 0.08, vol: 0.1, freq: 2500 }); this._tone({ freq: 300, dur: 0.06, vol: 0.08, type: 'square' }); }
  just()     { this._tone({ freq: 1200, dur: 0.15, vol: 0.13, type: 'sine' }); this._tone({ freq: 1600, dur: 0.18, vol: 0.1, type: 'sine', delay: 0.04 }); this._tone({ freq: 2000, dur: 0.12, vol: 0.08, type: 'sine', delay: 0.08 }); }
  miracle()  { [1100, 1320, 1760, 2200, 2640].forEach((f, i) => this._tone({ freq: f, dur: 0.5, vol: 0.13, type: 'triangle', delay: i * 0.05 })); }
  early()    { this._tone({ freq: 200, dur: 0.05, vol: 0.08, type: 'square' }); }
  piyo()     { this._tone({ freq: 600, dur: 0.08, vol: 0.13, type: 'sine', slide: 800 }); this._tone({ freq: 1400, dur: 0.1, vol: 0.1, type: 'sine', delay: 0.1 }); this._tone({ freq: 880, dur: 0.12, vol: 0.08, type: 'triangle', delay: 0.18 }); }
  enemyAtk() { this._tone({ freq: 110, dur: 0.18, vol: 0.18, type: 'sawtooth', slide: -50 }); this._noise({ dur: 0.1, vol: 0.07, freq: 300 }); }
  apShort()  { this._tone({ freq: 200, dur: 0.06, vol: 0.08, type: 'square' }); }
  meat()     { this._tone({ freq: 660, dur: 0.1, vol: 0.13, type: 'triangle', slide: 200 }); this._tone({ freq: 880, dur: 0.12, vol: 0.1, type: 'sine', delay: 0.08 }); }
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
const W = canvas.width;   // 480
const H = canvas.height;  // 600

// ============================================================
// DATA
// ============================================================
const MOVES = {
  // Sword 剣 - 5 moves cycling
  sw_swing:    { name: '斬り上げ',     ap: 2, dmg: 14, pp: 14, type: 'sword' },
  sw_strong:   { name: 'ブリ斬',       ap: 3, dmg: 22, pp: 18, type: 'sword' },
  sw_thrust:   { name: 'メガスラスト', ap: 4, dmg: 32, pp: 22, type: 'sword' },
  sw_special:  { name: 'メガブレイク', ap: 5, dmg: 42, pp: 28, type: 'sword' },
  sw_seven:    { name: 'セブンクロス', ap: 7, dmg: 64, pp: 38, type: 'sword' },
  // Spear 槍 - 5 moves, fast
  sp_jab:      { name: 'シャベリン',   ap: 1, dmg: 5,  pp: 10, type: 'spear' },
  sp_kick:     { name: 'キック',       ap: 2, dmg: 12, pp: 14, type: 'spear' },
  sp_charge:   { name: 'とっしん',     ap: 3, dmg: 22, pp: 22, type: 'spear' },
  sp_sweep:    { name: 'ヤリ払い',     ap: 3, dmg: 18, pp: 16, type: 'spear', aoe: true },
  sp_dragon:   { name: 'ドラゴン突き', ap: 5, dmg: 42, pp: 28, type: 'spear' },
  // Hammer ハンマー - 4 moves, heavy
  hm_swing:    { name: 'ふっとばし',   ap: 2, dmg: 16, pp: 14, type: 'hammer' },
  hm_smash:    { name: '大地砕き',     ap: 3, dmg: 22, pp: 18, type: 'hammer', aoe: true },
  hm_geki:     { name: '激',           ap: 4, dmg: 34, pp: 24, type: 'hammer' },
  hm_quake:    { name: '地割れ',       ap: 5, dmg: 44, pp: 30, type: 'hammer', aoe: true },
};

const WEAPONS = {
  sword:  { name: '剣',       icon: '⚔', color: '#7be0ff', moves: ['sw_swing', 'sw_strong', 'sw_thrust', 'sw_special', 'sw_seven'] },
  spear:  { name: '槍',       icon: '🔱', color: '#ffd066', moves: ['sp_jab', 'sp_kick', 'sp_charge', 'sp_sweep', 'sp_dragon'] },
  hammer: { name: 'ハンマー', icon: '🔨', color: '#cc8855', moves: ['hm_swing', 'hm_smash', 'hm_geki', 'hm_quake'] },
};

// ============================================================
// PIXEL ART WEAPON ICONS (SVG)
// ============================================================
const WEAPON_SVG = {
  sword: `<svg viewBox="0 0 16 24" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
    <rect x="7" y="2" width="2" height="13" fill="#e8f8ff"/>
    <rect x="7" y="2" width="1" height="13" fill="#7be0ff"/>
    <rect x="7" y="14" width="2" height="2" fill="#9adde8"/>
    <rect x="3" y="15" width="10" height="2" fill="#a8a8a8"/>
    <rect x="3" y="15" width="10" height="1" fill="#dddddd"/>
    <rect x="2" y="15" width="1" height="2" fill="#666"/>
    <rect x="13" y="15" width="1" height="2" fill="#666"/>
    <rect x="7" y="17" width="2" height="4" fill="#a5621a"/>
    <rect x="6" y="21" width="4" height="2" fill="#d4a040"/>
  </svg>`,
  spear: `<svg viewBox="0 0 16 24" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
    <rect x="7" y="1" width="2" height="2" fill="#fff8c0"/>
    <rect x="6" y="3" width="4" height="1" fill="#fff8c0"/>
    <rect x="6" y="4" width="4" height="1" fill="#ffe080"/>
    <rect x="5" y="5" width="6" height="1" fill="#ffe080"/>
    <rect x="5" y="6" width="6" height="1" fill="#ffd066"/>
    <rect x="6" y="7" width="4" height="1" fill="#ffd066"/>
    <rect x="6" y="8" width="4" height="1" fill="#d8a040"/>
    <rect x="7" y="9" width="2" height="2" fill="#a87020"/>
    <rect x="7" y="11" width="2" height="11" fill="#a5621a"/>
    <rect x="6" y="13" width="4" height="1" fill="#ffd066"/>
    <rect x="6" y="20" width="4" height="1" fill="#ffd066"/>
  </svg>`,
  hammer: `<svg viewBox="0 0 16 24" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="3" width="12" height="2" fill="#e0a070"/>
    <rect x="2" y="5" width="12" height="5" fill="#cc8855"/>
    <rect x="2" y="10" width="12" height="2" fill="#a06030"/>
    <rect x="3" y="3" width="1" height="9" fill="#a06030"/>
    <rect x="12" y="3" width="1" height="9" fill="#a06030"/>
    <rect x="6" y="6" width="4" height="3" fill="#e0a070"/>
    <rect x="7" y="12" width="2" height="10" fill="#a5621a"/>
    <rect x="6" y="13" width="4" height="1" fill="#ffd066"/>
    <rect x="6" y="20" width="4" height="1" fill="#ffd066"/>
  </svg>`,
};

function injectWeaponIcons() {
  // SVGs are inlined in index.html via <use href> - nothing to do here.
}

const ENEMIES = {
  // Tier 1
  slime:    { name: 'スライム',     hp: 42,  weak: 'spear',  atkDmg: 8,  atk: [1.4, 2.4], color: '#5cf',    accent: '#fff',    size: 0.8 },
  ghost:    { name: 'ゴースト',     hp: 55,  weak: 'sword',  atkDmg: 10, atk: [1.9, 2.9], color: '#c8d0ff', accent: '#fff',    size: 0.9 },
  fabit:    { name: 'ファビット',   hp: 58,  weak: 'spear',  atkDmg: 11, atk: [1.6, 2.4], color: '#f0c8d0', accent: '#fff',    size: 0.85 },
  mushroom: { name: 'キノコ',       hp: 65,  weak: 'spear',  atkDmg: 10, atk: [1.6, 2.6], color: '#e85a4a', accent: '#fff8e0', size: 0.85 },
  // Tier 2
  boarRed:  { name: 'すっころび',   hp: 90,  weak: 'hammer', atkDmg: 13, atk: [1.8, 2.6], color: '#d24850', accent: '#fff8c0', size: 0.95 },
  boarBlue: { name: 'こおりむし',   hp: 100, weak: 'sword',  atkDmg: 14, atk: [1.9, 2.7], color: '#3a8fd6', accent: '#bfe8ff', size: 0.95 },
  mermaid:  { name: 'マーメイド',   hp: 90,  weak: 'sword',  atkDmg: 13, atk: [1.6, 2.4], color: '#4ad6c0', accent: '#ffd8a0', size: 0.9 },
  turtle:   { name: 'カメ',         hp: 145, weak: 'hammer', atkDmg: 14, atk: [2.4, 3.2], color: '#5a8a3a', accent: '#a06030', size: 0.95 },
  // Bosses (bigger sprites + alt attack patterns)
  dragon:    { name: 'ドラゴン',     hp: 220, weak: 'spear',  atkDmg: 18, atk: [2.2, 3.2], color: '#d62828', accent: '#ffce5a', size: 1.5,
               altAtk: { name: '火炎', dmg: 28, atk: [3.2, 4.0] } },
  kingDrag:  { name: 'キングドラゴン', hp: 420, weak: 'spear',  atkDmg: 24, atk: [2.0, 3.0], color: '#c020e0', accent: '#ffce5a', size: 1.7,
               altAtk: { name: '竜の咆哮', dmg: 38, atk: [3.0, 4.0], aoe: true } },
  golem:     { name: 'ゴーレム',     hp: 280, weak: 'hammer', atkDmg: 20, atk: [2.4, 3.4], color: '#9aa0a8', accent: '#5a5f6b', size: 1.5,
               altAtk: { name: '岩拳',  dmg: 32, atk: [3.4, 4.4] } },
  rockGolem: { name: 'ロックゴーレム', hp: 540, weak: 'hammer', atkDmg: 28, atk: [2.0, 3.0], color: '#7a4a30', accent: '#3a2a1a', size: 1.8,
               altAtk: { name: '岩塊投げ', dmg: 46, atk: [3.0, 4.0] } },
};

const STAGES = [
  {
    name: 'はじまりの森',
    rounds: [
      ['slime', 'slime'],
      ['ghost', 'slime'],
      ['fabit', 'fabit'],
      ['ghost', 'fabit', 'slime'],
    ],
  },
  {
    name: 'ワクテッカ草原',
    rounds: [
      ['fabit', 'mushroom'],
      ['fabit', 'fabit', 'mushroom'],
      ['mushroom', 'mushroom'],
      ['boarRed', 'fabit'],
    ],
  },
  {
    name: 'チャップビーチ',
    rounds: [
      ['mermaid', 'slime'],
      ['mermaid', 'mermaid'],
      ['turtle', 'slime'],
      ['mermaid', 'turtle'],
    ],
  },
  {
    name: 'グリニアの森',
    rounds: [
      ['ghost', 'fabit', 'mushroom'],
      ['boarRed', 'mushroom', 'fabit'],
      ['ghost', 'ghost', 'ghost'],
      ['boarRed', 'boarRed', 'mushroom'],
    ],
  },
  {
    name: '凍てつく谷',
    rounds: [
      ['boarBlue', 'boarBlue'],
      ['fabit', 'boarBlue', 'mermaid'],
      ['boarBlue', 'turtle'],
      ['dragon'],
    ],
  },
  {
    name: 'アーチッチ火山',
    rounds: [
      ['boarRed', 'mushroom', 'mushroom'],
      ['boarRed', 'boarRed'],
      ['mushroom', 'mushroom', 'boarRed'],
      ['dragon', 'mushroom'],
    ],
  },
  {
    name: '竜のねぐら',
    rounds: [
      ['dragon', 'fabit'],
      ['dragon', 'dragon'],
      ['boarRed', 'boarBlue', 'dragon'],
      ['kingDrag'],
    ],
  },
  {
    name: '魔王城',
    rounds: [
      ['ghost', 'ghost', 'turtle'],
      ['boarBlue', 'turtle', 'mermaid'],
      ['golem', 'mushroom'],
      ['rockGolem'],
    ],
  },
];

const SPECIAL_MOVES = {
  'sword,spear,hammer':   { name: '聖騎士奥義', dmg: 56, color: '#ff80ff', hits: 4 },
  'hammer,spear,sword':   { name: '英雄連舞',   dmg: 48, color: '#ffeb3b', hits: 4 },
  'sword,sword,sword':    { name: '剣聖斬',     dmg: 36, color: '#7be0ff', hits: 3 },
  'spear,spear,spear':    { name: '貫穿撃',     dmg: 30, color: '#ffd066', hits: 1 },
  'hammer,hammer,hammer': { name: '大地砕',     dmg: 42, color: '#cc8855', hits: 1 },
};

// ============================================================
// STATE
// ============================================================
let state;
let lastTime = 0;
let shake = 0;

const SAVE_KEY = 'kishidora_save_v2';
const TYPE_NAMES = { sword: '剣', spear: '槍', hammer: 'ハンマー', shield: '盾' };
const ITEM_TYPES = ['sword', 'spear', 'hammer', 'shield'];

// Named items by rarity (drop flavor)
const ITEM_NAMES = {
  sword: {
    common: '鉄の剣',
    r:      '銀の剣',
    sr:     '聖騎士の剣',
    ur:     'エクスカリバー',
  },
  spear: {
    common: '鉄の槍',
    r:      '銀の槍',
    sr:     '王家の槍',
    ur:     'グングニル',
  },
  hammer: {
    common: '鉄のハンマー',
    r:      '銀のハンマー',
    sr:     '大戦槌',
    ur:     'ミョルニル',
  },
  shield: {
    common: '木の盾',
    r:      '鋼の盾',
    sr:     '聖盾',
    ur:     'アイギス',
  },
};

function itemName(type, rarity) {
  return (ITEM_NAMES[type] && ITEM_NAMES[type][rarity]) || TYPE_NAMES[type];
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}

function saveProgress() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      inventory: state.inventory,
      equipped: state.equipped,
      nextItemId: state.nextItemId,
      clearedStages: state.clearedStages,
      level: state.level,
      exp: state.exp,
      gold: state.gold,
      meatCount: state.meatCount,
    }));
  } catch (e) {}
}

function loadAndMigrate() {
  const raw = loadSave();
  if (!raw) return null;
  // Already new format
  if (raw.inventory && raw.equipped) {
    // Backfill names for items saved before naming was introduced
    for (const item of raw.inventory) {
      if (!item.name) item.name = itemName(item.type, item.rarity);
    }
    return raw;
  }
  // Old format with state.weapons – migrate
  if (raw.weapons) {
    const inventory = [];
    const equipped = {};
    let id = 1;
    for (const t of ITEM_TYPES) {
      const w = raw.weapons[t] || { plus: 0, rarity: 'common' };
      const rarity = w.rarity || 'common';
      const item = { id: id++, type: t, rarity, plus: w.plus || 0, name: itemName(t, rarity) };
      inventory.push(item);
      equipped[t] = item.id;
    }
    return {
      inventory,
      equipped,
      nextItemId: id,
      clearedStages: raw.clearedStages || [],
    };
  }
  return null;
}

function defaultInventory() {
  let id = 1;
  const inventory = [];
  const equipped = {};
  for (const t of ITEM_TYPES) {
    const item = { id: id++, type: t, rarity: 'common', plus: 0, name: itemName(t, 'common') };
    inventory.push(item);
    equipped[t] = item.id;
  }
  return { inventory, equipped, nextItemId: id };
}

function getEquippedItem(type) {
  if (!state || !state.equipped) return null;
  const id = state.equipped[type];
  return state.inventory.find(i => i.id === id) || null;
}

function resetState() {
  const saved = loadAndMigrate();
  const initial = saved ? {
    inventory: saved.inventory,
    equipped: saved.equipped,
    nextItemId: saved.nextItemId || (Math.max(0, ...saved.inventory.map(i => i.id)) + 1),
    clearedStages: saved.clearedStages || [],
  } : { ...defaultInventory(), clearedStages: [] };

  state = {
    scene: 'mainMenu',
    level: (saved && saved.level) || 1,
    exp: (saved && saved.exp) || 0,
    gold: (saved && saved.gold) || 0,
    knight: null,
    enemies: [],
    targetIdx: 0,
    stageIdx: 0,
    roundIdx: 0,
    floatTexts: [],
    time: 0,
    shieldUntil: 0,
    flashTimer: 0,
    weakHint: '',
    weakHintTimer: 0,
    weaponHistory: [],
    weaponQueueIdx: { sword: 0, spear: 0, hammer: 0 },
    inventory: initial.inventory,
    equipped: initial.equipped,
    nextItemId: initial.nextItemId,
    clearedStages: initial.clearedStages,
    chests: [],
    pet: createPet(),
    goldenDragon: null,
    specialFx: null,
    specialFxTimer: 0,
    hitCombo: 0,
    hitComboTimer: 0,
    meatCount: (saved && typeof saved.meatCount === 'number') ? saved.meatCount : 2,
    paused: false,
    roundTransition: 0,
    showRoundText: 0,
    dropFx: null,
    dropFxTimer: 0,
    clouds: makeClouds(),
  };
  state.knight = createKnight();
  syncHud();
  showMainMenu();
}

function expForLevel(lv) {
  // Total EXP needed to reach lv
  return Math.floor(80 * Math.pow(lv - 1, 1.4));
}

function expToNext() {
  return expForLevel(state.level + 1) - state.exp;
}

function gainExp(amount) {
  state.exp += amount;
  let leveled = 0;
  while (state.exp >= expForLevel(state.level + 1)) {
    state.level++;
    leveled++;
  }
  if (leveled > 0) {
    // Heal to new max
    state.knight.maxHp = calcMaxHp(state.level);
    state.knight.hp = state.knight.maxHp;
  }
  saveProgress();
  return leveled;
}

function makeClouds() {
  const arr = [];
  for (let i = 0; i < 6; i++) {
    arr.push({ x: Math.random() * W, y: 30 + Math.random() * 80, speed: 4 + Math.random() * 8, size: 14 + Math.random() * 16 });
  }
  return arr;
}

function calcMaxHp(level) { return 180 + level * 20; }

function createKnight() {
  const lv = (state && state.level) || 1;
  const maxHp = calcMaxHp(lv);
  return { hp: maxHp, maxHp, ap: 10, maxAp: 10, apRegen: 0.95, x: 95, y: 290, hitTimer: 0, attackAnim: 0, attackWeapon: null };
}

function createEnemy(type, slot) {
  const p = ENEMIES[type];
  const baseX = 250 + slot * 78;
  const baseY = 290;
  const e = {
    type, name: p.name, hp: p.hp, maxHp: p.hp,
    weak: p.weak, atkDmg: p.atkDmg, atk: p.atk,
    color: p.color, accent: p.accent, size: p.size || 1.0,
    x: baseX, y: baseY,
    pp: 0, maxPp: 100, stunned: false, stunTimer: 0,
    attackTimer: rand(p.atk[0], p.atk[1]) + 1.0 + slot * 0.3,
    hitTimer: 0,
    bob: Math.random() * Math.PI * 2,
    altAtk: p.altAtk || null,
    pendingAtk: null,
    slot,
  };
  rollEnemyAttack(e);
  return e;
}

function rollEnemyAttack(e) {
  if (e.altAtk && Math.random() < 0.35) {
    e.pendingAtk = { name: e.altAtk.name, dmg: e.altAtk.dmg, aoe: !!e.altAtk.aoe };
    e.attackTimer = rand(e.altAtk.atk[0], e.altAtk.atk[1]);
  } else {
    e.pendingAtk = { name: '攻撃', dmg: e.atkDmg, aoe: false };
    e.attackTimer = rand(e.atk[0], e.atk[1]);
  }
}

function rand(a, b) { return a + Math.random() * (b - a); }

function addFloat(text, x, y, color, ttl = 0.9, size = 22) {
  state.floatTexts.push({ text, x, y, color, ttl, maxTtl: ttl, size });
}

function spawnRound() {
  const stage = STAGES[state.stageIdx];
  const round = stage.rounds[state.roundIdx];
  state.enemies = round.map((type, i) => createEnemy(type, i));
  state.targetIdx = 0;
  state.showRoundText = 1.5;
  state.weaponHistory = [];
  state.roundCleared = false;
  // ~7% chance of a golden dragon flyby per round
  if (!state.goldenDragon && Math.random() < 0.07) {
    spawnGoldenDragon();
  }
}

function spawnGoldenDragon() {
  state.goldenDragon = {
    x: -50,
    y: 70 + Math.random() * 30,
    vx: 70,
    hp: 80,
    maxHp: 80,
    hitTimer: 0,
    bob: 0,
  };
  addFloat('★ 金のドラゴン出現!', W / 2, 100, '#ffd066', 2.0, 22);
  sound.special();
}

function tryHitGoldenDragon(sx, sy) {
  if (!state.goldenDragon) return false;
  const gd = state.goldenDragon;
  const d = Math.hypot(sx - gd.x, sy - gd.y);
  if (d > 60) return false;
  // Apply the player's currently-equipped sword/spear/hammer dmg + level bonus
  const baseDmg = 18 + state.level * 3;
  gd.hp -= baseDmg;
  gd.hitTimer = 0.3;
  sound.hit();
  addFloat(`-${baseDmg}`, gd.x, gd.y - 30, '#ffe080', 0.7, 16);
  if (gd.hp <= 0) onGoldenDragonDefeated();
  return true;
}

function onGoldenDragonDefeated() {
  const gold = 600 + Math.floor(Math.random() * 400);
  state.gold = (state.gold || 0) + gold;
  // Bonus UR chest dropped into the current pile
  const types = ITEM_TYPES;
  const type = types[Math.floor(Math.random() * types.length)];
  state.chests.push({ type, rarity: 'ur', plus: 5, opened: false });
  renderChestStack();
  addFloat('★ 金のドラゴン撃破!', W / 2, 100, '#ffd066', 2.6, 28);
  addFloat(`+${gold} GOLD  /  UR装備!`, W / 2, 140, '#ffe080', 2.6, 22);
  sound.victory();
  state.goldenDragon = null;
  saveProgress();
}

// Pet companion (always active during battle)
const PET_TYPES = {
  fairy: { name: 'フェアリー', dmg: 8, cooldown: 4.0 },
};
function createPet() {
  return { type: 'fairy', timer: 4.0, attackAnim: 0, targetX: 0, targetY: 0 };
}
function petAttack() {
  if (state.scene !== 'battle' || state.paused || !state.pet) return;
  const alive = aliveEnemies();
  if (alive.length === 0) return;
  const target = alive[Math.floor(Math.random() * alive.length)];
  const cfg = PET_TYPES[state.pet.type] || PET_TYPES.fairy;
  const dmg = cfg.dmg + state.level;
  target.hp = Math.max(0, target.hp - dmg);
  target.hitTimer = 0.2;
  addFloat(`✦${dmg}`, target.x, target.y - 40, '#80ffff', 0.8, 14);
  state.pet.attackAnim = 0.5;
  state.pet.targetX = target.x;
  state.pet.targetY = target.y;
  if (target.hp <= 0 && !target._goldGiven) {
    target._goldGiven = true;
    const reward = Math.max(2, Math.floor(target.maxHp / 8));
    state.gold = (state.gold || 0) + reward;
    addFloat(`💰+${reward}`, target.x, target.y - 18, '#ffd066', 1.0, 14);
  }
  if (aliveEnemies().length === 0) onRoundClear();
}

function aliveEnemies() {
  return state.enemies.filter(e => e.hp > 0);
}

function getTarget() {
  const alive = aliveEnemies();
  if (alive.length === 0) return null;
  // Try targetIdx first
  if (state.enemies[state.targetIdx] && state.enemies[state.targetIdx].hp > 0) {
    return state.enemies[state.targetIdx];
  }
  // Fall back to first alive
  for (let i = 0; i < state.enemies.length; i++) {
    if (state.enemies[i].hp > 0) {
      state.targetIdx = i;
      return state.enemies[i];
    }
  }
  return null;
}

function nextAttacker() {
  // Returns the alive enemy with smallest attackTimer (the one about to attack next)
  let best = null;
  for (const e of state.enemies) {
    if (e.hp <= 0 || e.stunned) continue;
    if (!best || e.attackTimer < best.attackTimer) best = e;
  }
  return best;
}

function previewSpecial(history) {
  if (history.length < 2) return null;
  const [a, b] = history.slice(-2);
  for (const [key, sp] of Object.entries(SPECIAL_MOVES)) {
    const parts = key.split(',');
    if (parts[0] === a && parts[1] === b) return { needWeapon: parts[2], name: sp.name, color: sp.color };
  }
  return null;
}

function getCurrentMove(weaponKey) {
  const weapon = WEAPONS[weaponKey];
  return MOVES[weapon.moves[state.weaponQueueIdx[weaponKey]]];
}

function getNextMove(weaponKey) {
  const weapon = WEAPONS[weaponKey];
  const nextIdx = (state.weaponQueueIdx[weaponKey] + 1) % weapon.moves.length;
  return MOVES[weapon.moves[nextIdx]];
}

// ============================================================
// ACTIONS
// ============================================================
function attack(weaponKey) {
  if (state.scene !== 'battle' || state.paused) return;
  const k = state.knight;
  const move = getCurrentMove(weaponKey);
  if (k.ap < move.ap) {
    addFloat('AP不足!', k.x, k.y - 60, '#ff8080', 0.8, 16);
    sound.apShort();
    return;
  }
  k.ap -= move.ap;
  k.attackAnim = weaponKey === 'hammer' ? 0.45 : 0.32;
  k.attackWeapon = weaponKey;

  state.weaponHistory.push(weaponKey);
  if (state.weaponHistory.length > 3) state.weaponHistory.shift();

  // Special move check (3-weapon combo recipe)
  let special = null;
  if (state.weaponHistory.length === 3) {
    special = SPECIAL_MOVES[state.weaponHistory.join(',')];
  }

  // Advance weapon queue
  const weapon = WEAPONS[weaponKey];
  state.weaponQueueIdx[weaponKey] = (state.weaponQueueIdx[weaponKey] + 1) % weapon.moves.length;

  if (special) {
    state.weaponHistory = [];
    fireSpecial(special);
    syncHud();
    return;
  }

  // Apply move to enemy(ies)
  const targets = move.aoe ? aliveEnemies() : [getTarget()].filter(Boolean);
  if (targets.length === 0) { syncHud(); return; }

  const equipped = getEquippedItem(weaponKey);
  const enchant = (equipped ? equipped.plus : 0) * 0.08;
  // Per-weapon rarity bonuses
  const dmgBonus  = (weaponKey === 'sword')  ? getEffect('sword',  'dmgBonus')  : 0;
  const critBonus = (weaponKey === 'sword')  ? getEffect('sword',  'critBonus') : 0;
  const ppBonus   = (weaponKey === 'spear')  ? getEffect('spear',  'ppBonus')   : 0;
  const aoeBonus  = (weaponKey === 'hammer' && move.aoe) ? getEffect('hammer', 'aoeBonus') : 0;
  const stunBonus = getEffect('hammer', 'stunBonus'); // passive: extends PIYO duration

  for (const target of targets) {
    const isWeak = target.weak === weaponKey;
    const luckyCrit = !target.stunned && critBonus > 0 && Math.random() < critBonus;
    const crit = target.stunned || luckyCrit;
    const mult = (isWeak ? 1.4 : 1.0) * (crit ? 1.6 : 1) * (1 + enchant) * (1 + dmgBonus + aoeBonus);
    const dmg = Math.round(move.dmg * mult);
    target.hp = Math.max(0, target.hp - dmg);
    target.hitTimer = 0.3;

    if (!target.stunned) {
      target.pp += move.pp * (isWeak ? 2.6 : 1) * (1 + ppBonus);
      if (target.pp >= target.maxPp) {
        target.pp = target.maxPp;
        target.stunned = true;
        target.stunTimer = 4 * (1 + stunBonus);
        target.attackTimer = 999;
        sound.piyo();
        addFloat('PIYO!!', target.x, target.y - 60, '#ffeb3b', 1.2, 24);
      }
    } else {
      k.ap = Math.min(k.maxAp, k.ap + 0.5);
    }

    let label = '';
    if (crit && luckyCrit) label = 'CRIT★ ';
    else if (crit) label = 'CRIT! ';
    else if (isWeak) label = 'WEAK! ';
    addFloat(label + dmg, target.x + (Math.random() * 20 - 10), target.y - 30, crit ? '#ff5252' : (isWeak ? '#ffd066' : '#ffffff'), 0.85);

    if (isWeak && !crit) {
      state.weakHint = `${move.name} は ${target.name} の弱点!`;
      state.weakHintTimer = 1.0;
    }

    // Gold drop on kill
    if (target.hp <= 0 && !target._goldGiven) {
      target._goldGiven = true;
      const reward = Math.max(2, Math.floor(target.maxHp / 8));
      state.gold = (state.gold || 0) + reward;
      addFloat(`💰+${reward}`, target.x, target.y - 18, '#ffd066', 1.0, 14);
    }
  }

  // Hit combo
  state.hitCombo++;
  state.hitComboTimer = 1.5;

  shake = Math.min(8, shake + (move.aoe ? 6 : 3));

  // Per-weapon swing sound first, then impact sound
  if (weaponKey === 'sword') sound.swordSlash();
  else if (weaponKey === 'spear') sound.spearStab();
  else sound.hammerSmash();
  const firstTarget = targets[0];
  if (firstTarget && firstTarget.stunned) sound.crit();
  else if (firstTarget && firstTarget.weak === weaponKey) sound.weakHit();

  // Show move name floating
  addFloat(move.name, k.x + 40, k.y - 80, weapon.color, 0.7, 14);

  // Check for round/stage clear
  if (aliveEnemies().length === 0) {
    onRoundClear();
  }
  syncHud();
}

function fireSpecial(special) {
  shake = 18;
  state.flashTimer = 0.6;
  state.specialFx = { name: special.name, color: special.color, hits: special.hits };
  state.specialFxTimer = 1.4;
  sound.special();

  const totalDmg = special.dmg;
  const hits = special.hits || 1;
  const perHit = Math.round(totalDmg / hits);
  const targets = aliveEnemies();
  if (targets.length === 0) return;

  for (let h = 0; h < hits; h++) {
    setTimeout(() => {
      if (state.scene !== 'battle') return;
      const alive = aliveEnemies();
      if (alive.length === 0) return;
      // Hit all enemies for special
      for (const en of alive) {
        en.hp = Math.max(0, en.hp - perHit);
        en.hitTimer = 0.3;
        addFloat(`-${perHit}`, en.x + (Math.random() * 30 - 15), en.y - 30 - h * 14, special.color, 0.85, 22);
        if (en.hp <= 0 && !en._goldGiven) {
          en._goldGiven = true;
          const reward = Math.max(2, Math.floor(en.maxHp / 8));
          state.gold = (state.gold || 0) + reward;
          addFloat(`💰+${reward}`, en.x, en.y - 18, '#ffd066', 1.0, 14);
        }
      }
      shake = Math.min(20, shake + 4);
      if (aliveEnemies().length === 0) onRoundClear();
    }, h * 130);
  }
  addFloat(special.name + '!!', W / 2, 200, special.color, 1.6, 32);
}

function tryGuard() {
  if (state.scene !== 'battle' || state.paused) return;
  const k = state.knight;
  state.shieldUntil = state.time + 0.35;

  const guardWindow = getEffect('shield', 'guardWindow');
  const defBonus = getEffect('shield', 'defBonus');

  const incoming = nextAttacker();
  if (!incoming || incoming.attackTimer > 0.7 + guardWindow * 0.5) {
    addFloat('早い!', k.x, k.y - 60, '#aaa', 0.6, 16);
    sound.early();
    return;
  }

  const t = incoming.attackTimer;
  let kind, dmgMult, apGain = 0, hpGain = 0, color = '#80c0ff';
  if (t < 0.07 + guardWindow)        { kind = 'MIRACLE'; dmgMult = 0;   apGain = 2; hpGain = 18; color = '#ff80ff'; }
  else if (t < 0.20 + guardWindow)   { kind = 'JUST';    dmgMult = 0.1; apGain = 1; color = '#ffeb3b'; }
  else                               { kind = 'GUARD';   dmgMult = 0.4; color = '#80c0ff'; }

  const atkDmg = (incoming.pendingAtk && incoming.pendingAtk.dmg) || incoming.atkDmg;
  const dmg = Math.round(atkDmg * dmgMult * (1 - defBonus));
  k.hp = Math.max(0, k.hp - dmg);
  k.hp = Math.min(k.maxHp, k.hp + hpGain);
  k.ap = Math.min(k.maxAp, k.ap + apGain);
  state.flashTimer = kind === 'MIRACLE' ? 0.4 : kind === 'JUST' ? 0.25 : 0.15;

  if (kind === 'MIRACLE') sound.miracle();
  else if (kind === 'JUST') sound.just();
  else sound.guard();

  let detail = `${kind}`;
  if (dmg > 0) detail += ` -${dmg}`;
  if (hpGain > 0) detail += ` +HP${hpGain}`;
  addFloat(detail, k.x, k.y - 50, color, 1.2, kind === 'MIRACLE' ? 26 : 20);

  rollEnemyAttack(incoming);
  if (!incoming.stunned) incoming.pp = Math.min(incoming.maxPp, incoming.pp + 12);
  syncHud();
}

function useMeat() {
  if (state.scene !== 'battle' || state.paused) return;
  if (state.meatCount <= 0) return;
  state.meatCount--;
  state.knight.ap = state.knight.maxAp;
  sound.meat();
  addFloat('AP MAX!', state.knight.x, state.knight.y - 60, '#ffd066', 1.0, 22);
  saveProgress();
  syncHud();
}

function togglePause() {
  if (state.scene !== 'battle') return;
  state.paused = !state.paused;
  const ag = document.getElementById('audio-toggle');
  const ov = document.getElementById('overlay');
  if (state.paused) {
    if (ag) ag.classList.add('show-options');
    if (ov) ov.classList.add('paused-mode');
    showOverlay('PAUSED', 'タップで再開', 'paused');
  } else {
    if (ag) ag.classList.remove('show-options');
    if (ov) ov.classList.remove('paused-mode');
    hideOverlay();
  }
}

function cycleTarget() {
  const alive = state.enemies.filter(e => e.hp > 0);
  if (alive.length <= 1) return;
  let i = state.targetIdx;
  for (let n = 0; n < state.enemies.length; n++) {
    i = (i + 1) % state.enemies.length;
    if (state.enemies[i].hp > 0) {
      state.targetIdx = i;
      return;
    }
  }
}

function onEnemyAttackLand(e) {
  const k = state.knight;
  const atk = e.pendingAtk || { name: '攻撃', dmg: e.atkDmg };
  const defBonus = getEffect('shield', 'defBonus');
  const finalDmg = Math.max(1, Math.round(atk.dmg * (1 - defBonus)));
  k.hp = Math.max(0, k.hp - finalDmg);
  k.hitTimer = 0.3;
  shake = Math.min(12, shake + (atk.dmg > e.atkDmg ? 12 : 8));
  sound.enemyAtk();
  if (atk.name && atk.name !== '攻撃') {
    addFloat(atk.name + '!', e.x, e.y - 60, '#ff80b0', 1.0, 18);
  }
  addFloat(`-${finalDmg}`, k.x, k.y - 30, '#ff6b6b', 0.85);
  rollEnemyAttack(e);
  state.hitCombo = 0;
  if (k.hp <= 0) onDefeat();
  syncHud();
}

function onRoundClear() {
  if (state.roundCleared) return;
  state.roundCleared = true;
  // Drop chance per round clear (chest accumulates, not yet revealed)
  if (Math.random() < 0.65) {
    setTimeout(() => { if (state.scene === 'battle') addChest(); }, 350);
  }

  state.roundIdx++;
  const stage = STAGES[state.stageIdx];
  if (state.roundIdx >= stage.rounds.length) {
    // Stage cleared → bonus chests + result screen
    setTimeout(() => { if (state.scene === 'battle') addChest(true); }, 500);
    setTimeout(() => { if (state.scene === 'battle') addChest(true); }, 800);
    setTimeout(onStageClear, 1500);
    return;
  }
  state.roundTransition = 1.0;
  setTimeout(() => {
    if (state.scene !== 'battle') return;
    spawnRound();
    syncHud();
  }, 1100);
}

function onStageClear() {
  if (state.scene !== 'battle') return;
  if (!state.clearedStages.includes(state.stageIdx)) {
    state.clearedStages.push(state.stageIdx);
  }
  // Grant EXP based on stage difficulty
  const expGained = 60 + state.stageIdx * 40;
  state._expGained = expGained;
  state._levelsGained = gainExp(expGained);
  // Stage clear gold bonus
  const goldGained = 80 + state.stageIdx * 60;
  state.gold = (state.gold || 0) + goldGained;
  state._goldGained = goldGained;
  saveProgress();
  showResultScreen();
}

const RARITY_RANK = { common: 0, r: 1, sr: 2, ur: 3 };
const RARITY_COLOR = { common: '#dddddd', r: '#5fb0e8', sr: '#d090ff', ur: '#ffd066' };
const RARITY_LABEL = { common: 'コモン', r: 'レア', sr: 'SR', ur: 'UR' };

// Per-type rarity effects (multipliers / additive bonuses).
// Higher rarity → bigger numbers + new bonuses unlock at SR / UR.
const ITEM_EFFECTS = {
  sword: {
    common: { dmgBonus: 0,    critBonus: 0    },
    r:      { dmgBonus: 0.05, critBonus: 0.05 },
    sr:     { dmgBonus: 0.12, critBonus: 0.12 },
    ur:     { dmgBonus: 0.22, critBonus: 0.22 },
  },
  spear: {
    common: { apRegenBonus: 0,    ppBonus: 0    },
    r:      { apRegenBonus: 0.10, ppBonus: 0.08 },
    sr:     { apRegenBonus: 0.22, ppBonus: 0.18 },
    ur:     { apRegenBonus: 0.40, ppBonus: 0.32 },
  },
  hammer: {
    common: { aoeBonus: 0,    stunBonus: 0    },
    r:      { aoeBonus: 0.10, stunBonus: 0.15 },
    sr:     { aoeBonus: 0.22, stunBonus: 0.32 },
    ur:     { aoeBonus: 0.40, stunBonus: 0.55 },
  },
  shield: {
    common: { defBonus: 0,    guardWindow: 0    },
    r:      { defBonus: 0.08, guardWindow: 0.04 },
    sr:     { defBonus: 0.18, guardWindow: 0.08 },
    ur:     { defBonus: 0.30, guardWindow: 0.14 },
  },
};

function getRarityEff(type, rarity, key) {
  const t = ITEM_EFFECTS[type];
  if (!t) return 0;
  const r = t[rarity];
  if (!r) return 0;
  return r[key] || 0;
}

function getEffect(type, key) {
  const item = getEquippedItem(type);
  if (!item) return 0;
  return getRarityEff(type, item.rarity, key);
}

function describeItemEffects(item) {
  if (!item) return [];
  const eff = (ITEM_EFFECTS[item.type] && ITEM_EFFECTS[item.type][item.rarity]) || {};
  const lines = [];
  if (item.type === 'sword') {
    if (eff.dmgBonus)  lines.push({ label: '攻撃力',   value: `+${Math.round(eff.dmgBonus * 100)}%` });
    if (eff.critBonus) lines.push({ label: '会心率',   value: `+${Math.round(eff.critBonus * 100)}%` });
  } else if (item.type === 'spear') {
    if (eff.apRegenBonus) lines.push({ label: 'AP回復',  value: `+${Math.round(eff.apRegenBonus * 100)}%` });
    if (eff.ppBonus)      lines.push({ label: 'PP蓄積',  value: `+${Math.round(eff.ppBonus * 100)}%` });
  } else if (item.type === 'hammer') {
    if (eff.aoeBonus)  lines.push({ label: 'AOE威力', value: `+${Math.round(eff.aoeBonus * 100)}%` });
    if (eff.stunBonus) lines.push({ label: 'PIYO時間', value: `+${Math.round(eff.stunBonus * 100)}%` });
  } else if (item.type === 'shield') {
    if (eff.defBonus)    lines.push({ label: '被ダメ軽減', value: `${Math.round(eff.defBonus * 100)}%` });
    if (eff.guardWindow) lines.push({ label: 'ガード猶予', value: `+${Math.round(eff.guardWindow * 1000)}ms` });
  }
  if (item.plus) lines.push({ label: '強化', value: `+${item.plus} 装備` });
  return lines;
}

function rollDrop(forceHigh) {
  const r = Math.random();
  if (forceHigh) {
    if (r < 0.15) return { rarity: 'ur', plus: 5 };
    if (r < 0.45) return { rarity: 'sr', plus: 3 };
    return { rarity: 'r', plus: 2 };
  }
  if (r < 0.04) return { rarity: 'ur', plus: 4 };
  if (r < 0.16) return { rarity: 'sr', plus: 3 };
  if (r < 0.45) return { rarity: 'r', plus: 2 };
  return { rarity: 'common', plus: 1 };
}

function addChest(forceHigh) {
  // 30% chance shield, otherwise weapon (sword/spear/hammer)
  let target;
  if (Math.random() < 0.25) {
    target = 'shield';
  } else {
    const ws = ['sword', 'spear', 'hammer'];
    target = ws[Math.floor(Math.random() * 3)];
  }
  const drop = rollDrop(forceHigh);
  state.chests.push({
    type: target,
    rarity: drop.rarity,
    plus: drop.plus,
    opened: false,
  });
  sound.drop();
  addFloat('宝箱を発見!', W / 2, 120, '#ffd066', 1.2, 20);
  renderChestStack();
}

function renderChestStack() {
  const wrap = document.getElementById('chest-stack');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (const c of state.chests) {
    if (c.opened) continue;
    const el = document.createElement('div');
    el.className = `mini-chest rarity-${c.rarity}`;
    el.innerHTML = '<svg><use href="#ico-chest"/></svg>';
    wrap.appendChild(el);
  }
}

// ============================================================
// SCENE: MAIN MENU
// ============================================================
const MENU_SCREENS = ['main-menu', 'stage-select', 'equipment-screen', 'result-screen', 'shop-screen'];
function hideAllScreens() {
  for (const id of MENU_SCREENS) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  }
}

let _lockToastTimer = null;
function showLockToast() {
  let toast = document.getElementById('lock-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'lock-toast';
    toast.textContent = '🔒 未実装';
    toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(20,20,30,0.95);color:#ffd066;padding:14px 24px;border-radius:8px;border:2px solid #8b6940;font-weight:bold;z-index:50;font-size:14px;letter-spacing:2px;pointer-events:none;transition:opacity 0.2s;';
    document.body.appendChild(toast);
  }
  toast.style.opacity = '1';
  toast.style.display = 'block';
  if (_lockToastTimer) clearTimeout(_lockToastTimer);
  _lockToastTimer = setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.display = 'none'; }, 220);
  }, 900);
  sound.early();
}

function showMainMenu() {
  state.scene = 'mainMenu';
  hideOverlay();
  hideAllScreens();
  document.getElementById('main-menu').classList.remove('hidden');
  // Update menu status
  const cleared = (state.clearedStages || []).length;
  const totalEl = document.getElementById('menu-total');
  const clearedEl = document.getElementById('menu-cleared');
  const rankEl = document.getElementById('status-rank-num');
  const coinEl = document.getElementById('status-coin');
  if (totalEl) totalEl.textContent = STAGES.length;
  if (clearedEl) clearedEl.textContent = cleared;
  if (rankEl) rankEl.textContent = state.level;
  if (coinEl) coinEl.textContent = state.gold || 0;
}

// ============================================================
// SCENE: EQUIPMENT
// ============================================================
function showEquipmentScreen() {
  state.scene = 'equipment';
  hideOverlay();
  hideAllScreens();
  document.getElementById('equipment-screen').classList.remove('hidden');
  renderEquippedGrid();
  renderInventoryList();
}

function renderEquippedGrid() {
  const grid = document.getElementById('equipped-grid');
  if (!grid) return;
  grid.innerHTML = '';
  for (const t of ITEM_TYPES) {
    const item = getEquippedItem(t);
    const card = document.createElement('div');
    const rarity = item ? item.rarity : 'common';
    card.className = `equip-card rarity-${rarity}`;
    const effLines = item ? describeItemEffects(item) : [];
    const effHtml = effLines.length
      ? `<div class="equip-effects">${effLines.map(l =>
          `<div class="eff-row"><span class="eff-label">${l.label}</span><span class="eff-value">${l.value}</span></div>`
        ).join('')}</div>`
      : '<div class="equip-effects empty">効果なし</div>';
    card.innerHTML = `
      <div class="equip-head">
        <svg class="equip-icon"><use href="#ico-${t}"/></svg>
        <div class="equip-meta">
          <div class="equip-slot-label">${TYPE_NAMES[t]}</div>
          <div class="equip-name">${item ? (item.name || itemName(t, item.rarity)) : '未装備'}</div>
          ${item ? `<div class="equip-stats"><span class="rarity-tag">${RARITY_LABEL[item.rarity]}</span><span class="plus-tag">+${item.plus}</span></div>` : ''}
        </div>
      </div>
      ${effHtml}
    `;
    grid.appendChild(card);
  }
}

function renderInventoryList() {
  const list = document.getElementById('inventory-list');
  if (!list) return;
  list.innerHTML = '';

  const grouped = { sword: [], spear: [], hammer: [], shield: [] };
  for (const item of state.inventory) {
    if (grouped[item.type]) grouped[item.type].push(item);
  }

  let totalShown = 0;
  for (const t of ITEM_TYPES) {
    const items = grouped[t].slice();
    if (items.length === 0) continue;
    items.sort((a, b) => (RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity]) || (b.plus - a.plus));

    const section = document.createElement('div');
    section.className = 'inv-section';
    const heading = document.createElement('h4');
    heading.textContent = `${TYPE_NAMES[t]} (${items.length})`;
    section.appendChild(heading);

    const itemsDiv = document.createElement('div');
    itemsDiv.className = 'inv-items';

    for (const item of items) {
      const isEquipped = state.equipped[t] === item.id;
      const card = document.createElement('button');
      card.className = `inv-item rarity-${item.rarity}${isEquipped ? ' equipped' : ''}`;
      card.innerHTML = `
        <svg><use href="#ico-${t}"/></svg>
        <div class="inv-name">${item.name || itemName(t, item.rarity)}</div>
        <div class="inv-info">
          <span class="rarity-tag">${RARITY_LABEL[item.rarity]}</span>
          <span class="plus-tag">+${item.plus}</span>
        </div>
        ${isEquipped ? '<div class="equipped-badge">装備中</div>' : ''}
      `;
      if (!isEquipped) {
        card.addEventListener('click', () => equipItem(item.id));
      }
      itemsDiv.appendChild(card);
      totalShown++;
    }

    section.appendChild(itemsDiv);
    list.appendChild(section);
  }

  if (totalShown === 0) {
    list.innerHTML = '<p style="text-align:center;color:#aaa;padding:14px">所持品なし<br><span style="font-size:11px">ステージで宝箱を獲得しよう</span></p>';
  }
}

function equipItem(itemId) {
  const item = state.inventory.find(i => i.id === itemId);
  if (!item) return;
  state.equipped[item.type] = itemId;
  sound.drop();
  saveProgress();
  renderEquippedGrid();
  renderInventoryList();
  syncHud();
}

// ============================================================
// SCENE: STAGE SELECT
// ============================================================
// ============================================================
// SCENE: SHOP
// ============================================================
const SHOP_ITEMS = [
  { id: 'meat',    icon: '🍖', name: 'マンガ肉', desc: '次のステージにマンガ肉×1を追加', cost: 80,   action: 'meat' },
  { id: 'r',       icon: '🎁', name: '武器ガチャ',     desc: 'レア(R)以上の武器1点が確定', cost: 250,  action: 'gacha_r',  rarity: 'r' },
  { id: 'sr',      icon: '⭐', name: 'SR武器ガチャ',    desc: 'SR以上の武器1点が確定',     cost: 1200, action: 'gacha_sr', rarity: 'sr' },
  { id: 'ur',      icon: '🌟', name: 'UR武器ガチャ',    desc: 'UR武器1点が確定',           cost: 6000, action: 'gacha_ur', rarity: 'ur' },
];

function showShopScreen() {
  state.scene = 'shop';
  hideOverlay();
  hideAllScreens();
  document.getElementById('shop-screen').classList.remove('hidden');
  renderShopList();
}

function renderShopList() {
  const goldEl = document.getElementById('shop-gold');
  if (goldEl) goldEl.textContent = state.gold || 0;
  const list = document.getElementById('shop-list');
  if (!list) return;
  list.innerHTML = '';
  for (const item of SHOP_ITEMS) {
    const el = document.createElement('div');
    const rarityClass = item.rarity ? ` rarity-${item.rarity}` : '';
    el.className = `shop-item${rarityClass}`;
    el.innerHTML = `
      <div class="shop-icon">${item.icon}</div>
      <div class="shop-meta">
        <div class="shop-name">${item.name}</div>
        <div class="shop-desc">${item.desc}</div>
      </div>
      <button class="shop-buy" data-action="${item.action}">買う<span class="price">💰 ${item.cost}</span></button>
    `;
    const btn = el.querySelector('.shop-buy');
    btn.disabled = (state.gold || 0) < item.cost;
    btn.addEventListener('click', () => buyShopItem(item));
    list.appendChild(el);
  }
}

function buyShopItem(item) {
  if ((state.gold || 0) < item.cost) return;
  state.gold -= item.cost;
  if (item.action === 'meat') {
    state.meatCount = (state.meatCount || 0) + 1;
    showShopToast('🍖 マンガ肉 を入手！\n次のバトルで使えます');
  } else if (item.action === 'gacha_r') {
    const got = rollShopGacha('r');
    showShopToast(`${got.name} +${got.plus}\n[${RARITY_LABEL[got.rarity]}] を入手!`);
  } else if (item.action === 'gacha_sr') {
    const got = rollShopGacha('sr');
    showShopToast(`${got.name} +${got.plus}\n[${RARITY_LABEL[got.rarity]}] を入手!`);
  } else if (item.action === 'gacha_ur') {
    const got = rollShopGacha('ur');
    showShopToast(`★ ${got.name} +${got.plus}\n[${RARITY_LABEL[got.rarity]}] を入手! ★`);
  }
  sound.drop();
  saveProgress();
  renderShopList();
}

function rollShopGacha(minRarity) {
  const types = ITEM_TYPES;
  const type = types[Math.floor(Math.random() * types.length)];
  let rarity, plus;
  if (minRarity === 'ur') {
    rarity = 'ur'; plus = 5;
  } else if (minRarity === 'sr') {
    const r = Math.random();
    if (r < 0.20) { rarity = 'ur'; plus = 4; }
    else { rarity = 'sr'; plus = 3; }
  } else { // 'r'
    const r = Math.random();
    if (r < 0.05) { rarity = 'ur'; plus = 4; }
    else if (r < 0.25) { rarity = 'sr'; plus = 3; }
    else { rarity = 'r'; plus = 2; }
  }
  const newItem = {
    id: state.nextItemId++,
    type,
    rarity,
    plus,
    name: itemName(type, rarity),
  };
  state.inventory.push(newItem);
  // Auto-equip if better
  const cur = getEquippedItem(type);
  const better = !cur || RARITY_RANK[rarity] > RARITY_RANK[cur.rarity] ||
    (rarity === cur.rarity && plus > cur.plus);
  if (better) state.equipped[type] = newItem.id;
  return newItem;
}

function showShopToast(text) {
  let toast = document.getElementById('shop-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'shop-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = text.replace(/\n/g, '<br>');
  toast.style.opacity = '1';
  toast.style.display = 'block';
  toast.style.transform = 'translate(-50%, -50%) scale(1.06)';
  setTimeout(() => { toast.style.transform = 'translate(-50%, -50%) scale(1)'; }, 80);
  if (window._shopToastT) clearTimeout(window._shopToastT);
  window._shopToastT = setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.display = 'none'; }, 320);
  }, 1800);
}

function showStageSelect() {
  state.scene = 'stageSelect';
  hideOverlay();
  hideAllScreens();
  document.getElementById('stage-select').classList.remove('hidden');

  const list = document.getElementById('stage-list');
  list.innerHTML = '';

  for (let i = 0; i < STAGES.length; i++) {
    const stage = STAGES[i];
    const cleared = state.clearedStages.includes(i);
    const available = i === 0 || state.clearedStages.includes(i - 1);

    const btn = document.createElement('button');
    btn.className = `stage-item ${cleared ? 'cleared' : ''}`;
    btn.disabled = !available;
    btn.innerHTML = `
      <div class="stage-num">${i + 1}</div>
      <div class="stage-meta">
        <div class="stage-name">${stage.name}</div>
        <div class="stage-rounds">${stage.rounds.length} ROUNDS</div>
      </div>
      <div class="stage-status">${cleared ? '✓ 撃破' : (available ? '挑戦' : '🔒')}</div>
    `;
    if (available) {
      btn.addEventListener('click', () => startStage(i));
    }
    list.appendChild(btn);
  }
}

function startStage(idx) {
  state.scene = 'battle';
  state.stageIdx = idx;
  state.roundIdx = 0;
  state.knight = createKnight();
  state.chests = [];
  // Always have at least 2 meat to start; carry shop purchases beyond that
  state.meatCount = Math.max(state.meatCount || 0, 2);
  state.weaponHistory = [];
  state.weaponQueueIdx = { sword: 0, spear: 0, hammer: 0 };
  state.hitCombo = 0;
  state.hitComboTimer = 0;
  state.paused = false;
  state.goldenDragon = null;
  state.pet = createPet();
  hideAllScreens();
  hideOverlay();
  spawnRound();
  renderChestStack();
  syncHud();
}

// ============================================================
// SCENE: RESULT
// ============================================================
function showResultScreen() {
  state.scene = 'result';
  hideAllScreens();
  document.getElementById('result-screen').classList.remove('hidden');

  const stageName = document.getElementById('result-stage-name');
  const grid = document.getElementById('chest-grid');
  const nextBtn = document.getElementById('result-next');

  let statusLine = `${STAGES[state.stageIdx].name} クリア!`;
  if (state._expGained) {
    statusLine += `   +${state._expGained} EXP`;
    if (state._levelsGained) statusLine += `   ★ Lv ${state.level} に上昇!`;
  }
  if (state._goldGained) {
    statusLine += `   💰 +${state._goldGained}`;
  }
  stageName.textContent = statusLine;
  state._expGained = 0;
  state._levelsGained = 0;
  state._goldGained = 0;
  grid.innerHTML = '';

  // backwards compat: chests may have legacy 'weapon' field
  for (const c of state.chests) {
    if (!c.type && c.weapon) c.type = c.weapon;
  }

  if (state.chests.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#aaa;padding:20px">宝箱なし</p>';
    if (nextBtn) nextBtn.disabled = false;
    return;
  }

  // Sort by rarity ascending so easier ones open first
  state.chests.sort((a, b) => RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity]);

  // Render closed chests with their rarity color visible from the start
  state.chests.forEach((chest) => {
    const card = document.createElement('div');
    card.className = `chest-card rarity-${chest.rarity} pending`;
    card.innerHTML = `
      <svg class="chest-svg"><use href="#ico-chest"/></svg>
      <div class="rarity-tag" style="color:${RARITY_COLOR[chest.rarity]}">${RARITY_LABEL[chest.rarity]}</div>
    `;
    grid.appendChild(card);
  });

  // Disable "next" button while opening
  if (nextBtn) nextBtn.disabled = true;

  // Auto-open in sequence (lowest rarity first)
  const interval = 700;
  let delay = 600;
  state.chests.forEach((chest, i) => {
    setTimeout(() => {
      if (state.scene !== 'result') return;
      const card = grid.children[i];
      if (card) openChest(i, card);
    }, delay);
    delay += interval;
  });
  setTimeout(() => {
    if (state.scene === 'result' && nextBtn) nextBtn.disabled = false;
  }, delay);
}

function openChest(idx, cardEl) {
  const chest = state.chests[idx];
  if (chest.opened) return;
  chest.opened = true;
  // Allow legacy chests (where field was 'weapon')
  const type = chest.type || chest.weapon;

  // Create a new item and add to inventory
  const newItem = {
    id: state.nextItemId++,
    type,
    rarity: chest.rarity,
    plus: chest.plus,
    name: itemName(type, chest.rarity),
  };
  state.inventory.push(newItem);

  // Auto-equip if better than current
  const cur = getEquippedItem(type);
  const better = !cur || RARITY_RANK[newItem.rarity] > RARITY_RANK[cur.rarity] ||
    (newItem.rarity === cur.rarity && newItem.plus > cur.plus);
  if (better) state.equipped[type] = newItem.id;

  saveProgress();

  const iconId = `ico-${type}`;
  const equippedNote = better ? '<div class="equipped-badge" style="position:relative;top:auto;right:auto;display:inline-block;margin-top:4px">装備!</div>' : '';
  cardEl.classList.add('opened', `rarity-${chest.rarity}`);
  cardEl.innerHTML = `
    <svg class="chest-svg" style="display:block;width:30px;height:42px"><use href="#${iconId}"/></svg>
    <div class="chest-label">${newItem.name} +${chest.plus}</div>
    <div class="rarity-tag" style="color:${RARITY_COLOR[chest.rarity]}">${RARITY_LABEL[chest.rarity]}</div>
    ${equippedNote}
  `;
  if (chest.rarity === 'ur') {
    showUrFanfare(newItem);
  } else {
    sound.drop();
  }
  syncHud();
}

function showUrFanfare(item) {
  const fx = document.createElement('div');
  fx.className = 'ur-fanfare';
  const iconId = `ico-${item.type}`;
  fx.innerHTML = `
    <div class="ur-rays"></div>
    <div class="ur-banner">★ UR ★</div>
    <svg class="ur-icon"><use href="#${iconId}"/></svg>
    <div class="ur-name">${item.name}</div>
    <div class="ur-plus">+${item.plus}</div>
    <div class="ur-sparks">${Array.from({length: 18}, (_, i) => `<span class="ur-spark s${i}"></span>`).join('')}</div>
  `;
  document.body.appendChild(fx);
  sound.special();
  setTimeout(() => sound.victory(), 200);
  setTimeout(() => fx.classList.add('fade-out'), 1700);
  setTimeout(() => fx.remove(), 2200);
}

function onVictory() {
  state.scene = 'victory';
  sound.victory();
  showOverlay('VICTORY', '全ステージクリア！', 'victory');
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
// HUD SYNC (HTML)
// ============================================================
function syncHud() {
  const k = state.knight;
  if (!k) return;
  // HP
  const hpFill = document.getElementById('hp-fill');
  if (hpFill) hpFill.style.width = `${(k.hp / k.maxHp) * 100}%`;
  const hpNum = document.getElementById('hp-num');
  const hpMax = document.getElementById('hp-max');
  if (hpNum) hpNum.textContent = Math.ceil(k.hp);
  if (hpMax) hpMax.textContent = k.maxHp;
  // Level (battle HUD pill)
  const lvNum = document.getElementById('lv-num');
  if (lvNum) lvNum.textContent = state.level;

  // AP segments
  const segContainer = document.getElementById('ap-segments');
  if (segContainer && segContainer.children.length !== k.maxAp) {
    segContainer.innerHTML = '';
    for (let i = 0; i < k.maxAp; i++) {
      const seg = document.createElement('div');
      seg.className = 'ap-seg';
      const fill = document.createElement('div');
      fill.className = 'ap-seg-fill';
      seg.appendChild(fill);
      segContainer.appendChild(seg);
    }
  }
  for (let i = 0; i < k.maxAp; i++) {
    const fill = segContainer.children[i].firstChild;
    const v = Math.max(0, Math.min(1, k.ap - i));
    fill.style.width = `${v * 100}%`;
  }

  // Current move buttons (row 2)
  for (const wKey of ['sword', 'spear', 'hammer']) {
    const btn = document.querySelector(`.current-btn[data-weapon="${wKey}"]`);
    const move = getCurrentMove(wKey);
    if (btn) {
      const apEl = btn.querySelector('.ap-cost');
      const nameEl = btn.querySelector('.cell-name');
      if (apEl) apEl.textContent = move.ap;
      if (nameEl) nameEl.textContent = move.name;
      btn.disabled = k.ap < move.ap;
    }
    // NEXT preview cell (row 3)
    const next = getNextMove(wKey);
    const nextCell = document.querySelector(`.next-cell[data-weapon="${wKey}"]`);
    if (nextCell) {
      const apEl = nextCell.querySelector('.next-ap');
      const nameEl = nextCell.querySelector('.next-name');
      if (apEl) apEl.textContent = next.ap;
      if (nameEl) nameEl.textContent = next.name;
    }
  }

  // Round
  const rn = document.getElementById('round-num');
  if (rn) {
    const stage = STAGES[state.stageIdx];
    rn.textContent = `${state.roundIdx + 1}/${stage.rounds.length}`;
  }

  // Equipment slots (rarity + plus) – read from equipped items
  for (const wKey of ITEM_TYPES) {
    const slot = document.querySelector(`.eq-slot[data-slot="${wKey}"]`);
    if (!slot) continue;
    const item = getEquippedItem(wKey);
    const rarity = item ? item.rarity : 'common';
    const plus = item ? item.plus : 0;
    slot.classList.remove('rarity-common', 'rarity-r', 'rarity-sr', 'rarity-ur');
    slot.classList.add(`rarity-${rarity}`);
    const plusEl = slot.querySelector('.eq-plus');
    if (plusEl) plusEl.textContent = `+${plus}`;
  }

  // Meat count
  const mc = document.getElementById('meat-count');
  if (mc) mc.textContent = `×${state.meatCount}`;
  const meatBtn = document.getElementById('meat');
  if (meatBtn) meatBtn.disabled = state.meatCount <= 0;
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
  if (state.dropFxTimer > 0) {
    state.dropFxTimer -= dt;
    if (state.dropFxTimer <= 0) state.dropFx = null;
  }
  if (state.hitComboTimer > 0) {
    state.hitComboTimer -= dt;
    if (state.hitComboTimer <= 0) state.hitCombo = 0;
  }
  if (state.showRoundText > 0) state.showRoundText -= dt;
  if (state.roundTransition > 0) state.roundTransition -= dt;

  for (const f of state.floatTexts) {
    f.ttl -= dt;
    f.y -= 28 * dt;
  }
  state.floatTexts = state.floatTexts.filter(f => f.ttl > 0);

  for (const c of state.clouds) {
    c.x -= c.speed * dt;
    if (c.x < -40) {
      c.x = W + 40;
      c.y = 30 + Math.random() * 80;
    }
  }

  if (state.scene !== 'battle' || state.paused) return;
  const k = state.knight;
  if (k.hitTimer > 0) k.hitTimer -= dt;
  if (k.attackAnim > 0) {
    k.attackAnim -= dt;
    if (k.attackAnim <= 0) k.attackWeapon = null;
  }
  if (k.ap < k.maxAp) {
    const apRegenBonus = getEffect('spear', 'apRegenBonus');
    k.ap = Math.min(k.maxAp, k.ap + k.apRegen * (1 + apRegenBonus) * dt);
  }

  for (const e of state.enemies) {
    if (e.hp <= 0) continue;
    if (e.hitTimer > 0) e.hitTimer -= dt;
    e.bob += dt;
    if (e.stunned) {
      e.stunTimer -= dt;
      if (e.stunTimer <= 0) {
        e.stunned = false;
        e.pp = 0;
        rollEnemyAttack(e);
      }
    } else {
      e.attackTimer -= dt;
      if (e.attackTimer <= 0) onEnemyAttackLand(e);
    }
  }

  // Pet auto-attack
  if (state.pet) {
    if (state.pet.attackAnim > 0) state.pet.attackAnim -= dt;
    state.pet.timer -= dt;
    if (state.pet.timer <= 0) {
      const cd = (PET_TYPES[state.pet.type] || PET_TYPES.fairy).cooldown;
      state.pet.timer = cd;
      petAttack();
    }
  }

  // Golden dragon flyover
  if (state.goldenDragon) {
    const gd = state.goldenDragon;
    gd.x += gd.vx * dt;
    gd.bob += dt * 4;
    if (gd.hitTimer > 0) gd.hitTimer -= dt;
    if (gd.x > W + 60) state.goldenDragon = null;
  }

  syncHud();
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

  if (state.goldenDragon) drawGoldenDragon();

  if (state.flashTimer > 0) {
    ctx.fillStyle = `rgba(255,255,255,${state.flashTimer * 0.4})`;
    ctx.fillRect(0, 0, W, H);
  }

  drawKnight(state.knight);
  drawPet();

  // Sort enemies by y for depth
  const sorted = state.enemies.slice().sort((a, b) => a.y - b.y);
  for (const e of sorted) drawEnemy(e);

  drawAttackIndicators();
  drawTargetReticle();

  if (state.specialFx) drawSpecialFx();

  drawHitCombo();
  drawRoundText();
  drawComboBar();

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
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#ffd066';
    ctx.strokeText(state.weakHint, W / 2, 70);
    ctx.fillText(state.weakHint, W / 2, 70);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawBackground() {
  const horizonY = H * 0.5;

  // Sky gradient (top half)
  const g = ctx.createLinearGradient(0, 0, 0, horizonY);
  g.addColorStop(0, '#5a8acc');
  g.addColorStop(0.6, '#a4c8e8');
  g.addColorStop(1, '#e8d8e8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, horizonY);

  // Distant clouds
  for (const c of state.clouds) {
    if (c.y > horizonY - 10) continue;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    drawPixelCloud(c.x, c.y, c.size);
  }

  // Mountains at horizon
  ctx.fillStyle = '#7090b8';
  for (let i = 0; i < 6; i++) {
    const mx = i * 90 - 30;
    ctx.beginPath();
    ctx.moveTo(mx, horizonY);
    ctx.lineTo(mx + 50, horizonY - 50);
    ctx.lineTo(mx + 100, horizonY);
    ctx.closePath();
    ctx.fill();
  }
  // Snow caps
  ctx.fillStyle = '#dbe8f4';
  for (let i = 0; i < 6; i++) {
    const mx = i * 90 - 30;
    ctx.beginPath();
    ctx.moveTo(mx + 38, horizonY - 38);
    ctx.lineTo(mx + 50, horizonY - 50);
    ctx.lineTo(mx + 62, horizonY - 38);
    ctx.closePath();
    ctx.fill();
  }

  // Ground (lower half - more action area)
  const gg = ctx.createLinearGradient(0, horizonY, 0, H);
  gg.addColorStop(0, '#3a8a5a');
  gg.addColorStop(1, '#1a4a2a');
  ctx.fillStyle = gg;
  ctx.fillRect(0, horizonY, W, H);

  // Grass tufts at horizon line
  ctx.fillStyle = '#4a9a6a';
  for (let i = 0; i < W; i += 14) {
    const h = ((i * 37) % 11) + 4;
    ctx.fillRect(i, horizonY, 6, h);
  }

  // Wide path covering most of the lower area
  ctx.fillStyle = '#a08858';
  ctx.beginPath();
  ctx.moveTo(W * 0.12, horizonY);
  ctx.lineTo(W * 0.88, horizonY);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#806838';
  for (let i = 0; i < 20; i++) {
    const x = (i * 24 + state.time * 4) % W;
    ctx.fillRect(x, horizonY + 30 + (i % 3) * 6, 4, 2);
  }
}

function drawPixelCloud(x, y, s) {
  const u = Math.max(2, Math.round(s / 6));
  ctx.fillRect(Math.round(x), Math.round(y - u), s, u);
  ctx.fillRect(Math.round(x - u), Math.round(y), s + u * 2, u);
  ctx.fillRect(Math.round(x), Math.round(y + u), s, u);
}

function px(x, y, c, w = 4, h = 4) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

// Sprite-string drawing helper
function drawSprite(rows, palette, ox, oy, scale = 3, flash = false) {
  for (let py = 0; py < rows.length; py++) {
    const row = rows[py];
    for (let pxi = 0; pxi < row.length; pxi++) {
      const c = row[pxi];
      if (c === '.' || c === ' ') continue;
      const color = flash ? '#ffffff' : (palette[c] || '#f0f');
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(ox + pxi * scale), Math.round(oy + py * scale), scale, scale);
    }
  }
}

const KNIGHT_PAL = {
  H: '#ffe060',  // hair light
  h: '#d49b1c',  // hair shadow
  S: '#ffe1bc',  // skin
  s: '#d4a482',  // skin shadow
  E: '#1a1a1a',  // eye
  m: '#202028',  // outline / dark
  C: '#c83030',  // cape red
  c: '#7a1a1a',  // cape dark
  B: '#3068b8',  // tunic blue
  b: '#1a3a78',  // tunic dark
  G: '#ffd066',  // gold trim
  L: '#704020',  // leather
  l: '#3a2010',  // leather dark
  K: '#202830',  // boots
  W: '#f0f0f0',  // white highlights
  P: '#fef9d8',  // pale highlight
};

const KNIGHT_IDLE = [
  '....hHHh....',
  '...HHHHHh...',
  '..HHHHHHHh..',
  '.hHHHHHHHHh.',
  '.hHHsSSSHHh.',
  '..hSEsSEsh..',
  '..sSSSSSSs..',
  '...sSSSSs...',
  '....sssss...',
  '...CmCCCmC..',
  '..CcmBBBmcC.',
  '.CcmBBGBBmcC',
  '.CcmBBGBBmcC',
  '.CcmBBBBBmcC',
  '..mLLLLLLm..',
  '..mLLGGLLm..',
  '..mLLLLLLm..',
  '...BBb.bBB..',
  '...BBb.bBB..',
  '...BBb.bBB..',
  '...KKm.mKK..',
  '...KKm.mKK..',
];

const KNIGHT_ATTACK = [
  '....hHHh....',
  '...HHHHHh...',
  '..HHHHHHHh..',
  '.hHHHHHHHHh.',
  '.hHHsSSSHHh.',
  '..hSESEEsh..',
  '..sSSSSSSs..',
  '...sssMMs...',
  '....ssMMM...',
  '...CmCCCmC..',
  '..CcmBBBmcC.',
  '.CcmBBGBBmcC',
  '.CcmBBGBBmcC',
  '..mBBBBBBm..',
  '..mLLLLLLm..',
  '..mLLGGLLm..',
  '..mLLLLLLm..',
  '..BBb..bBB..',
  '..BBb..bBB..',
  '..BBb..bBB..',
  '..KKm..mKK..',
  '..KKm..mKK..',
];

function drawKnight(k) {
  const flash = k.hitTimer > 0 && Math.floor(k.hitTimer * 20) % 2 === 0;
  const guardUp = state.time < state.shieldUntil;

  // Per-weapon lunge
  let lungeX = 0, lungeY = 0, atkPhase = 0;
  if (k.attackAnim > 0) {
    const dur = k.attackWeapon === 'hammer' ? 0.45 : 0.32;
    atkPhase = 1 - k.attackAnim / dur;
    if (k.attackWeapon === 'sword') {
      lungeX = Math.sin(atkPhase * Math.PI) * 16;
    } else if (k.attackWeapon === 'spear') {
      lungeX = Math.sin(atkPhase * Math.PI) * 26;
    } else if (k.attackWeapon === 'hammer') {
      lungeX = atkPhase < 0.5 ? -atkPhase * 14 : (atkPhase - 0.5) * 30;
      lungeY = atkPhase < 0.5 ? -atkPhase * 6 : 0;
    }
  }

  const idleBob = Math.sin(state.time * 2.5) * 1;
  const x = k.x + lungeX;
  const y = k.y + idleBob + lungeY;
  const scale = 3;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y + 36, 26, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sprite (12x22 grid at scale 3 → 36x66 px). Anchor: x=center, y=feet
  const sprite = (k.attackAnim > 0) ? KNIGHT_ATTACK : KNIGHT_IDLE;
  const sw = 12 * scale;  // 36
  const sh = 22 * scale;  // 66
  drawSprite(sprite, KNIGHT_PAL, x - sw / 2, y - sh + 4, scale, flash);

  // Shield held up when guarding
  if (guardUp) {
    const sy = y - 30 + Math.sin(state.time * 30) * 1;
    // Pixel shield on left
    px(x - 26, sy - 12, '#4a90e0', 14, 32);
    px(x - 24, sy - 8, '#80c0ff', 10, 24);
    px(x - 22, sy - 4, '#ffd700', 6, 6);
    ctx.strokeStyle = `rgba(180,220,255,${0.4 + Math.random() * 0.3})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x - 19, sy + 2, 24, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Sword in hand on right side (idle)
    px(x + 18, y - 50, '#c8cfd6', 4, 30);
    px(x + 19, y - 50, '#fff', 2, 30);
    px(x + 14, y - 22, '#7a8088', 12, 4);
    px(x + 18, y - 16, '#704020', 4, 8);
    px(x + 16, y - 10, '#ffd066', 8, 4);
  }

  // Per-weapon slash effect
  if (k.attackAnim > 0 && k.attackWeapon) {
    drawAttackEffect(x, y, k.attackWeapon, atkPhase);
  }
}

function drawAttackEffect(x, y, weapon, phase) {
  const fadeIn = Math.min(1, phase * 4);
  const fadeOut = Math.max(0, (1 - phase) * 1.6);
  const alpha = Math.min(fadeIn, fadeOut, 1);
  ctx.save();
  ctx.globalAlpha = alpha;

  if (weapon === 'sword') {
    // Slashing arc (downward swing, in front of knight)
    const sweepStart = -Math.PI / 2.4;
    const sweep = Math.PI * 0.85;
    const a0 = sweepStart;
    const a1 = sweepStart + sweep * Math.min(1, phase * 1.6);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x + 26, y - 4, 28, a0, a1);
    ctx.stroke();
    ctx.strokeStyle = '#7be0ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + 26, y - 4, 33, a0, a1);
    ctx.stroke();
    // Sparks at the tip
    for (let i = 0; i < 4; i++) {
      const r = 28 + Math.random() * 8;
      const ang = a1 - Math.random() * 0.4;
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 26 + Math.cos(ang) * r - 2, y - 4 + Math.sin(ang) * r - 2, 4, 4);
    }
  } else if (weapon === 'spear') {
    // Forward thrust line
    const dist = phase * 70;
    ctx.fillStyle = '#ffd066';
    ctx.fillRect(x + 18, y - 6, dist, 4);
    // Tip
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 18 + dist - 4, y - 9, 8, 10);
    // Wind trail
    for (let i = 0; i < 4; i++) {
      ctx.globalAlpha = alpha * (0.45 - i * 0.1);
      ctx.fillStyle = '#ffe080';
      ctx.fillRect(x + 18 + dist - i * 10 - 4, y - 4, 4, 2);
      ctx.fillRect(x + 18 + dist - i * 10 - 4, y, 4, 2);
    }
    ctx.globalAlpha = alpha;
  } else if (weapon === 'hammer') {
    if (phase < 0.5) {
      // Wind-up: hammer arcing overhead from back to front
      const swing = phase * 2;
      const ang = -Math.PI * 0.9 + swing * Math.PI * 0.95;
      const hx = x + 14 + Math.cos(ang) * 36;
      const hy = y - 8 + Math.sin(ang) * 36;
      ctx.fillStyle = '#cc8855';
      ctx.fillRect(hx - 8, hy - 8, 16, 12);
      ctx.fillStyle = '#a06030';
      ctx.fillRect(hx - 8, hy + 2, 16, 2);
      // Trail arc
      ctx.strokeStyle = 'rgba(255,200,140,0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + 14, y - 8, 36, -Math.PI * 0.9, ang);
      ctx.stroke();
    } else {
      const sp = (phase - 0.5) * 2;
      // Hammer slammed down in front of knight
      ctx.fillStyle = '#cc8855';
      ctx.fillRect(x + 22, y, 18, 14);
      ctx.fillStyle = '#a06030';
      ctx.fillRect(x + 22, y + 12, 18, 2);
      // Shockwave rings
      for (let i = 0; i < 3; i++) {
        const r = sp * 60 + i * 10;
        const ringAlpha = alpha * Math.max(0, 1 - sp - i * 0.25);
        if (ringAlpha <= 0) continue;
        ctx.globalAlpha = ringAlpha;
        ctx.strokeStyle = '#ffd066';
        ctx.lineWidth = 4 - i;
        ctx.beginPath();
        ctx.ellipse(x + 30, y + 14, r, r * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Dust kicks
      ctx.globalAlpha = alpha * (1 - sp);
      ctx.fillStyle = '#a08858';
      for (let i = 0; i < 6; i++) {
        const a2 = i * Math.PI * 2 / 6 + phase * 8;
        const r = sp * 30;
        ctx.fillRect(x + 30 + Math.cos(a2) * r - 2, y + 14 + Math.abs(Math.sin(a2)) * 4 - 2, 4, 4);
      }
    }
  }
  ctx.restore();
}

function drawEnemy(e) {
  if (e.hp <= 0) return;
  const flash = e.hitTimer > 0 && Math.floor(e.hitTimer * 20) % 2 === 0;
  const bobY = Math.sin(e.bob * 2) * 3;
  const x = e.x;
  const y = e.y + bobY;
  const s = e.size;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const cx = 0, cy = 0;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 30, 26, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  const c = flash ? '#fff' : e.color;
  const a = flash ? '#fff' : e.accent;

  switch (e.type) {
    case 'ghost': drawGhost(cx, cy, c); break;
    case 'slime': drawSlime(cx, cy, c, a); break;
    case 'boarRed':
    case 'boarBlue': drawBoar(cx, cy, c, a, e.type === 'boarBlue'); break;
    case 'fabit': drawFabit(cx, cy, c, a); break;
    case 'mushroom': drawMushroom(cx, cy, c, a); break;
    case 'mermaid': drawMermaid(cx, cy, c, a); break;
    case 'turtle': drawTurtle(cx, cy, c, a); break;
    case 'dragon': drawDragon(cx, cy, c, a); break;
    case 'kingDrag': drawDragon(cx, cy, c, a); break;
    case 'golem': drawGolem(cx, cy, c, a); break;
    case 'rockGolem': drawGolem(cx, cy, c, a); break;
  }

  if (e.stunned) {
    const angle = state.time * 6;
    for (let i = 0; i < 3; i++) {
      const a2 = angle + i * (Math.PI * 2 / 3);
      const sx = Math.cos(a2) * 22;
      const sy = -42 + Math.sin(a2) * 5;
      ctx.fillStyle = '#ffeb3b';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★', sx, sy);
    }
  }

  ctx.restore();

  // HP bar above enemy
  drawEnemyHpBar(e);
}

function drawEnemyHpBar(e) {
  const w = 50, h = 4;
  const x = e.x - w / 2;
  const y = e.y - 50;
  ctx.fillStyle = '#000';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#400';
  ctx.fillRect(x, y, w, h);
  const pct = Math.max(0, e.hp / e.maxHp);
  ctx.fillStyle = pct > 0.5 ? '#5dd64a' : pct > 0.25 ? '#ffb300' : '#f44336';
  ctx.fillRect(x, y, w * pct, h);

  // PP bar
  const ppY = y + h + 1;
  ctx.fillStyle = '#000';
  ctx.fillRect(x - 1, ppY - 1, w + 2, 3);
  ctx.fillStyle = '#222';
  ctx.fillRect(x, ppY, w, 2);
  ctx.fillStyle = e.stunned ? '#ffeb3b' : '#ff8040';
  ctx.fillRect(x, ppY, w * (e.pp / e.maxPp), 2);
}

function drawGhost(cx, cy, c) {
  ctx.globalAlpha = 0.85;
  px(cx - 18, cy - 32, c, 36, 28);
  px(cx - 22, cy - 24, c, 44, 20);
  px(cx - 18, cy - 4, c, 36, 18);
  for (let i = 0; i < 4; i++) {
    px(cx - 18 + i * 10, cy + 14 + Math.sin(state.time * 4 + i) * 3, c, 8, 8);
  }
  ctx.globalAlpha = 1;
  px(cx - 10, cy - 22, '#000', 5, 6);
  px(cx + 5, cy - 22, '#000', 5, 6);
  px(cx - 7, cy - 10, '#000', 14, 3);
}

function drawSlime(cx, cy, c, a) {
  ctx.globalAlpha = 0.9;
  px(cx - 16, cy - 8, c, 32, 28);
  px(cx - 20, cy + 4, c, 40, 16);
  px(cx - 12, cy - 16, c, 24, 12);
  ctx.globalAlpha = 1;
  px(cx - 8, cy - 8, '#fff', 4, 4);
  px(cx + 4, cy - 8, '#fff', 4, 4);
  px(cx - 7, cy - 7, '#000', 2, 2);
  px(cx + 5, cy - 7, '#000', 2, 2);
  px(cx - 4, cy + 2, '#000', 8, 2);
  px(cx - 8, cy - 14, a, 4, 3);
}

function drawBoar(cx, cy, body, accent, isBlue) {
  // Body (round, stocky)
  px(cx - 20, cy - 14, body, 40, 28);
  px(cx - 24, cy - 8, body, 48, 18);
  // Belly
  px(cx - 18, cy + 6, accent, 36, 8);
  // Head
  px(cx + 14, cy - 18, body, 18, 24);
  px(cx + 18, cy - 22, body, 14, 8);
  // Snout
  px(cx + 28, cy - 6, accent, 8, 10);
  px(cx + 30, cy - 2, '#000', 2, 2);
  px(cx + 32, cy - 2, '#000', 2, 2);
  // Eye
  px(cx + 22, cy - 14, '#fff', 4, 4);
  px(cx + 23, cy - 13, '#000', 2, 2);
  // Tusks
  px(cx + 26, cy + 2, '#fff', 3, 4);
  // Ears
  px(cx + 16, cy - 24, body, 6, 6);
  // Legs
  px(cx - 14, cy + 14, body, 6, 12);
  px(cx + 6, cy + 14, body, 6, 12);
  px(cx - 14, cy + 22, '#3a2818', 6, 4);
  px(cx + 6, cy + 22, '#3a2818', 6, 4);
  // Tail
  px(cx - 22, cy - 8, body, 4, 6);
  // Mane stripe
  if (isBlue) {
    px(cx - 14, cy - 18, accent, 30, 4);
  } else {
    px(cx - 12, cy - 18, accent, 28, 4);
  }
}

function drawFabit(cx, cy, c, a) {
  // Body (round bunny)
  px(cx - 14, cy - 10, c, 28, 22);
  px(cx - 18, cy - 4, c, 36, 12);
  // Head
  px(cx - 12, cy - 22, c, 24, 14);
  // Ears
  px(cx - 10, cy - 36, c, 6, 18);
  px(cx + 4, cy - 36, c, 6, 18);
  px(cx - 9, cy - 34, '#f88', 4, 12);
  px(cx + 5, cy - 34, '#f88', 4, 12);
  // Eyes
  px(cx - 6, cy - 18, '#000', 3, 4);
  px(cx + 3, cy - 18, '#000', 3, 4);
  // Nose
  px(cx - 1, cy - 12, '#f44', 2, 2);
  // Belly
  px(cx - 8, cy - 4, a, 16, 10);
  // Legs
  px(cx - 14, cy + 10, c, 8, 8);
  px(cx + 6, cy + 10, c, 8, 8);
  // Tail
  px(cx - 20, cy - 4, '#fff', 4, 6);
}

function drawMushroom(cx, cy, c, a) {
  // Cap
  px(cx - 16, cy - 22, c, 32, 12);
  px(cx - 20, cy - 18, c, 40, 12);
  px(cx - 22, cy - 12, c, 44, 6);
  // White spots on cap
  px(cx - 12, cy - 18, '#fff', 4, 4);
  px(cx + 0, cy - 16, '#fff', 4, 4);
  px(cx + 10, cy - 14, '#fff', 4, 4);
  px(cx - 6, cy - 22, '#fff', 4, 4);
  // Stem
  px(cx - 10, cy - 6, a, 20, 18);
  px(cx - 8, cy - 6, '#fff', 16, 16);
  // Eyes
  px(cx - 4, cy + 2, '#000', 3, 4);
  px(cx + 1, cy + 2, '#000', 3, 4);
  // Smile
  px(cx - 3, cy + 8, '#000', 6, 2);
  // Roots
  px(cx - 10, cy + 14, a, 8, 4);
  px(cx + 2, cy + 14, a, 8, 4);
}

function drawMermaid(cx, cy, c, a) {
  // Hair (warm/peach)
  px(cx - 12, cy - 32, a, 24, 10);
  px(cx - 14, cy - 28, a, 28, 10);
  // Head
  px(cx - 8, cy - 24, '#ffd9b3', 16, 14);
  px(cx - 4, cy - 20, '#000', 3, 3);
  px(cx + 1, cy - 20, '#000', 3, 3);
  px(cx - 2, cy - 14, '#c34', 4, 2);
  // Top
  px(cx - 10, cy - 10, c, 20, 6);
  px(cx - 12, cy - 8, c, 24, 8);
  // Tail (fish)
  px(cx - 10, cy + 0, c, 20, 14);
  px(cx - 14, cy + 4, c, 28, 10);
  // Tail fin
  px(cx - 18, cy + 14, c, 14, 6);
  px(cx + 4, cy + 14, c, 14, 6);
  px(cx - 22, cy + 18, c, 10, 4);
  px(cx + 12, cy + 18, c, 10, 4);
  // Scales detail
  px(cx - 6, cy + 4, '#fff', 2, 2);
  px(cx + 4, cy + 4, '#fff', 2, 2);
  px(cx - 2, cy + 10, '#fff', 2, 2);
}

function drawTurtle(cx, cy, c, a) {
  // Shell (bottom layer)
  px(cx - 22, cy - 12, a, 44, 28);
  px(cx - 26, cy - 4, a, 52, 16);
  // Shell pattern
  px(cx - 18, cy - 8, c, 36, 18);
  px(cx - 14, cy - 4, c, 28, 10);
  // Hex segments
  px(cx - 10, cy - 6, '#3a5818', 4, 4);
  px(cx - 2, cy - 6, '#3a5818', 4, 4);
  px(cx + 6, cy - 6, '#3a5818', 4, 4);
  px(cx - 6, cy + 0, '#3a5818', 4, 4);
  px(cx + 2, cy + 0, '#3a5818', 4, 4);
  // Head
  px(cx + 18, cy - 4, c, 12, 12);
  px(cx + 26, cy - 2, c, 6, 8);
  // Eye
  px(cx + 28, cy + 0, '#000', 2, 2);
  // Legs
  px(cx - 18, cy + 14, c, 8, 6);
  px(cx + 10, cy + 14, c, 8, 6);
  // Tail
  px(cx - 26, cy - 2, c, 4, 6);
}

function drawGoldenDragon() {
  const gd = state.goldenDragon;
  if (!gd) return;
  const x = gd.x;
  const y = gd.y + Math.sin(gd.bob) * 5;
  const flash = gd.hitTimer > 0 && Math.floor(gd.hitTimer * 20) % 2 === 0;
  // Sparkles trail
  for (let i = 0; i < 6; i++) {
    const t = state.time * 6 + i;
    const sx = x - 30 - i * 5 + Math.sin(t) * 4;
    const sy = y + Math.cos(t) * 6;
    ctx.fillStyle = `rgba(255, 230, 100, ${0.3 + 0.6 / (i + 1)})`;
    ctx.fillRect(sx - 1, sy - 1, 2, 2);
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.5, 0.5);
  drawDragon(0, 0, flash ? '#fff' : '#ffd066', flash ? '#fff' : '#fff8c0');
  ctx.restore();
  // HP bar above
  const w = 36, h = 4;
  ctx.fillStyle = '#000';
  ctx.fillRect(x - w / 2 - 1, y - 28, w + 2, h + 2);
  ctx.fillStyle = '#222';
  ctx.fillRect(x - w / 2, y - 27, w, h);
  ctx.fillStyle = '#ffd066';
  ctx.fillRect(x - w / 2, y - 27, w * Math.max(0, gd.hp / gd.maxHp), h);
  // Glow ring
  ctx.strokeStyle = `rgba(255, 220, 80, ${0.4 + Math.sin(state.time * 8) * 0.3})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPet() {
  if (!state.pet || !state.knight) return;
  const k = state.knight;
  const t = state.time;
  const baseX = k.x + 32;
  const baseY = k.y - 76;
  let x = baseX, y = baseY;
  const aa = state.pet.attackAnim || 0;
  if (aa > 0) {
    const phase = 1 - aa / 0.5;
    const lerp = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
    x = baseX + (state.pet.targetX - baseX) * lerp;
    y = baseY + (state.pet.targetY - baseY) * lerp;
  } else {
    x += Math.sin(t * 2) * 5;
    y += Math.cos(t * 3) * 4;
  }
  // Sparkle trail
  for (let i = 0; i < 4; i++) {
    const sa = t * 4 + i * 0.6;
    ctx.fillStyle = `rgba(255, 200, 220, ${0.3 + 0.5 / (i + 1)})`;
    ctx.fillRect(x + Math.cos(sa) * 8 - 1, y + Math.sin(sa) * 6 - 1, 2, 2);
  }
  // Wings (flap)
  const wing = 6 + Math.sin(t * 24) * 3;
  ctx.fillStyle = 'rgba(180, 240, 255, 0.7)';
  ctx.fillRect(Math.round(x - 12), Math.round(y - 2), wing, 4);
  ctx.fillRect(Math.round(x + 6),  Math.round(y - 2), wing, 4);
  // Body (small fairy)
  ctx.fillStyle = '#ff90c0';
  ctx.fillRect(Math.round(x - 6), Math.round(y - 6), 12, 12);
  ctx.fillStyle = '#ffe8c0';
  ctx.fillRect(Math.round(x - 4), Math.round(y - 4), 8, 8);
  ctx.fillStyle = '#000';
  ctx.fillRect(Math.round(x - 2), Math.round(y - 1), 1, 2);
  ctx.fillRect(Math.round(x + 1), Math.round(y - 1), 1, 2);
  // Hair tuft
  ctx.fillStyle = '#ffd066';
  ctx.fillRect(Math.round(x - 4), Math.round(y - 8), 8, 2);
}

function drawDragon(cx, cy, c, a) {
  const dark = shadeColor(c, -30);
  // Tail (curled)
  px(cx - 28, cy + 6, c, 6, 10);
  px(cx - 32, cy + 2, c, 6, 10);
  px(cx - 30, cy - 4, c, 4, 8);
  px(cx - 26, cy - 4, dark, 2, 8);
  // Wings (back)
  px(cx - 30, cy - 28, a, 22, 32);
  px(cx + 8, cy - 28, a, 22, 32);
  px(cx - 34, cy - 20, a, 8, 22);
  px(cx + 26, cy - 20, a, 8, 22);
  // Wing membrane lines
  px(cx - 26, cy - 24, dark, 2, 26);
  px(cx - 18, cy - 22, dark, 2, 22);
  px(cx + 18, cy - 22, dark, 2, 22);
  px(cx + 26, cy - 24, dark, 2, 26);
  // Body
  px(cx - 18, cy - 32, c, 36, 52);
  px(cx - 22, cy - 26, c, 44, 42);
  px(cx - 24, cy - 16, c, 48, 28);
  // Belly scales
  px(cx - 12, cy - 8, a, 24, 20);
  px(cx - 10, cy - 4, dark, 2, 16);
  px(cx - 4, cy - 4, dark, 2, 16);
  px(cx + 2, cy - 4, dark, 2, 16);
  px(cx + 8, cy - 4, dark, 2, 16);
  // Head
  px(cx - 12, cy - 48, c, 24, 18);
  px(cx - 16, cy - 44, c, 6, 14);
  px(cx + 10, cy - 44, c, 6, 14);
  px(cx + 14, cy - 38, c, 4, 8);
  // Horns
  px(cx - 10, cy - 56, c, 4, 8);
  px(cx + 6, cy - 56, c, 4, 8);
  px(cx - 9, cy - 60, dark, 2, 4);
  px(cx + 7, cy - 60, dark, 2, 4);
  // Crest spikes (back of head)
  px(cx - 4, cy - 56, c, 8, 4);
  px(cx - 2, cy - 60, c, 4, 4);
  // Eyes (glowing)
  px(cx - 8, cy - 40, '#fff', 4, 4);
  px(cx + 4, cy - 40, '#fff', 4, 4);
  px(cx - 7, cy - 39, '#fc0', 2, 2);
  px(cx + 5, cy - 39, '#fc0', 2, 2);
  px(cx - 7, cy - 38, '#a00', 2, 1);
  px(cx + 5, cy - 38, '#a00', 2, 1);
  // Snout / nostrils
  px(cx - 2, cy - 32, dark, 4, 2);
  px(cx - 4, cy - 28, '#600', 8, 4);
  // Fangs
  px(cx - 4, cy - 26, '#fff', 2, 3);
  px(cx + 2, cy - 26, '#fff', 2, 3);
  // Front arms with claws
  px(cx - 26, cy - 8, c, 8, 16);
  px(cx + 18, cy - 8, c, 8, 16);
  px(cx - 26, cy + 6, '#fff', 2, 4);
  px(cx - 22, cy + 6, '#fff', 2, 4);
  px(cx + 20, cy + 6, '#fff', 2, 4);
  px(cx + 24, cy + 6, '#fff', 2, 4);
  // Hind legs
  px(cx - 14, cy + 14, c, 12, 14);
  px(cx + 2, cy + 14, c, 12, 14);
  px(cx - 14, cy + 26, dark, 12, 4);
  px(cx + 2, cy + 26, dark, 12, 4);
}

function drawGolem(cx, cy, c, a) {
  const dark = shadeColor(c, -30);
  const light = shadeColor(c, 20);
  // Shoulders/upper body
  px(cx - 26, cy - 18, dark, 52, 6);
  px(cx - 22, cy - 14, c, 44, 36);
  // Body chest
  px(cx - 18, cy - 12, light, 36, 22);
  // Cracks across body
  px(cx - 14, cy - 6, dark, 28, 2);
  px(cx - 6, cy - 12, dark, 2, 12);
  px(cx + 4, cy - 4, dark, 2, 10);
  // Head (carved stone)
  px(cx - 16, cy - 40, c, 32, 24);
  px(cx - 14, cy - 38, light, 28, 4);
  px(cx - 18, cy - 36, c, 4, 16);
  px(cx + 14, cy - 36, c, 4, 16);
  // Glowing eye sockets
  px(cx - 10, cy - 30, dark, 6, 6);
  px(cx + 4, cy - 30, dark, 6, 6);
  px(cx - 9, cy - 29, '#ff4040', 4, 4);
  px(cx + 5, cy - 29, '#ff4040', 4, 4);
  px(cx - 8, cy - 28, '#ffff80', 2, 2);
  px(cx + 6, cy - 28, '#ffff80', 2, 2);
  // Mouth (teeth grin)
  px(cx - 8, cy - 20, dark, 16, 4);
  px(cx - 6, cy - 19, '#fff', 2, 2);
  px(cx - 2, cy - 19, '#fff', 2, 2);
  px(cx + 2, cy - 19, '#fff', 2, 2);
  // Massive arms
  px(cx - 32, cy - 14, c, 12, 32);
  px(cx + 20, cy - 14, c, 12, 32);
  px(cx - 32, cy + 14, dark, 12, 4);
  px(cx + 20, cy + 14, dark, 12, 4);
  // Knuckles/fingers
  px(cx - 32, cy + 18, light, 4, 6);
  px(cx - 26, cy + 18, light, 4, 6);
  px(cx + 22, cy + 18, light, 4, 6);
  px(cx + 28, cy + 18, light, 4, 6);
  // Legs
  px(cx - 14, cy + 22, c, 12, 14);
  px(cx + 2, cy + 22, c, 12, 14);
  px(cx - 16, cy + 32, dark, 14, 4);
  px(cx + 2, cy + 32, dark, 14, 4);
  // Glowing core in chest
  px(cx - 4, cy - 6, '#ff4040', 8, 6);
  px(cx - 2, cy - 4, '#ffff80', 4, 2);
}

function shadeColor(hex, amount) {
  // amount in [-100, 100], negative darker
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const adj = (n) => Math.max(0, Math.min(255, n + Math.round(amount * 2.55)));
  const r = adj(parseInt(m[1], 16));
  const g = adj(parseInt(m[2], 16));
  const b = adj(parseInt(m[3], 16));
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function drawAttackIndicators() {
  for (const e of state.enemies) {
    if (e.hp <= 0 || e.stunned) continue;
    const t = e.attackTimer;
    if (t > 1.5) continue;
    const x = e.x;
    const y = e.y - 70;

    // Red box with countdown
    const num = Math.ceil(t * 2);
    const boxW = 24, boxH = 24;
    ctx.fillStyle = '#000';
    ctx.fillRect(x - boxW / 2 - 1, y - boxH + 4, boxW + 2, boxH);
    ctx.fillStyle = t < 0.2 ? '#ff80ff' : t < 0.5 ? '#ffeb3b' : '#d22020';
    ctx.fillRect(x - boxW / 2, y - boxH + 5, boxW, boxH - 2);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(num.toString(), x, y - 7);
    ctx.textBaseline = 'alphabetic';

    if (t < 0.7) {
      const pulse = 1 + Math.sin(state.time * 30) * 0.15;
      ctx.save();
      ctx.translate(x, y - 35);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#ff3030';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000';
      ctx.strokeText('!!', 0, 0);
      ctx.fillText('!!', 0, 0);
      ctx.restore();
    }
  }
}

function drawTargetReticle() {
  const target = state.enemies[state.targetIdx];
  if (!target || target.hp <= 0) return;
  const x = target.x;
  const y = target.y + 35;
  ctx.strokeStyle = '#ffd066';
  ctx.lineWidth = 2;
  const r = 14 + Math.sin(state.time * 6) * 2;
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.lineTo(x - r + 4, y);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + r - 4, y);
  ctx.moveTo(x, y - r);
  ctx.lineTo(x, y - r + 4);
  ctx.moveTo(x, y + r);
  ctx.lineTo(x, y + r - 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawHitCombo() {
  if (state.hitCombo < 2 || state.hitComboTimer <= 0) return;
  const alpha = Math.min(1, state.hitComboTimer);
  // Punch-in scale on most recent hit
  const sinceHit = 1.5 - state.hitComboTimer;
  const punch = Math.max(0, 1 - sinceHit / 0.18);
  const scale = 1 + punch * 0.45;

  const cx = 24, cy = 165;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  // Yellow banner with arrow point on the right
  const W1 = 100, H1 = 36;
  const tip = 18;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(-3, -H1 / 2 - 3);
  ctx.lineTo(W1 + 3, -H1 / 2 - 3);
  ctx.lineTo(W1 + tip + 3, 0);
  ctx.lineTo(W1 + 3, H1 / 2 + 3);
  ctx.lineTo(-3, H1 / 2 + 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd066';
  ctx.beginPath();
  ctx.moveTo(0, -H1 / 2);
  ctx.lineTo(W1, -H1 / 2);
  ctx.lineTo(W1 + tip, 0);
  ctx.lineTo(W1, H1 / 2);
  ctx.lineTo(0, H1 / 2);
  ctx.closePath();
  ctx.fill();
  // Inner lighter band
  ctx.fillStyle = '#fff8a8';
  ctx.beginPath();
  ctx.moveTo(4, -H1 / 2 + 4);
  ctx.lineTo(W1 - 2, -H1 / 2 + 4);
  ctx.lineTo(W1 + tip - 8, 0);
  ctx.lineTo(W1 - 2, H1 / 2 - 4);
  ctx.lineTo(4, H1 / 2 - 4);
  ctx.closePath();
  ctx.fill();

  // Number (italic, big, red)
  ctx.font = 'italic 900 30px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#fff';
  const numStr = `${state.hitCombo}`;
  ctx.strokeText(numStr, 8, 1);
  ctx.fillStyle = '#d22020';
  ctx.fillText(numStr, 8, 1);
  // HIT!
  ctx.font = 'italic 900 18px sans-serif';
  const numW = ctx.measureText(numStr).width;
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff';
  ctx.strokeText('HIT!', 14 + numW, 2);
  ctx.fillStyle = '#3a2410';
  ctx.fillText('HIT!', 14 + numW, 2);

  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

function drawDropFx() {
  const fx = state.dropFx;
  if (!fx) return;
  const t = state.dropFxTimer;
  const phase = 1 - t / 2.4;
  const cx = W / 2;
  const cy = 200 - phase * 30;
  const alpha = t > 0.4 ? 1 : t / 0.4;
  ctx.save();
  ctx.globalAlpha = alpha;

  // Card frame
  const cardW = 240, cardH = 80;
  ctx.fillStyle = '#000';
  ctx.fillRect(cx - cardW / 2 - 3, cy - cardH / 2 - 3, cardW + 6, cardH + 6);
  ctx.fillStyle = fx.color;
  ctx.fillRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(cx - cardW / 2 + 3, cy - cardH / 2 + 3, cardW - 6, cardH - 6);

  // Sparkle ring
  for (let i = 0; i < 8; i++) {
    const ang = i * Math.PI / 4 + state.time * 4;
    const r = 60 + Math.sin(state.time * 8 + i) * 6;
    const sx = cx + Math.cos(ang) * r;
    const sy = cy + Math.sin(ang) * r;
    ctx.fillStyle = fx.color;
    ctx.fillRect(sx - 2, sy - 2, 4, 4);
  }

  // Title
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = fx.color;
  ctx.fillText('★ NEW EQUIPMENT ★', cx, cy - cardH / 2 + 18);

  // Body
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000';
  const text = `[${fx.label}] ${fx.weaponName} +${fx.plus}`;
  ctx.strokeText(text, cx, cy + 4);
  ctx.fillText(text, cx, cy + 4);

  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = '#ffe0a0';
  ctx.fillText('GET!', cx, cy + cardH / 2 - 8);

  ctx.restore();
}

function drawRoundText() {
  if (state.showRoundText <= 0) return;
  const a = Math.min(1, state.showRoundText);
  const stage = STAGES[state.stageIdx];
  ctx.globalAlpha = a;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.textAlign = 'center';
  const t1 = `${stage.name}`;
  const t2 = `ROUND ${state.roundIdx + 1}`;
  ctx.font = 'bold 16px sans-serif';
  ctx.strokeText(t1, W / 2, 100);
  ctx.fillText(t1, W / 2, 100);
  ctx.font = 'bold 28px sans-serif';
  ctx.strokeText(t2, W / 2, 140);
  ctx.fillText(t2, W / 2, 140);
  ctx.globalAlpha = 1;
}

function drawComboBar() {
  const preview = previewSpecial(state.weaponHistory);
  if (!preview) return;
  const text = `${WEAPONS[preview.needWeapon].name} で → ${preview.name}!`;
  const pulse = 0.85 + Math.sin(state.time * 8) * 0.15;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = preview.color;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000';
  ctx.strokeText(text, W / 2, H - 20);
  ctx.fillText(text, W / 2, H - 20);
  ctx.globalAlpha = 1;
}

function drawSpecialFx() {
  const fx = state.specialFx;
  const t = state.specialFxTimer;
  const phase = 1 - t / 1.4;
  ctx.save();
  const radial = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 400);
  radial.addColorStop(0, fx.color + 'cc');
  radial.addColorStop(0.4, fx.color + '40');
  radial.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = Math.min(1, t * 1.5) * 0.5;
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2 + state.time * 4;
    const r = 50 + phase * 250;
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

  for (const btn of document.querySelectorAll('.current-btn')) {
    btn.addEventListener('click', () => { ensureAudio(); attack(btn.dataset.weapon); });
  }
  document.getElementById('shield').addEventListener('click', () => { ensureAudio(); tryGuard(); });
  document.getElementById('meat').addEventListener('click', () => { ensureAudio(); useMeat(); });

  // Click on canvas to target enemy
  canvas.addEventListener('click', (ev) => {
    ensureAudio();
    if (state.scene !== 'battle' || state.paused) return;
    const rect = canvas.getBoundingClientRect();
    const sx = (ev.clientX - rect.left) * (canvas.width / rect.width);
    const sy = (ev.clientY - rect.top) * (canvas.height / rect.height);
    // Try golden dragon first (high priority bonus target)
    if (tryHitGoldenDragon(sx, sy)) return;
    let closest = -1, dmin = 60;
    for (let i = 0; i < state.enemies.length; i++) {
      const e = state.enemies[i];
      if (e.hp <= 0) continue;
      const d = Math.hypot(sx - e.x, sy - e.y);
      if (d < dmin) { dmin = d; closest = i; }
    }
    if (closest >= 0) state.targetIdx = closest;
  });

  document.getElementById('restart').addEventListener('click', (ev) => {
    ev.stopPropagation();
    hideOverlay();
    state.chests = [];
    renderChestStack();
    showMainMenu();
  });

  // Tap anywhere on pause overlay to resume (button still works)
  document.getElementById('overlay').addEventListener('click', (ev) => {
    if (state.scene === 'battle' && state.paused) {
      if (ev.target.id === 'restart' || ev.target.closest('#restart')) return;
      togglePause();
    }
  });

  document.getElementById('result-next').addEventListener('click', () => {
    state.chests = [];
    renderChestStack();
    showMainMenu();
  });

  // Stage-select back
  const stageBack = document.getElementById('stage-back');
  if (stageBack) stageBack.addEventListener('click', () => { ensureAudio(); showMainMenu(); });

  // Equipment-screen back
  const equipBack = document.getElementById('equipment-back');
  if (equipBack) equipBack.addEventListener('click', () => { ensureAudio(); showMainMenu(); });

  // Shop back
  const shopBack = document.getElementById('shop-back');
  if (shopBack) shopBack.addEventListener('click', () => { ensureAudio(); showMainMenu(); });

  // Main menu icons
  const handleMenu = (btn) => {
    try {
      ensureAudio();
      if (btn.classList.contains('locked')) {
        showLockToast();
        return;
      }
      const which = btn.dataset.menu;
      if (which === 'oshigoto') showStageSelect();
      else if (which === 'souvi') showEquipmentScreen();
      else if (which === 'shop') showShopScreen();
    } catch (err) {
      console.error('menu click failed', err);
    }
  };
  for (const btn of document.querySelectorAll('.menu-btn')) {
    btn.addEventListener('click', () => handleMenu(btn));
  }

  const btnPause = document.getElementById('btn-pause');
  btnPause.addEventListener('click', () => { ensureAudio(); togglePause(); });

  const btnSe = document.getElementById('btn-se');
  const btnBgm = document.getElementById('btn-bgm');
  btnSe.addEventListener('click', () => {
    ensureAudio();
    const on = sound.toggleSe();
    btnSe.classList.toggle('off', !on);
    btnSe.textContent = on ? '🔊' : '🔇';
  });
  btnBgm.addEventListener('click', () => {
    ensureAudio();
    const on = sound.toggleBgm();
    btnBgm.classList.toggle('off', !on);
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
    else if (ev.code === 'KeyM') useMeat();
    else if (ev.code === 'KeyP' || ev.code === 'Escape') togglePause();
    else if (ev.code === 'KeyT' || ev.code === 'Tab') { ev.preventDefault(); cycleTarget(); }
  });
}

function updateVhVariable() {
  document.documentElement.style.setProperty('--vh', window.innerHeight + 'px');
}
updateVhVariable();
window.addEventListener('resize', updateVhVariable);
window.addEventListener('orientationchange', updateVhVariable);

injectWeaponIcons();
resetState();
bindUi();
requestAnimationFrame(loop);

})();
