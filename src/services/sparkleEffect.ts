/**
 * Cute Hand-Drawn Sparkle Particle System
 * Spawns short-lived, lightweight flower and star doodle particles upon button clicks.
 *
 * Rules:
 * - Respects prefers-reduced-motion accessibility setting
 * - Limits maximum concurrent particles in DOM (capped at 14) to prevent lag or memory leaks
 * - Automatically cleans up DOM elements after animation ends (400ms)
 */

interface ParticleOptions {
  x: number;
  y: number;
  count?: number;
}

const DOODLE_SHAPES = ['⭐', '🌸', '✨', '🌼', '💫', '🌿'];
let activeParticleCount = 0;
const MAX_CONCURRENT_PARTICLES = 14;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function triggerSparkleEffect(e?: any): void {
  // Respect reduced-motion accessibility preference
  if (typeof window === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  let clientX = 0;
  let clientY = 0;

  if ('touches' in e && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if ('clientX' in e && typeof e.clientX === 'number') {
    clientX = e.clientX;
    clientY = e.clientY;
  } else {
    return;
  }

  // Prevent spawn if off-screen or 0,0
  if (clientX === 0 && clientY === 0) return;

  const count = 4;
  for (let i = 0; i < count; i++) {
    if (activeParticleCount >= MAX_CONCURRENT_PARTICLES) break;

    activeParticleCount++;
    const particle = document.createElement('span');
    const shape = DOODLE_SHAPES[Math.floor(Math.random() * DOODLE_SHAPES.length)];
    particle.innerText = shape;

    const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
    const distance = 24 + Math.random() * 26;
    const destX = Math.cos(angle) * distance;
    const destY = Math.sin(angle) * distance - 10; // slight upward drift
    const rotation = (Math.random() - 0.5) * 60;
    const size = 13 + Math.random() * 5;

    particle.style.position = 'fixed';
    particle.style.left = `${clientX}px`;
    particle.style.top = `${clientY}px`;
    particle.style.fontSize = `${size}px`;
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '9999';
    particle.style.userSelect = 'none';
    particle.style.transform = `translate(-50%, -50%) translate(0px, 0px) scale(0.6) rotate(0deg)`;
    particle.style.opacity = '1';
    particle.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease-out';

    document.body.appendChild(particle);

    // Trigger animation in next frame
    requestAnimationFrame(() => {
      particle.style.transform = `translate(-50%, -50%) translate(${destX}px, ${destY}px) scale(1) rotate(${rotation}deg)`;
      particle.style.opacity = '0';
    });

    // Clean up
    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
      activeParticleCount = Math.max(0, activeParticleCount - 1);
    }, 450);
  }
}
