// 8-bit sound effects and a calm background tune, synthesized with the Web Audio API.
// Nothing is downloaded. Audio starts after the first tap or key press (browser autoplay rules).
import { loadProgress, updateProgress } from '../game/progress';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = loadProgress().muted;
const listeners = new Set<(muted: boolean) => void>();

/** Call from any user gesture. Creates or resumes the audio context and starts the music. */
export function unlockAudio(): void {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  music.start();
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(m: boolean): void {
  muted = m;
  updateProgress({ muted: m });
  if (ctx && master) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.03);
  listeners.forEach((fn) => fn(m));
}

export function toggleMuted(): boolean {
  setMuted(!muted);
  return muted;
}

export function onMutedChange(fn: (muted: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number, delay = 0, out?: AudioNode): void {
  if (!ctx || !master || muted) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out ?? master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(dur: number, vol: number, delay = 0, cutoff = 1800): void {
  if (!ctx || !master || muted) return;
  const t = ctx.currentTime + delay;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = cutoff;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t);
}

export const sfx = {
  jump: () => tone(330, 0.16, 'square', 0.07, 700),
  coin: () => { tone(988, 0.07, 'square', 0.05); tone(1319, 0.2, 'square', 0.05, undefined, 0.07); },
  stomp: () => { tone(260, 0.14, 'square', 0.08, 90); noise(0.1, 0.06, 0, 1200); },
  hurt: () => tone(320, 0.32, 'sawtooth', 0.07, 90),
  fall: () => tone(620, 0.55, 'triangle', 0.09, 110),
  checkpoint: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'square', 0.05, undefined, i * 0.08)),
  complete: () => [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i === 5 ? 0.5 : 0.16, 'square', 0.055, undefined, i * 0.12)),
  click: () => tone(700, 0.05, 'square', 0.04),
  dig: () => noise(0.08, 0.05, 0, 900),
  shimmer: () => [1568, 1976, 2349].forEach((f, i) => tone(f, 0.25, 'triangle', 0.04, undefined, i * 0.09)),
  whoosh: () => { noise(1.2, 0.07, 0, 700); tone(180, 1.2, 'triangle', 0.05, 60); },
  land: () => { tone(140, 0.18, 'square', 0.08, 60); noise(0.15, 0.08, 0, 800); },
  jet: () => noise(0.14, 0.035, 0, 600),
  buy: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.12, 'square', 0.045, undefined, i * 0.06)),
  badge: () => [659, 784, 988, 1319, 1568].forEach((f, i) => tone(f, i === 4 ? 0.4 : 0.12, 'triangle', 0.06, undefined, i * 0.09)),
  armor: () => { tone(1200, 0.12, 'square', 0.05, 600); noise(0.08, 0.05, 0, 3000); },
  deny: () => tone(200, 0.18, 'square', 0.05, 150),
};

/** A calm 8-bit desert tune: triangle lead over a soft square bass, D dorian. */
class Music {
  private timer: number | null = null;
  private step = 0;
  private nextTime = 0;
  private out: GainNode | null = null;
  private readonly tempo = 96; // quarter notes per minute; steps are eighths

  // 64 eighth-note steps, MIDI note or 0 for rest
  private readonly lead = [
    62, 0, 65, 0, 67, 0, 69, 0, 67, 0, 65, 0, 62, 0, 0, 0, 60, 0, 62, 0, 65, 0, 67, 0, 65, 0, 62, 0, 60, 0, 0, 0,
    69, 0, 72, 0, 74, 0, 72, 0, 69, 0, 67, 0, 65, 0, 0, 0, 67, 0, 69, 0, 67, 0, 65, 0, 62, 0, 0, 0, 0, 0, 0, 0,
  ];
  private readonly bass = [38, 34, 36, 38, 38, 34, 36, 33]; // one note per bar (8 steps)

  start(): void {
    if (!ctx || !master || this.timer !== null) return;
    this.out = ctx.createGain();
    this.out.gain.value = 0.9;
    this.out.connect(master);
    this.nextTime = ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 40);
  }

  private schedule(): void {
    if (!ctx || !this.out) return;
    const stepDur = 60 / this.tempo / 2;
    while (this.nextTime < ctx.currentTime + 0.2) {
      const delay = Math.max(0, this.nextTime - ctx.currentTime);
      if (!muted) {
        const n = this.lead[this.step % this.lead.length];
        if (n) tone(midi(n), stepDur * 1.8, 'triangle', 0.045, undefined, delay, this.out);
        if (this.step % 8 === 0) tone(midi(this.bass[Math.floor(this.step / 8) % this.bass.length]), stepDur * 3.5, 'square', 0.018, undefined, delay, this.out);
        if (this.step % 8 === 4) tone(midi(this.bass[Math.floor(this.step / 8) % this.bass.length] + 7), stepDur * 2, 'square', 0.012, undefined, delay, this.out);
      }
      this.step++;
      this.nextTime += stepDur;
    }
  }
}

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
export const music = new Music();
