import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import HeroFallbackBackground from './HeroFallbackBackground';
import { scrollToSection } from '../../lib/scroll';

const SplineBackground = lazy(() => import('./SplineBackground'));
import useHeroParallax from '../../hooks/useHeroParallax';
import useAppEntryPath from '../../hooks/useAppEntryPath';
import './landing.css';

const STAGGER = ['0.12s', '0.28s', '0.44s', '0.58s', '0.72s'];

export default function HeroSection() {
  const { sectionRef, bgOverlayRef, contentRef } = useHeroParallax();
  const entryPath = useAppEntryPath();

  const handleScrollClick = (e, href) => {
    e.preventDefault();
    scrollToSection(href);
  };

  return (
    <section
      ref={sectionRef}
      id="features"
      className="landing-hero relative flex min-h-screen items-end bg-hero-bg"
    >
      <Suspense fallback={<HeroFallbackBackground />}>
        <SplineBackground />
      </Suspense>

      <div
        ref={bgOverlayRef}
        className="pointer-events-none absolute inset-0 z-[1] bg-black/30"
      />

      <div
        ref={contentRef}
        className="landing-hero-content relative z-10 w-full max-w-[90%] px-6 pb-10 pt-32 sm:max-w-md md:px-10 md:pb-10 lg:max-w-2xl"
      >
        <h1
          className="landing-hero-item mb-2 text-[clamp(3rem,8vw,6rem)] font-bold uppercase leading-[1.05] tracking-[-0.05em] text-foreground md:mb-4"
          style={{ animationDelay: STAGGER[0] }}
        >
          CodeReview
          <span className="text-primary">.live</span>
        </h1>

        <p
          className="landing-hero-item mb-3 text-[clamp(1.125rem,2.5vw,1.875rem)] font-light text-foreground/80 md:mb-6"
          style={{ animationDelay: STAGGER[1] }}
        >
          We review code together.
        </p>

        <p
          className="landing-hero-item mb-4 text-[clamp(0.875rem,1.5vw,1.25rem)] font-light text-muted-foreground md:mb-8"
          style={{ animationDelay: STAGGER[2] }}
        >
          Real-time collaborative review sessions with live cursors, inline comments,
          and voice notes — built for teams who care about craft, not just speed.
        </p>

        <div
          className="landing-hero-item flex flex-wrap gap-3 font-bold"
          style={{ animationDelay: STAGGER[3] }}
        >
          <Link
            to={entryPath}
            className="pointer-events-auto cursor-pointer rounded-sm bg-primary px-6 py-3 text-sm text-primary-foreground transition-[transform,filter] duration-300 ease-out hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.97] md:px-8 md:py-4"
          >
            Start Reviewing
          </Link>
          <a
            href="#how-it-works"
            onClick={(e) => handleScrollClick(e, '#how-it-works')}
            className="pointer-events-auto cursor-pointer rounded-sm bg-white px-6 py-3 text-sm text-background transition-[transform,filter] duration-300 ease-out hover:brightness-90 hover:-translate-y-0.5 active:scale-[0.97] md:px-8 md:py-4"
          >
            How It Works
          </a>
        </div>
      </div>
    </section>
  );
}
