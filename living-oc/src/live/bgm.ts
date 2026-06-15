// ── 温馨 8-bit 背景音乐(原创,Web Audio 程序生成)──
// 不使用任天堂版权曲目;这是一段原创的暖色循环(I–V–vi–IV + 五声音阶旋律),
// 与宝可梦同款"温馨小镇"氛围,但完全原创、零版权、零外部文件。
let actx: AudioContext | null = null;
let master: GainNode | null = null;
let playing = false;
let loopT = 0;
let timer: number | null = null;

const BEAT = 0.62;            // 每拍秒数(~96 BPM,舒缓)
const BAR = BEAT * 4;         // 每小节 4 拍

function tone(freq: number, start: number, dur: number, type: OscillatorType, peak: number) {
  if (!actx || !master) return;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.value = freq; o.connect(g); g.connect(master);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.linearRampToValueAtTime(peak, start + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.start(start); o.stop(start + dur + 0.05);
}

// C 大调:I(C) – V(G) – vi(Am) – IV(F)。每个元素 = [低音, 三和弦, 旋律(五声)]
const PROG: { bass: number; pad: number[]; mel: number[] }[] = [
  { bass: 130.81, pad: [261.63, 329.63, 392.00], mel: [329.63, 392.00, 523.25] }, // C
  { bass: 98.00, pad: [196.00, 246.94, 293.66], mel: [293.66, 392.00, 440.00] }, // G
  { bass: 110.00, pad: [220.00, 261.63, 329.63], mel: [523.25, 440.00, 329.63] }, // Am
  { bass: 87.31, pad: [174.61, 220.00, 261.63], mel: [440.00, 523.25, 392.00] }, // F
];
let bar = 0;

function scheduleBar(t0: number) {
  const c = PROG[bar % PROG.length]; bar++;
  tone(c.bass, t0, BAR * 0.96, 'triangle', 0.16);            // 低音
  for (const p of c.pad) tone(p, t0, BAR * 0.96, 'sine', 0.05); // 柔和和弦垫
  // 旋律:3 个五声音符,落在第 1/2.5/4 拍,三角波清亮温暖
  const at = [0, 1.5, 3];
  c.mel.forEach((m, i) => tone(m, t0 + at[i] * BEAT, BEAT * 1.1, 'triangle', 0.12));
}

function pump() {
  if (!playing || !actx) return;
  const now = actx.currentTime;
  while (loopT < now + 1.2) { scheduleBar(loopT); loopT += BAR; }
  timer = window.setTimeout(pump, 280);
}

export function bgmPlaying() { return playing; }

export function toggleBgm(): boolean {
  if (playing) {
    playing = false; if (timer) { clearTimeout(timer); timer = null; }
    if (master && actx) { master.gain.linearRampToValueAtTime(0.0001, actx.currentTime + 0.4); }
    return false;
  }
  if (!actx) {
    actx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    master = actx.createGain(); master.gain.value = 0.0001; master.connect(actx.destination);
  }
  void actx.resume();
  master!.gain.cancelScheduledValues(actx.currentTime);
  master!.gain.setValueAtTime(0.0001, actx.currentTime);
  master!.gain.linearRampToValueAtTime(0.22, actx.currentTime + 0.8); // 整体音量(温柔)
  playing = true; loopT = actx.currentTime + 0.1; pump();
  return true;
}
