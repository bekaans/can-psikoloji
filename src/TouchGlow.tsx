import { useEffect, useRef } from 'react';

/** Dokunmatik ekranda parmağın gittiği yönde beliren yumuşak parlaklık (en arka katman). */
export function TouchGlow({ still }: { still: boolean }) {
  const glow = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (still) return;
    // Dokunmatik: parmağın gittiği yöne doğru yumuşak parlaklık.
    const el = glow.current;
    let cleanupTouch = () => {};
    if (el && matchMedia('(pointer: coarse)').matches) {
      let x = innerWidth / 2;
      let y = innerHeight / 2;
      let tx = x;
      let ty = y;
      let level = 0;
      let target = 0;
      let px = 0;
      let py = 0;
      let raf = 0;
      const loop = () => {
        x += (tx - x) * 0.14;
        y += (ty - y) * 0.14;
        level += (target - level) * (target > level ? 0.2 : 0.045);
        el.style.opacity = level.toFixed(3);
        el.style.transform = `translate3d(${x - 150}px,${y - 150}px,0)`;
        if (level < 0.005 && target === 0) {
          raf = 0;
          return;
        }
        raf = requestAnimationFrame(loop);
      };
      const start = () => {
        if (!raf) raf = requestAnimationFrame(loop);
      };
      const onStart = (e: TouchEvent) => {
        px = e.touches[0].clientX;
        py = e.touches[0].clientY;
        tx = x = px;
        ty = y = py;
      };
      const onMove = (e: TouchEvent) => {
        const t = e.touches[0];
        const dx = t.clientX - px;
        const dy = t.clientY - py;
        px = t.clientX;
        py = t.clientY;
        const len = Math.hypot(dx, dy) || 1;
        // Parmağın önünde, gittiği yönde.
        tx = Math.min(innerWidth - 30, Math.max(30, px + (dx / len) * 110));
        ty = Math.min(innerHeight - 30, Math.max(30, py + (dy / len) * 110));
        target = Math.min(0.38, 0.12 + len * 0.025);
        start();
      };
      const onEnd = () => {
        target = 0;
        start();
      };
      addEventListener('touchstart', onStart, { passive: true });
      addEventListener('touchmove', onMove, { passive: true });
      addEventListener('touchend', onEnd, { passive: true });
      addEventListener('touchcancel', onEnd, { passive: true });
      cleanupTouch = () => {
        cancelAnimationFrame(raf);
        removeEventListener('touchstart', onStart);
        removeEventListener('touchmove', onMove);
        removeEventListener('touchend', onEnd);
        removeEventListener('touchcancel', onEnd);
      };
    }
    return cleanupTouch;
  }, [still]);
  return (
    <div className="glint-layer" aria-hidden="true">
      <div ref={glow} className="touch-glow" />
    </div>
  );
}
