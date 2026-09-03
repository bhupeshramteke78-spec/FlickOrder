"use client";

export async function playNotificationChime(type: "order" | "kitchen" | "waiter" | "bell" = "order") {
  // First attempt: MP3 audio asset
  try {
    const audio = new Audio("/sounds/new-order.mp3");
    audio.volume = 0.85;
    await audio.play();
    return;
  } catch {
    // Fallback to Web Audio API synthesis
  }

  // Second attempt: Web Audio API synthesized harmonic bell
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "kitchen") {
      // High bright kitchen ding (B5 + E6)
      osc1.frequency.setValueAtTime(987.77, now);
      osc2.frequency.setValueAtTime(1318.51, now);
    } else if (type === "waiter" || type === "bell") {
      // Service call bell chime (C6 + G6)
      osc1.frequency.setValueAtTime(1046.5, now);
      osc2.frequency.setValueAtTime(1567.98, now);
    } else {
      // Standard order chime (A5 + E6)
      osc1.frequency.setValueAtTime(880, now);
      osc2.frequency.setValueAtTime(1320, now);
    }

    osc1.type = "sine";
    osc2.type = "triangle";

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.1);
    osc2.stop(now + 1.1);
  } catch {
    // Requires initial user interaction on page to unlock audio context
  }
}
