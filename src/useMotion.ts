import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import Lenis from 'lenis';
gsap.registerPlugin(ScrollTrigger, SplitText, ScrollToPlugin);

/** Bağlantılar için JS ile yönetilen kaydırma; tarayıcının smooth scroll'una bağlı kalmaz. */
export function scrollToId(id: string, instant = false) {
  const target = document.getElementById(id);
  if (!target) return;
  gsap.to(window, {
    duration: instant ? 0 : 1.1,
    scrollTo: { y: target, offsetY: 80, autoKill: false },
    ease: 'power3.inOut',
    overwrite: true,
  });
  history.replaceState(null, '', '#' + id);
}

const HEADINGS =
  '.hero h1, .section-heading h2, .pause-copy h2, .journey-section h2, .contact-heading h2';

export function useMotion(ready: boolean, reduced: boolean) {
  useEffect(() => {
    if (!ready || reduced) return;
    const mm = gsap.matchMedia();
    let lenis: Lenis | undefined;
    mm.add('(min-width: 900px) and (pointer: fine)', () => {
      gsap.utils.toArray<HTMLElement>('.service-art').forEach((el, i) => {
        gsap.fromTo(
          el,
          { rotation: i % 2 ? -18 : 18 },
          {
            rotation: i % 2 ? 28 : -28,
            ease: 'none',
            scrollTrigger: {
              trigger: '.services-section',
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.5,
            },
          },
        );
      });
      lenis = new Lenis({ lerp: 0.075, smoothWheel: true, wheelMultiplier: 0.9, anchors: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.lagSmoothing(0);
      const tick = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(tick);

      // Kaydırma hızına göre yumuşak eğim: içerik akışkan hissi verir.
      const skewTargets = gsap.utils.toArray<HTMLElement>('.services-grid, .team-grid');
      const skewTo = skewTargets.map((el) =>
        gsap.quickTo(el, 'skewY', { duration: 0.6, ease: 'power3.out' }),
      );
      lenis.on('scroll', ({ velocity }: { velocity: number }) => {
        const v = gsap.utils.clamp(-0.8, 0.8, velocity * 0.035);
        skewTo.forEach((to) => to(v));
      });

      // Yumuşak imleç halkası.
      const ring = document.createElement('div');
      ring.className = 'cursor-ring';
      ring.setAttribute('aria-hidden', 'true');
      document.body.appendChild(ring);
      const rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3.out' });
      const ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3.out' });
      const onMove = (e: PointerEvent) => {
        ring.classList.add('on');
        rx(e.clientX);
        ry(e.clientY);
        ring.classList.toggle(
          'hot',
          !!(e.target as HTMLElement).closest?.('a, button, [role="button"]'),
        );
      };
      const onLeave = () => ring.classList.remove('on');
      window.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);

      // Manyetik düğmeler.
      const cleanups: Array<() => void> = [];
      gsap.utils
        .toArray<HTMLElement>('.button, .header-appointment, .expand-button, .circle-arrow')
        .forEach((el) => {
          const mx = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3.out' });
          const my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
          const move = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            mx((e.clientX - (r.left + r.width / 2)) * 0.18);
            my((e.clientY - (r.top + r.height / 2)) * 0.18);
          };
          const reset = () => {
            mx(0);
            my(0);
          };
          el.addEventListener('pointermove', move);
          el.addEventListener('pointerleave', reset);
          cleanups.push(() => {
            el.removeEventListener('pointermove', move);
            el.removeEventListener('pointerleave', reset);
          });
        });

      // Hizmet ve uzman kartlarında 3B eğim.
      gsap.utils.toArray<HTMLElement>('.service-card, .team-card').forEach((el) => {
        gsap.set(el, { transformPerspective: 900 });
        const rX = gsap.quickTo(el, 'rotationX', { duration: 0.7, ease: 'power3.out' });
        const rY = gsap.quickTo(el, 'rotationY', { duration: 0.7, ease: 'power3.out' });
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          rY(((e.clientX - r.left) / r.width - 0.5) * 4);
          rX(-((e.clientY - r.top) / r.height - 0.5) * 4);
        };
        const reset = () => {
          rX(0);
          rY(0);
        };
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerleave', reset);
        cleanups.push(() => {
          el.removeEventListener('pointermove', move);
          el.removeEventListener('pointerleave', reset);
        });
      });

      // Ana görselde fare paralaksı.
      const hero = document.querySelector<HTMLElement>('.hero');
      if (hero) {
        const px = gsap.quickTo('.hero-photo', 'x', { duration: 1.2, ease: 'power3.out' });
        const cx = gsap.quickTo('.hero-copy', 'x', { duration: 1.6, ease: 'power3.out' });
        const heroMove = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          px(nx * -22);
          cx(nx * 8);
        };
        hero.addEventListener('pointermove', heroMove);
        cleanups.push(() => hero.removeEventListener('pointermove', heroMove));
      }
      // Kaydırmaya bağlı sahneler: ana sayfadan çıkış.
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
        })
        .to('.hero-copy', { yPercent: -14, opacity: 0.15 }, 0)
        .to('.hero-image-frame', { scale: 0.9, yPercent: 6, transformOrigin: '50% 100%' }, 0);
      // Ara bölüm sabitlenir; halkalar genişler, başlık büyür.
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: '.pause-section',
            start: 'center center',
            end: '+=110%',
            pin: true,
            scrub: 1,
            anticipatePin: 1,
          },
        })
        .fromTo('.pause-photo', { scale: 1.25 }, { scale: 1 }, 0)
        .fromTo('.pause-copy h2', { yPercent: 30, opacity: 0.2 }, { yPercent: 0, opacity: 1 }, 0);
      // Hizmet kartları kenarlardan merkeze kayarak birleşir.
      gsap.utils.toArray<HTMLElement>('.service-card').forEach((el, i) =>
        gsap.fromTo(
          el,
          { x: (i % 4) * 70 - 105, rotate: (i % 4) * 2 - 3 },
          {
            x: 0,
            rotate: 0,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 105%', end: 'top 55%', scrub: 1 },
          },
        ),
      );
      // Görsellerde kaydırmayla açılan maske.
      gsap.utils
        .toArray<HTMLElement>('.hero-image-frame, .gallery-main, .team-photo')
        .forEach((el) =>
          gsap.fromTo(
            el,
            { clipPath: 'inset(9% 6% 9% 6% round 28px)' },
            {
              clipPath: 'inset(0% 0% 0% 0% round 28px)',
              ease: 'none',
              scrollTrigger: { trigger: el, start: 'top 98%', end: 'top 45%', scrub: 0.8 },
              onComplete: () => gsap.set(el, { clearProps: 'clipPath' }),
            },
          ),
        );
      // 3B derinlik: kart ızgaraları öne doğru devrilerek yerine oturur.
      gsap.utils.toArray<HTMLElement>('.services-grid, .team-grid').forEach((el) =>
        gsap.fromTo(
          el,
          { rotationX: 24, y: 70, transformPerspective: 1200, transformOrigin: '50% 100%' },
          {
            rotationX: 0,
            y: 0,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 100%', end: 'top 45%', scrub: 1 },
          },
        ),
      );
      // Ana görsel fareyle 3B eğilir.
      const frame = document.querySelector<HTMLElement>('.hero-image-frame');
      if (frame) {
        gsap.set(frame, { transformPerspective: 1100 });
        const fY = gsap.quickTo(frame, 'rotationY', { duration: 0.9, ease: 'power3.out' });
        const fX = gsap.quickTo(frame, 'rotationX', { duration: 0.9, ease: 'power3.out' });
        const frameMove = (e: PointerEvent) => {
          fY((e.clientX / window.innerWidth - 0.5) * 9);
          fX(-(e.clientY / window.innerHeight - 0.5) * 7);
        };
        window.addEventListener('pointermove', frameMove, { passive: true });
        cleanups.push(() => window.removeEventListener('pointermove', frameMove));
      }
      const pause = () => {
        if (document.querySelector('dialog[open]')) lenis?.stop();
        else lenis?.start();
      };
      const observer = new MutationObserver(pause);
      observer.observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ['open'],
      });
      return () => {
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33);
        window.removeEventListener('pointermove', onMove);
        document.documentElement.removeEventListener('pointerleave', onLeave);
        ring.remove();
        cleanups.forEach((fn) => fn());
        gsap.set([...skewTargets], { clearProps: 'skewY' });
        observer.disconnect();
        lenis?.destroy();
        lenis = undefined;
      };
    });
    // Telefon: yalnızca transform / opaklık; pin, maske ve imleç yok, böylece akıcı kalır.
    mm.add('(max-width: 899px), (pointer: coarse)', () => {
      const onAnchor = (e: MouseEvent) => {
        const a = (e.target as HTMLElement).closest?.('a[href^="#"]');
        const id = a?.getAttribute('href')?.slice(1);
        if (!id || e.defaultPrevented || !document.getElementById(id)) return;
        e.preventDefault();
        scrollToId(id);
      };
      document.addEventListener('click', onAnchor);
      const trig = (trigger: Element | string, start: string, end: string) => ({
        trigger,
        start,
        end,
        scrub: 0.5,
      });
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: trig('.hero', 'top top', 'bottom top'),
        })
        .to('.hero-copy', { yPercent: -10, opacity: 0.25 }, 0)
        .to('.hero-image-frame', { scale: 0.92, yPercent: 4 }, 0);
      gsap.utils
        .toArray<HTMLElement>('.gallery-main, .team-photo')
        .forEach((el) =>
          gsap.fromTo(
            el,
            { scale: 0.9, opacity: 0.5 },
            { scale: 1, opacity: 1, ease: 'none', scrollTrigger: trig(el, 'top 100%', 'top 55%') },
          ),
        );
      gsap.utils
        .toArray<HTMLElement>('.services-grid, .team-grid')
        .forEach((el) =>
          gsap.fromTo(
            el,
            { rotationX: 14, transformPerspective: 900, transformOrigin: '50% 100%' },
            { rotationX: 0, ease: 'none', scrollTrigger: trig(el, 'top 100%', 'top 55%') },
          ),
        );
      gsap.utils
        .toArray<HTMLElement>('.service-card')
        .forEach((el) =>
          gsap.fromTo(
            el,
            { scale: 0.92, y: 40 },
            { scale: 1, y: 0, ease: 'none', scrollTrigger: trig(el, 'top 100%', 'top 60%') },
          ),
        );
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: trig('.pause-section', 'top bottom', 'bottom top'),
        })
        .fromTo('.pause-photo', { scale: 1.2 }, { scale: 1 }, 0)
        .fromTo('.pause-copy h2', { yPercent: 20, opacity: 0.2 }, { yPercent: 0, opacity: 1 }, 0);
      gsap.utils
        .toArray<HTMLElement>('.about-details, .values-row > *, .faq-item, .contact-info')
        .forEach((el) =>
          gsap.fromTo(
            el,
            { y: 30, opacity: 0.2 },
            { y: 0, opacity: 1, ease: 'none', scrollTrigger: trig(el, 'top 100%', 'top 70%') },
          ),
        );
      return () => document.removeEventListener('click', onAnchor);
    });
    const ctx = gsap.context(() => {
      gsap.from('.hero-copy > *', {
        opacity: 0,
        y: 32,
        duration: 1.05,
        stagger: 0.11,
        ease: 'power3.out',
      });
      gsap.from('.hero-visual', {
        opacity: 0,
        scale: 0.95,
        y: 35,
        duration: 1.35,
        ease: 'power3.out',
        delay: 0.15,
      });
      gsap.to('.scroll-progress', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
        },
      });
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) =>
        gsap.from(el, {
          y: 35,
          opacity: 0,
          duration: 0.85,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 98%', end: 'top 62%', scrub: 0.9 },
        }),
      );
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) =>
        gsap.fromTo(
          el,
          { yPercent: -5, scale: 1.13 },
          {
            yPercent: 5,
            scale: 1.13,
            ease: 'none',
            scrollTrigger: {
              trigger: el.parentElement,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
          },
        ),
      );
      gsap.utils.toArray<HTMLElement>('.story-word').forEach((el, i) =>
        gsap.to(el, {
          color: '#253b30',
          scrollTrigger: {
            trigger: '.manifesto',
            start: `top ${76 - i * 2.3}%`,
            end: `top ${66 - i * 2.3}%`,
            scrub: 1,
          },
        }),
      );
      // Yolculuk adımları kaydırdıkça aydınlanır.
      gsap.utils.toArray<HTMLElement>('.journey-step').forEach((el) =>
        gsap.fromTo(
          el,
          { opacity: 0.28, y: 24 },
          {
            opacity: 1,
            y: 0,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 52%', scrub: 0.7 },
          },
        ),
      );
      // Hizmet kartları dalga gibi sırayla belirir.
      gsap.utils.toArray<HTMLElement>('.service-card').forEach((el, i) =>
        gsap.from(el, {
          y: 70 + (i % 3) * 25,
          duration: 1.2,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 100%', end: 'top 60%', scrub: 1 },
        }),
      );
    });
    // Başlıklar satır satır maskeyle yükselir.
    let cancelled = false;
    const textCtx = gsap.context(() => {});
    document.fonts.ready.then(() => {
      if (cancelled) return;
      textCtx.add(() => {
        gsap.utils.toArray<HTMLElement>(HEADINGS).forEach((el) => {
          const isHero = el.closest('.hero');
          SplitText.create(el, {
            type: 'lines',
            mask: 'lines',
            autoSplit: true,
            linesClass: 'split-line',
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 115,
                duration: 1.1,
                ease: isHero ? 'power4.out' : 'none',
                stagger: 0.09,
                delay: isHero ? 0.1 : 0,
                scrollTrigger: isHero
                  ? undefined
                  : { trigger: el, start: 'top 95%', end: 'top 50%', scrub: 0.9 },
              }),
          });
        });
      });
      ScrollTrigger.refresh();
    });
    const refresh = () => ScrollTrigger.refresh();
    document.fonts.ready.then(refresh);
    // Not: görsellerin her yüklenişinde refresh çağrılmaz; kaydırma konumunu sıfırlayıp
    // bağlantı kaydırmalarını yarıda keserdi. Görsellerin width/height değerleri yer ayırır.
    return () => {
      cancelled = true;
      textCtx.revert();
      ctx.revert();
      mm.revert();
    };
  }, [ready, reduced]);
}
