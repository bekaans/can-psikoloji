import { useEffect, useRef } from 'react';

/**
 * En arka katman: yavaş süzülen sade bir zemin, aşağı kaydırdıkça beliren çok şeffaf
 * yansımalar ve dokunmatik ekranda parmağın gittiği yönde beliren parlaklık.
 */
export function Glints({ still }: { still: boolean }) {
  const layer = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = layer.current;
    if (!host || still) return;
    let last = scrollY;
    let acc = 0;
    let active = 0;
    let frame = 0;
    const step = 170;
    const spawn = () => {
      const el = document.createElement('i');
      const size = 50 + Math.random() * 120;
      el.className = 'glint';
      el.style.cssText = `left:${Math.random() * 96}%;top:${8 + Math.random() * 84}%;width:${size}px;height:${size}px`;
      host.appendChild(el);
      active++;
      const spin = (Math.random() - 0.5) * 50;
      const peak = 0.22 + Math.random() * 0.2;
      const anim = el.animate(
        [
          { opacity: 0, transform: `translate(-50%,-50%) scale(0.3) rotate(${-spin}deg)` },
          { opacity: peak, transform: 'translate(-50%,-50%) scale(1) rotate(0deg)', offset: 0.35 },
          { opacity: 0, transform: `translate(-50%,-50%) scale(1.3) rotate(${spin}deg)` },
        ],
        { duration: 2000 + Math.random() * 1400, easing: 'cubic-bezier(.22,1,.36,1)' },
      );
      anim.onfinish = () => {
        el.remove();
        active--;
      };
    };
    const onScroll = () => {
      const dy = scrollY - last;
      last = scrollY;
      acc += Math.abs(dy);
      while (acc > step) {
        acc -= step;
        if (active < 10) spawn();
      }
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          host.style.setProperty('--sy', String(scrollY));
        });
      }
    };
    addEventListener('scroll', onScroll, { passive: true });

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
        target = Math.min(0.75, 0.25 + len * 0.05);
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
    return () => {
      removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
      cleanupTouch();
      host.querySelectorAll('.glint').forEach((n) => n.remove());
    };
  }, [still]);
  return (
    <div ref={layer} className="glint-layer" aria-hidden="true">
      <div ref={glow} className="touch-glow" />
    </div>
  );
}
