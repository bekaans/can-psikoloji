import { useEffect, useRef } from 'react';

/** Aşağı kaydırdıkça rastgele yerlerde beliren küçük ışık yansımaları (en arka katman). */
export function Glints({ still }: { still: boolean }) {
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = layer.current;
    if (!host || still) return;
    let last = scrollY;
    let acc = 0;
    let active = 0;
    const step = 240;
    const spawn = () => {
      const el = document.createElement('i');
      const size = 46 + Math.random() * 90;
      el.className = 'glint';
      el.style.cssText = `left:${Math.random() * 96}%;top:${8 + Math.random() * 84}%;width:${size}px;height:${size}px`;
      host.appendChild(el);
      active++;
      const spin = (Math.random() - 0.5) * 50;
      const anim = el.animate(
        [
          { opacity: 0, transform: `translate(-50%,-50%) scale(0.3) rotate(${-spin}deg)` },
          { opacity: 1, transform: 'translate(-50%,-50%) scale(1) rotate(0deg)', offset: 0.35 },
          { opacity: 0, transform: `translate(-50%,-50%) scale(1.3) rotate(${spin}deg)` },
        ],
        { duration: 1700 + Math.random() * 1000, easing: 'cubic-bezier(.22,1,.36,1)' },
      );
      anim.onfinish = () => {
        el.remove();
        active--;
      };
    };
    const onScroll = () => {
      acc += Math.abs(scrollY - last);
      last = scrollY;
      while (acc > step) {
        acc -= step;
        if (active < 8) spawn();
      }
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => {
      removeEventListener('scroll', onScroll);
      host.replaceChildren();
    };
  }, [still]);
  return <div ref={layer} className="glint-layer" aria-hidden="true" />;
}
