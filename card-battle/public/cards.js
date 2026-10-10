// カードデータ（サーバー・クライアント共通）
// type: unit | spell
// kw: taunt(守護) rush(速攻) shield(聖盾) drain(吸収)
// target: enemy(敵ユニットか敵ヒーロー) enemyUnit(敵ユニット) ally(味方ユニット)
// fx: 効果リスト（ユニットは召喚時、スペルは使用時に発動）
export const CARDS = [
  // ---- N ----
  { id: 'slime',    name: 'スライム',     emoji: '🟢', rarity: 'N', type: 'unit', cost: 1, atk: 1, hp: 3 },
  { id: 'goblin',   name: 'ゴブリン',     emoji: '👺', rarity: 'N', type: 'unit', cost: 1, atk: 2, hp: 1 },
  { id: 'bat',      name: 'コウモリ',     emoji: '🦇', rarity: 'N', type: 'unit', cost: 1, atk: 1, hp: 1, kw: ['rush'] },
  { id: 'swordman', name: '見習い剣士',   emoji: '🗡️', rarity: 'N', type: 'unit', cost: 2, atk: 2, hp: 3 },
  { id: 'guard',    name: '盾兵',         emoji: '🛡️', rarity: 'N', type: 'unit', cost: 2, atk: 1, hp: 4, kw: ['taunt'] },
  { id: 'wolf',     name: 'オオカミ',     emoji: '🐺', rarity: 'N', type: 'unit', cost: 2, atk: 3, hp: 1, kw: ['rush'] },
  { id: 'archer',   name: '弓兵',         emoji: '🏹', rarity: 'N', type: 'unit', cost: 2, atk: 2, hp: 2, target: 'enemy', fx: [{ k: 'dmg', n: 1 }] },
  { id: 'rider',    name: '騎馬兵',       emoji: '🐴', rarity: 'N', type: 'unit', cost: 3, atk: 3, hp: 3 },
  { id: 'monk',     name: '修道士',       emoji: '🙏', rarity: 'N', type: 'unit', cost: 3, atk: 2, hp: 4, fx: [{ k: 'heal', n: 3 }] },
  { id: 'orc',      name: 'オーク戦士',   emoji: '👹', rarity: 'N', type: 'unit', cost: 4, atk: 4, hp: 5 },
  { id: 'fireball', name: 'ファイアボール', emoji: '🔥', rarity: 'N', type: 'spell', cost: 2, target: 'enemy', fx: [{ k: 'dmg', n: 3 }] },
  { id: 'potion',   name: '回復薬',       emoji: '🧪', rarity: 'N', type: 'spell', cost: 1, fx: [{ k: 'heal', n: 5 }] },
  { id: 'book',     name: '知恵の書',     emoji: '📖', rarity: 'N', type: 'spell', cost: 3, fx: [{ k: 'draw', n: 2 }] },
  // ---- R ----
  { id: 'golem',    name: '岩ゴーレム',   emoji: '🗿', rarity: 'R', type: 'unit', cost: 5, atk: 4, hp: 7, kw: ['taunt'] },
  { id: 'ninja',    name: '忍者',         emoji: '🥷', rarity: 'R', type: 'unit', cost: 3, atk: 4, hp: 2, kw: ['rush'] },
  { id: 'paladin',  name: '聖騎士',       emoji: '⚜️', rarity: 'R', type: 'unit', cost: 4, atk: 3, hp: 3, kw: ['taunt', 'shield'] },
  { id: 'vampire',  name: '吸血鬼',       emoji: '🧛', rarity: 'R', type: 'unit', cost: 4, atk: 4, hp: 4, kw: ['drain'] },
  { id: 'unicorn',  name: 'ユニコーン',   emoji: '🦄', rarity: 'R', type: 'unit', cost: 3, atk: 3, hp: 2, kw: ['shield'] },
  { id: 'wizard',   name: '魔法使い',     emoji: '🧙', rarity: 'R', type: 'unit', cost: 4, atk: 3, hp: 4, target: 'enemy', fx: [{ k: 'dmg', n: 2 }] },
  { id: 'thunder',  name: 'サンダー',     emoji: '⚡', rarity: 'R', type: 'spell', cost: 4, fx: [{ k: 'dmgUnits', n: 2 }] },
  { id: 'horn',     name: '鼓舞の角笛',   emoji: '📯', rarity: 'R', type: 'spell', cost: 2, fx: [{ k: 'buffAll', atk: 1, hp: 1 }] },
  { id: 'blessing', name: '女神の祝福',   emoji: '✨', rarity: 'R', type: 'spell', cost: 1, target: 'ally', fx: [{ k: 'buffOne', atk: 2, hp: 2 }] },
  // ---- SR ----
  { id: 'griffon',  name: 'グリフォン',   emoji: '🦅', rarity: 'SR', type: 'unit', cost: 5, atk: 5, hp: 4, kw: ['rush'] },
  { id: 'angel',    name: '大天使',       emoji: '👼', rarity: 'SR', type: 'unit', cost: 6, atk: 5, hp: 6, kw: ['shield'], fx: [{ k: 'heal', n: 5 }] },
  { id: 'necro',    name: 'ネクロマンサー', emoji: '💀', rarity: 'SR', type: 'unit', cost: 5, atk: 3, hp: 3, fx: [{ k: 'summon', id: 'ghost', n: 2 }] },
  { id: 'assassin', name: '暗殺',         emoji: '☠️', rarity: 'SR', type: 'spell', cost: 4, target: 'enemyUnit', fx: [{ k: 'destroy' }] },
  { id: 'meteor',   name: 'メテオ',       emoji: '☄️', rarity: 'SR', type: 'spell', cost: 6, fx: [{ k: 'dmgAll', n: 4 }] },
  // ---- UR ----
  { id: 'dragon',   name: '古代竜',       emoji: '🐉', rarity: 'UR', type: 'unit', cost: 8, atk: 8, hp: 8, fx: [{ k: 'dmgAll', n: 2 }] },
  { id: 'hero',     name: '勇者',         emoji: '🦸', rarity: 'UR', type: 'unit', cost: 6, atk: 5, hp: 5, kw: ['rush', 'shield'], fx: [{ k: 'buffAll', atk: 1, hp: 1 }] },
  { id: 'phoenix',  name: '不死鳥',       emoji: '🦚', rarity: 'UR', type: 'unit', cost: 7, atk: 6, hp: 6, kw: ['rush', 'drain'], fx: [{ k: 'heal', n: 4 }] },
  { id: 'demon',    name: '魔王',         emoji: '😈', rarity: 'UR', type: 'unit', cost: 9, atk: 8, hp: 8, kw: ['taunt', 'drain'], fx: [{ k: 'wipe' }] },
  // ---- トークン（パックからは出ない）----
  { id: 'ghost',    name: 'ゴースト',     emoji: '👻', rarity: 'N', type: 'unit', cost: 2, atk: 2, hp: 2, token: true },
];

