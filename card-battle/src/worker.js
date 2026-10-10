// Cloudflare Worker: 静的ファイル配信 + オンライン対戦（Durable Objects / WebSocket）
import { createGame, applyAction, viewFor, validateDeck } from '../public/engine.js';

const TURN_MS = 75_000;      // 1ターンの制限時間
const RECONNECT_MS = 45_000; // 切断からの復帰猶予
const EMOTES = ['👍', '😂', '😱', '🔥', '🙏', '😤'];

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
});

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/ws/')) {
      const room = url.pathname.slice(4).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
      if (!room) return json({ error: 'room required' }, 400);
      return env.ROOMS.get(env.ROOMS.idFromName(room)).fetch(req);
    }
    if (url.pathname === '/api/match') {
      return env.MATCH.get(env.MATCH.idFromName('global')).fetch(req);
    }
    if (url.pathname === '/api/health') return json({ ok: true, online: true });
    return env.ASSETS.fetch(req);
  },
};

function roomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = 'Q';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// ランダムマッチ: 待機中のルームが1つあればそこへ、なければ新規ルームを作って待つ
export class Matchmaker {
  constructor(ctx, env) { this.waiting = null; }
  async fetch(req) {
    const url = new URL(req.url);
    const now = Date.now();
    const keep = url.searchParams.get('keep');
    const cancel = url.searchParams.get('cancel');
    if (keep) {
      if (this.waiting?.room === keep) this.waiting.t = now;
      return json({ ok: true });
    }
    if (cancel) {
      if (this.waiting?.room === cancel) this.waiting = null;
      return json({ ok: true });
    }
    if (this.waiting && now - this.waiting.t < 15_000) {
      const room = this.waiting.room;
      this.waiting = null;
      return json({ room, host: false });
    }
    const room = roomCode();
    this.waiting = { room, t: now };
    return json({ room, host: true });
  }
}

