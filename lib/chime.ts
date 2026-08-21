const VOLUME_KEY = "pomodose:chime-volume";

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;

export function getChimeVolume(): number {
  if (typeof localStorage === "undefined") return 0.7;
  const stored = localStorage.getItem(VOLUME_KEY);
  if (stored === null) return 0.7;
  const v = parseFloat(stored);
  return Number.isNaN(v) ? 0.7 : Math.min(1, Math.max(0, v));
}

export function setChimeVolume(v: number): void {
  const clamped = Math.min(1, Math.max(0, v));
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(VOLUME_KEY, String(clamped));
  }
  if (masterGain) masterGain.gain.value = clamped;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined" || typeof window.AudioContext === "undefined") return null;
  if (!audioContext) audioContext = new AudioContext();
  return audioContext;
}

function getMasterGain(ctx: AudioContext): GainNode {
  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.gain.value = getChimeVolume();
    masterGain.connect(ctx.destination);
  }
  return masterGain;
}

function playTone(ctx: AudioContext, frequency: number, startTime: number, duration: number, peakGain: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(getMasterGain(ctx));
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.05);
}

/** Bright bell "ting" (like a pharmacy counter pickup bell) played once. */
export function playPickupBell(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  const now = ctx.currentTime;
  playTone(ctx, 1568.0, now, 0.9, 0.14); // G6 fundamental — the main ring
  playTone(ctx, 3729.3, now, 0.4, 0.05); // inharmonic overtone — metallic shimmer
}

const ALERT_REPEAT_INTERVAL_MS = 4000;

let alertIntervalId: ReturnType<typeof setInterval> | null = null;

/** Rings the pickup bell immediately, then every ALERT_REPEAT_INTERVAL_MS until stopped. */
export function startCompletionAlert(): void {
  stopCompletionAlert();
  playPickupBell();
  alertIntervalId = setInterval(playPickupBell, ALERT_REPEAT_INTERVAL_MS);
}

/** Silences a ringing completion alert. Safe to call when nothing is ringing. */
export function stopCompletionAlert(): void {
  if (alertIntervalId !== null) {
    clearInterval(alertIntervalId);
    alertIntervalId = null;
  }
}
