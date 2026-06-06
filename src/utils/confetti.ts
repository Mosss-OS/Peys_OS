import confetti from "canvas-confetti";

/**
 * Confetti animation helpers using the canvas-confetti library.
 */

/** Fires a single burst of 100 confetti particles. */
export function fireConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
}

/** Fires a wide-angle burst of 200 confetti particles in all directions. */
export function fireBurst() {
  confetti({
    particleCount: 200,
    angle: 90,
    spread: 180,
    origin: { y: 0.6 },
  });
}

/** Fires a continuous confetti shower from both sides of the screen for 1.5 seconds. */
export function fireConfettiShower() {
  const end = Date.now() + 1500;
  const frame = () => {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}
