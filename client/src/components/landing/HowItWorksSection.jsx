import { useEffect, useRef, useState } from 'react';
import { Link2, MessageSquare, PlusCircle } from 'lucide-react';
import DisplayCards from '../ui/display-cards';
import './landing.css';

const HOW_IT_WORKS_CARDS = [
  {
    icon: <PlusCircle className="size-5 text-primary" />,
    title: 'Create',
    description: 'Start a live review room',
    date: 'Step 1',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=640&q=80',
    imageAlt: 'Developer writing code on a laptop',
    iconClassName: 'text-primary',
    titleClassName: 'text-primary',
    className:
      "[grid-area:stack] hover:-translate-y-10 before:absolute before:left-0 before:top-0 before:z-[2] before:h-full before:w-full before:rounded-xl before:bg-background/50 before:bg-blend-overlay before:opacity-100 before:outline before:outline-1 before:outline-border before:transition-opacity before:duration-700 before:content-[''] hover:before:opacity-0 grayscale hover:grayscale-0",
  },
  {
    icon: <Link2 className="size-5 text-primary" />,
    title: 'Share',
    description: 'Invite reviewers in one click',
    date: 'Step 2',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=640&q=80',
    imageAlt: 'Team collaborating around a table',
    iconClassName: 'text-primary',
    titleClassName: 'text-primary',
    className:
      "[grid-area:stack] translate-x-16 translate-y-12 hover:-translate-y-1 sm:translate-x-20 before:absolute before:left-0 before:top-0 before:z-[2] before:h-full before:w-full before:rounded-xl before:bg-background/50 before:bg-blend-overlay before:opacity-100 before:outline before:outline-1 before:outline-border before:transition-opacity before:duration-700 before:content-[''] hover:before:opacity-0 grayscale hover:grayscale-0",
  },
  {
    icon: <MessageSquare className="size-5 text-primary" />,
    title: 'Review',
    description: 'Comments, previews & voice notes',
    date: 'Step 3',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=640&q=80',
    imageAlt: 'Code review on multiple monitors',
    iconClassName: 'text-primary',
    titleClassName: 'text-primary',
    className:
      '[grid-area:stack] translate-x-32 translate-y-24 hover:translate-y-10 sm:translate-x-40',
  },
];

export default function HowItWorksSection() {
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
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-t border-border bg-background px-6 py-20 md:px-16 lg:px-24"
    >
      <div className="mx-auto max-w-7xl">
        <div
          ref={ref}
          className={`landing-section-block mb-12 max-w-3xl${visible ? ' is-visible' : ''}`}
        >
          <p className="mb-3 font-mono text-sm uppercase tracking-widest text-primary">01</p>
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            How it works
          </h2>
          <p className="text-lg font-light leading-relaxed text-muted-foreground">
            Create a session, share the room, and review code line-by-line with your team in real
            time.
          </p>
        </div>

        <div className="flex min-h-[28rem] items-center justify-center overflow-visible py-6 sm:min-h-[32rem]">
          <div className="w-full max-w-2xl">
            <DisplayCards cards={HOW_IT_WORKS_CARDS} />
          </div>
        </div>
      </div>
    </section>
  );
}
