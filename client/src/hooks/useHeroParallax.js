import { useEffect, useRef } from 'react';

const LERP = 0.1;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

export default function useHeroParallax() {
  const sectionRef = useRef(null);
  const bgOverlayRef = useRef(null);
  const contentRef = useRef(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const reducedMotionRef = useRef(false);
  const frameRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      reducedMotionRef.current = mq.matches;
    };
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      const el = sectionRef.current;
      if (!el || reducedMotionRef.current) return;

      const rect = el.getBoundingClientRect();
      targetRef.current = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      };
      scheduleFrame();
    };

    const scheduleFrame = () => {
      if (!frameRef.current) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    const tick = () => {
      frameRef.current = null;

      const section = sectionRef.current;
      const overlay = bgOverlayRef.current;
      const content = contentRef.current;

      if (section && overlay && content && !reducedMotionRef.current) {
        const cur = currentRef.current;
        const tgt = targetRef.current;
        cur.x = lerp(cur.x, tgt.x, LERP);
        cur.y = lerp(cur.y, tgt.y, LERP);

        const height = section.offsetHeight || 1;
        const top = section.getBoundingClientRect().top;
        const scrollProgress = Math.min(1, Math.max(0, -top / height));

        overlay.style.opacity = String(round(1 - scrollProgress * 0.4));

        content.style.transform = `translate3d(${round(cur.x * 4)}px, ${round(cur.y * 3 + scrollProgress * 24)}px, 0)`;
        content.style.opacity = String(round(1 - scrollProgress * 0.45));

        const motionActive =
          Math.abs(cur.x - tgt.x) > 0.003 || Math.abs(cur.y - tgt.y) > 0.003;
        const scrollActive = top < 0 && top > -height;

        if (motionActive || scrollActive) {
          scheduleFrame();
        }
      } else if (overlay && content) {
        overlay.style.opacity = '';
        content.style.transform = '';
        content.style.opacity = '';
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('scroll', scheduleFrame, { passive: true });
    scheduleFrame();

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', scheduleFrame);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return { sectionRef, bgOverlayRef, contentRef };
}