export class GameRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.seats = [null, null]; // { token, name, deck, ws, dropTimer, rematch }
    this.game = null;
    this.turnTimer = null;
    this.deadline = 0;
  }

  async fetch(req) {
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('expected websocket', { status: 426 });
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    server.addEventListener('message', e => {
      try { this.onMessage(server, e.data); } catch (err) { this.send(server, { t: 'error', msg: 'サーバーエラー' }); }
    });
    const closed = () => this.onClose(server);
    server.addEventListener('close', closed);
    server.addEventListener('error', closed);
    return new Response(null, { status: 101, webSocket: client });
  }

  send(ws, msg) { try { ws?.send(JSON.stringify(msg)); } catch {} }
  seatOf(ws) { return this.seats.findIndex(s => s && s.ws === ws); }

  broadcast() {
    for (let i = 0; i < 2; i++) {
      const seat = this.seats[i];
      if (seat?.ws && this.game) this.send(seat.ws, { t: 'state', v: viewFor(this.game, i), deadline: this.deadline, oppOnline: !!this.seats[1 - i]?.ws });
    }
  }

  startGame() {
    const [a, b] = this.seats;
    a.rematch = b.rematch = false;
    this.game = createGame([a.deck, b.deck], [a.name, b.name]);
    this.armTimer();
    this.broadcast();
  }

  armTimer() {
    clearTimeout(this.turnTimer);
    if (!this.game || this.game.over) { this.deadline = 0; return; }
    this.deadline = Date.now() + TURN_MS;
    const turnNo = this.game.turnNo;
    this.turnTimer = setTimeout(() => {
      if (this.game && !this.game.over && this.game.turnNo === turnNo) {
        applyAction(this.game, this.game.turn, { type: 'end' });
        this.armTimer();
        this.broadcast();
      }
    }, TURN_MS);
  }

  onMessage(ws, raw) {
    if (typeof raw !== 'string' || raw.length > 4000) return;
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    const me = this.seatOf(ws);

    if (m.t === 'join') {
      if (me >= 0) return;
      // 再接続
      const re = m.token ? this.seats.findIndex(s => s && s.token === m.token) : -1;
      if (re >= 0) {
        const seat = this.seats[re];
        if (seat.ws && seat.ws !== ws) { try { seat.ws.close(4000, 'replaced'); } catch {} }
        seat.ws = ws;
        clearTimeout(seat.dropTimer);
        this.send(ws, { t: 'joined', seat: re, token: seat.token });
        if (this.game) { this.broadcast(); this.send(this.seats[1 - re]?.ws, { t: 'opp_back' }); }
        else this.send(ws, { t: 'waiting' });
        return;
      }
      const err = validateDeck(m.deck);
      if (err) { this.send(ws, { t: 'error', msg: err, fatal: true }); ws.close(4001, 'bad deck'); return; }
      const idx = this.seats.findIndex(s => !s);
      if (idx < 0) { this.send(ws, { t: 'error', msg: 'このルームは満員です', fatal: true }); ws.close(4002, 'full'); return; }
      const name = String(m.name || 'プレイヤー').replace(/[<>&"']/g, '').slice(0, 12) || 'プレイヤー';
      this.seats[idx] = { token: crypto.randomUUID(), name, deck: m.deck.slice(), ws, dropTimer: null, rematch: false };
      this.send(ws, { t: 'joined', seat: idx, token: this.seats[idx].token });
      if (this.seats[0] && this.seats[1]) this.startGame();
      else this.send(ws, { t: 'waiting' });
      return;
    }

    if (me < 0) return;

    if (m.t === 'action') {
      if (!this.game) return;
      const before = this.game.turnNo;
      const r = applyAction(this.game, me, m.a);
      if (r.error) { this.send(ws, { t: 'error', msg: r.error }); return; }
      if (this.game.turnNo !== before || this.game.over) this.armTimer();
      this.broadcast();
      return;
    }

    if (m.t === 'emote') {
      if (!EMOTES.includes(m.e)) return;
      const now = Date.now();
      const seat = this.seats[me];
      if (now - (seat.lastEmote || 0) < 1500) return;
      seat.lastEmote = now;
      this.send(this.seats[1 - me]?.ws, { t: 'emote', e: m.e });
      return;
    }

    if (m.t === 'rematch') {
      if (!this.game?.over) return;
      if (validateDeck(m.deck) === null) this.seats[me].deck = m.deck.slice();
      this.seats[me].rematch = true;
      const other = this.seats[1 - me];
      if (other?.rematch) this.startGame();
      else this.send(other?.ws, { t: 'rematch_req' });
      return;
    }

    if (m.t === 'leave') {
      this.leave(me);
    }
  }

  leave(i) {
    const seat = this.seats[i];
    if (!seat) return;
    clearTimeout(seat.dropTimer);
    if (this.game && !this.game.over) {
      applyAction(this.game, i, { type: 'concede' });
      this.armTimer();
      this.broadcast();
    }
    this.seats[i] = null;
    this.send(this.seats[1 - i]?.ws, { t: 'opp_left' });
    if (!this.seats[0] && !this.seats[1]) { this.game = null; clearTimeout(this.turnTimer); }
    else if (this.game?.over) this.game = null;
    try { seat.ws?.close(1000, 'bye'); } catch {}
  }

  onClose(ws) {
    const i = this.seatOf(ws);
    if (i < 0) return;
    const seat = this.seats[i];
    seat.ws = null;
    if (!this.game) { this.seats[i] = null; return; } // 待機中なら席を空ける
    if (this.game.over) {
      this.leave(i);
      return;
    }
    this.send(this.seats[1 - i]?.ws, { t: 'opp_away', ms: RECONNECT_MS });
    seat.dropTimer = setTimeout(() => { if (!seat.ws && this.seats[i] === seat) this.leave(i); }, RECONNECT_MS);
  }
}
