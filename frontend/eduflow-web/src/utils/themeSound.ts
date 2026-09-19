// Subtle and delightful sound chime using Web Audio API (zero external assets needed)
export function playThemeSound(type: 'morning' | 'night') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'morning') {
      // Cheerful, bright sunrise chord: C5 -> E5 -> G5
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.18); // G5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.start(now);
      osc.stop(now + 0.36);
    } else {
      // Soft, calming twilight chime: G4 -> E4 -> C4
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440.0, now); // A4
      osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.22); // C4

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.start(now);
      osc.stop(now + 0.46);
    }

    setTimeout(() => {
      ctx.close();
    }, 500);
  } catch {
    // AudioContext might be blocked until user interacts, safely ignore
  }
}
