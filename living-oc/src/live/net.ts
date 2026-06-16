// ── 联机层:全球多人世界(PokeMMO 风)──
// 统一接口 + 两种传输:
//  · BroadcastChannel —— 同浏览器多窗口,零配置(本机分屏联机 & 验证渲染管线)
//  · Supabase Realtime —— 全球房间(broadcast 同步位置/聊天 + presence 在线名单)。
//    只需用户填 Supabase 项目 URL + anon key(均为可公开的客户端密钥),无需自建服务器。
// 自动选择:配置了 Supabase → 全球;否则 → 本机多窗口。

export interface PosMsg { id: string; name: string; sprite: string; x: number; y: number; dir: string; moving: boolean; flip: boolean }
export interface ChatMsg { id: string; name: string; text: string }
export interface NetSelf { id: string; name: string; sprite: string }
// 共享世界快照(主机权威):按 NPC 名字同步,无需固定种子
export interface WorldSnap { e: number; supply: number; npc: { name: string; loc: string; mood: string }[]; feed: { id: string; agentId: string; name: string; action: string; text: string; ev: string | null }[] }

export interface NetTransport {
  kind: 'global' | 'local';
  connect(room: string, me: NetSelf): Promise<void> | void;
  sendPos(p: PosMsg): void;
  sendChat(text: string): void;
  sendWorld(snap: WorldSnap): void;
  onPos(cb: (p: PosMsg) => void): void;
  onChat(cb: (m: ChatMsg) => void): void;
  onWorld(cb: (snap: WorldSnap) => void): void;
  onPresence(cb: (count: number) => void): void;
  onPeers(cb: (ids: string[]) => void): void;   // 当前在场玩家 id 列表(用于主机选举)
  disconnect(): void;
}

const NET_KEY = 'oc-net-supabase';   // { url, key }
const PLAYER_KEY = 'oc-net-player';  // { id, name }

export function netConfig(): { url: string; key: string } | null {
  try { const s = localStorage.getItem(NET_KEY); if (s) { const v = JSON.parse(s); if (v?.url && v?.key) return { url: v.url, key: v.key }; } } catch { /* ignore */ }
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (url && key) return { url, key };
  return null;
}
export function setNetConfig(url: string, key: string) {
  try { localStorage.setItem(NET_KEY, JSON.stringify({ url: url.trim(), key: key.trim() })); } catch { /* ignore */ }
}
export function clearNetConfig() { try { localStorage.removeItem(NET_KEY); } catch { /* ignore */ } }
export function netMode(): 'global' | 'local' { return netConfig() ? 'global' : 'local'; }

const SPRITES = ['red_normal', 'green_normal', 'boy', 'lass', 'youngster', 'fat_man', 'beauty', 'gentleman'];
function hash(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function rndHex(n: number): string { let s = ''; for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 16).toString(16); return s; }

// 稳定的本地玩家身份(昵称可改;精灵由 id 哈希分配,玩家之间外观各异)
export function playerSelf(): NetSelf {
  let rec: { id: string; name: string } | null = null;
  try { const s = localStorage.getItem(PLAYER_KEY); if (s) rec = JSON.parse(s); } catch { /* ignore */ }
  if (!rec?.id) { rec = { id: 'p_' + rndHex(10), name: '训练师-' + rndHex(4) }; try { localStorage.setItem(PLAYER_KEY, JSON.stringify(rec)); } catch { /* ignore */ } }
  return { id: rec.id, name: rec.name, sprite: SPRITES[hash(rec.id) % SPRITES.length] };
}
export function setPlayerName(name: string) {
  const me = playerSelf(); const rec = { id: me.id, name: name.trim() || me.name };
  try { localStorage.setItem(PLAYER_KEY, JSON.stringify(rec)); } catch { /* ignore */ }
}