export const CARD_MAP = Object.fromEntries(CARDS.map(c => [c.id, c]));
export const COLLECTIBLE = CARDS.filter(c => !c.token);

export const KW_NAME = { taunt: '守護', rush: '速攻', shield: '聖盾', drain: '吸収' };
export const KW_HELP = {
  taunt: '守護: 相手はこのユニットを先に攻撃しなければならない',
  rush: '速攻: 出したターンにすぐ攻撃できる',
  shield: '聖盾: 最初に受けるダメージを1回無効化',
  drain: '吸収: 与えたダメージぶん自分のHPを回復',
};
export const RARITY_ORDER = { N: 0, R: 1, SR: 2, UR: 3 };

export function cardText(c) {
  const parts = [];
  if (c.kw) parts.push(c.kw.map(k => KW_NAME[k]).join('・'));
  const pre = c.type === 'unit' ? '召喚時: ' : '';
  for (const f of c.fx || []) {
    let t = '';
    switch (f.k) {
      case 'dmg': t = c.target === 'enemy' ? `敵1体に${f.n}ダメージ` : `${f.n}ダメージ`; break;
      case 'dmgUnits': t = `敵ユニット全体に${f.n}ダメージ`; break;
      case 'dmgAll': t = `敵全体に${f.n}ダメージ`; break;
      case 'heal': t = `自分のHPを${f.n}回復`; break;
      case 'draw': t = `カードを${f.n}枚引く`; break;
      case 'buffAll': t = `味方ユニット全体に+${f.atk}/+${f.hp}`; break;
      case 'buffOne': t = `味方ユニット1体に+${f.atk}/+${f.hp}`; break;
      case 'destroy': t = '敵ユニット1体を破壊'; break;
      case 'summon': t = `${CARD_MAP[f.id].name}(${CARD_MAP[f.id].atk}/${CARD_MAP[f.id].hp})を${f.n}体召喚`; break;
      case 'wipe': t = '他のユニットをすべて破壊'; break;
    }
    parts.push(pre + t);
  }
  return parts.join('\n');
}
