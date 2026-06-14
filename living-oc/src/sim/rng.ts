// ── 确定性随机:mulberry32 + xmur3。状态是单个 uint32,可序列化 → 决定论关键 ──

export function xmur3(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export function seedToState(seed: string): number {
  return xmur3(seed);
}

/** 纯函数:给定状态返回下一个 [0,1) 值与新状态 */
export function nextRand(state: number): { value: number; state: number } {
  let a = state | 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, state: a };
}

export interface RandStepper {
  (): number;
}

/** 把一个对象上的数字字段包装成可推进的随机流 */
export function makeStepper(get: () => number, set: (s: number) => void): RandStepper {
  return () => {
    const r = nextRand(get());
    set(r.state);
    return r.value;
  };
}

export function pick<T>(rnd: RandStepper, arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

export function range(rnd: RandStepper, a: number, b: number): number {
  return a + (b - a) * rnd();
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
