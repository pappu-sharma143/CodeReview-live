import { useEffect, useRef, useState } from 'react';
import liveEditingImg from '../../assets/live_editing.png';
import livePreviewImg from '../../assets/live_preview_with_content.svg';
import commentsImg from '../../assets/codereview_ui_v4.svg';
import { FeatureCarousel } from './animated-feature-carousel';
import '../landing/landing.css';

const featureCarouselImages = {
  alt: 'CodeReview Live feature screenshot',
  step1img1: liveEditingImg,
  step1img2:
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1740&auto=format&fit=crop',
  step2img1: livePreviewImg,
  step2img2:
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1740&auto=format&fit=crop',
  step3img: commentsImg,
  step4img:
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1740&auto=format&fit=crop',
};

function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

export default function IntelligenceSection() {
  const header = useReveal(0.15);
  const cards = useReveal(0.1);

  return (
    <section
      id="about"
      className="scroll-mt-20 border-t border-border bg-background px-6 py-20 md:px-16 lg:px-24"
    >
      <div className="mx-auto max-w-7xl">
        <div
          ref={header.ref}
          className={`landing-section-block mb-12 max-w-3xl${header.visible ? ' is-visible' : ''}`}
        >
          <p className="mb-3 font-mono text-sm uppercase tracking-widest text-primary">02</p>
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          The Review Room Your Team Needs
          </h2>
          <p className="text-lg font-light leading-relaxed text-muted-foreground">
            Everything you need for a focused code review — editing, previews, and feedback in one
            room.
          </p>
        </div>

        <div
          ref={cards.ref}
          className={`landing-section-block${cards.visible ? ' is-visible' : ''}`}
          style={{ animationDelay: '0.08s' }}
        >
          <FeatureCarousel image={featureCarouselImages} />
        </div>
      </div>
    </section>
  );
}
