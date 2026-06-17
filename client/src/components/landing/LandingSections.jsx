import { useEffect, useRef, useState } from 'react';
import HowItWorksSection from './HowItWorksSection';
import IntelligenceSection from '../ui/section-component';
import './landing.css';

const sections = [
  {
    id: 'sessions',
    title: 'Open sessions',
    body: 'Join live JavaScript, TypeScript, React, or HTML review rooms from the lobby.',
  },
  {
    id: 'contact',
    title: 'Get in touch',
    body: 'Ready to run your next review? Sign in and start a session in under a minute.',
  },
];

function SectionBlock({ section, index }) {
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
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id={section.id}
      className="scroll-mt-20 border-t border-border bg-background px-6 py-20 md:px-16 lg:px-24"
    >
      <div
        className={`landing-section-block mx-auto max-w-3xl${visible ? ' is-visible' : ''}`}
        style={{ animationDelay: `${index * 0.08}s` }}
      >
        <p className="mb-3 font-mono text-sm uppercase tracking-widest text-primary">
          {String(index + 1).padStart(2, '0')}
        </p>
        <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {section.title}
        </h2>
        <p className="text-lg font-light leading-relaxed text-muted-foreground">
          {section.body}
        </p>
      </div>
    </section>
  );
}

export default function LandingSections() {
  return (
    <>
      <HowItWorksSection />
      <SectionBlock key={sections[0].id} section={sections[0]} index={1} />
      <IntelligenceSection />
      <SectionBlock key={sections[1].id} section={sections[1]} index={3} />
    </>
  );
}