// ── BroadcastChannel:同浏览器多窗口(零配置)──
class LocalTransport implements NetTransport {
  kind = 'local' as const;
  private bc?: BroadcastChannel; private me!: NetSelf;
  private peers = new Map<string, number>();
  private posCb?: (p: PosMsg) => void; private chatCb?: (m: ChatMsg) => void; private presCb?: (n: number) => void;
  private peersCb?: (ids: string[]) => void; private worldCb?: (s: WorldSnap) => void;
  connect(room: string, me: NetSelf) {
    this.me = me; this.bc = new BroadcastChannel('oc-world:' + room);
    this.bc.onmessage = (e) => {
      const d = e.data; if (!d || d.from === me.id) return;
      if (d.t === 'pos') { this.peers.set(d.p.id, performance.now()); this.posCb?.(d.p); this.prune(); }
      else if (d.t === 'chat') { this.chatCb?.(d.m); }
      else if (d.t === 'world') { this.peers.set(d.from, performance.now()); this.worldCb?.(d.snap); this.prune(); }
      else if (d.t === 'bye') { this.peers.delete(d.from); this.prune(); }
      else if (d.t === 'hi') { this.bc?.postMessage({ t: 'yo', from: me.id }); this.prune(); }   // 新人加入 → 回应,便于互相发现
      else if (d.t === 'yo') { this.peers.set(d.from, performance.now()); this.prune(); }
    };
    this.bc.postMessage({ t: 'hi', from: me.id });
  }
  private prune() { const now = performance.now(); for (const [id, t] of this.peers) if (now - t > 6000) this.peers.delete(id); this.presCb?.(this.peers.size + 1); this.peersCb?.([this.me.id, ...this.peers.keys()]); }
  sendPos(p: PosMsg) { this.bc?.postMessage({ t: 'pos', from: this.me.id, p }); }
  sendChat(text: string) { const m = { id: this.me.id, name: this.me.name, text }; this.bc?.postMessage({ t: 'chat', from: this.me.id, m }); this.chatCb?.(m); }
  sendWorld(snap: WorldSnap) { this.bc?.postMessage({ t: 'world', from: this.me.id, snap }); }
  onPos(cb: (p: PosMsg) => void) { this.posCb = cb; }
  onChat(cb: (m: ChatMsg) => void) { this.chatCb = cb; }
  onWorld(cb: (s: WorldSnap) => void) { this.worldCb = cb; }
  onPresence(cb: (n: number) => void) { this.presCb = cb; cb(1); }
  onPeers(cb: (ids: string[]) => void) { this.peersCb = cb; cb([this.me?.id || 'self']); }
  disconnect() { try { this.bc?.postMessage({ t: 'bye', from: this.me?.id }); this.bc?.close(); } catch { /* ignore */ } }
}

// ── Supabase Realtime:全球房间(动态加载 supabase-js)──
class GlobalTransport implements NetTransport {
  kind = 'global' as const;
  private cfg: { url: string; key: string }; private me!: NetSelf;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private channel: any; private client: any;
  private posCb?: (p: PosMsg) => void; private chatCb?: (m: ChatMsg) => void; private presCb?: (n: number) => void;
  private peersCb?: (ids: string[]) => void; private worldCb?: (s: WorldSnap) => void;
  constructor(cfg: { url: string; key: string }) { this.cfg = cfg; }
  async connect(room: string, me: NetSelf) {
    this.me = me;
    const { createClient } = await import('@supabase/supabase-js');
    this.client = createClient(this.cfg.url, this.cfg.key, { realtime: { params: { eventsPerSecond: 16 } } });
    this.channel = this.client.channel('oc-world:' + room, { config: { presence: { key: me.id }, broadcast: { self: false } } });
    this.channel
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('broadcast', { event: 'pos' }, (m: any) => this.posCb?.(m.payload))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('broadcast', { event: 'chat' }, (m: any) => this.chatCb?.(m.payload))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('broadcast', { event: 'world' }, (m: any) => this.worldCb?.(m.payload))
      .on('presence', { event: 'sync' }, () => { try { const ids = Object.keys(this.channel.presenceState()); this.presCb?.(ids.length); this.peersCb?.(ids); } catch { /* ignore */ } })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .subscribe(async (status: string) => { if (status === 'SUBSCRIBED') { try { await this.channel.track({ name: me.name, sprite: me.sprite }); } catch { /* ignore */ } } });
  }
  sendPos(p: PosMsg) { try { this.channel?.send({ type: 'broadcast', event: 'pos', payload: p }); } catch { /* ignore */ } }
  sendChat(text: string) { const payload = { id: this.me.id, name: this.me.name, text }; try { this.channel?.send({ type: 'broadcast', event: 'chat', payload }); } catch { /* ignore */ } this.chatCb?.(payload); }
  sendWorld(snap: WorldSnap) { try { this.channel?.send({ type: 'broadcast', event: 'world', payload: snap }); } catch { /* ignore */ } }
  onPos(cb: (p: PosMsg) => void) { this.posCb = cb; }
  onChat(cb: (m: ChatMsg) => void) { this.chatCb = cb; }
  onWorld(cb: (s: WorldSnap) => void) { this.worldCb = cb; }
  onPresence(cb: (n: number) => void) { this.presCb = cb; }
  onPeers(cb: (ids: string[]) => void) { this.peersCb = cb; }
  disconnect() { try { this.channel?.unsubscribe(); this.client?.removeAllChannels?.(); } catch { /* ignore */ } }
}

export function makeNet(): NetTransport {
  const cfg = netConfig();
  return cfg ? new GlobalTransport(cfg) : new LocalTransport();
}
