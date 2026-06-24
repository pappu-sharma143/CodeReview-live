import { useEffect, useRef, useState } from 'react';
import { Clock, Send, Shield, Users } from 'lucide-react';
import './landing.css';

const FEATURES = [
  {
    icon: Clock,
    text: (
      <>
        Session live in <strong className="font-medium text-foreground">under 60 seconds</strong> —
        no installs
      </>
    ),
  },
  {
    icon: Users,
    text: (
      <>
        Invite reviewers via a{' '}
        <strong className="font-medium text-foreground">single shareable link</strong>
      </>
    ),
  },
  {
    icon: Shield,
    text: (
      <>
        Private, encrypted sessions{' '}
        <strong className="font-medium text-foreground">by default</strong>
      </>
    ),
  },
];

const AVATARS = [
  { className: 'bg-sky-500', label: 'JK' },
  { className: 'bg-emerald-500', label: 'MR' },
  { className: 'bg-violet-500', label: 'AL' },
  { className: 'bg-amber-500', label: '+9' },
];

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

export default function GetInTouchSection() {
  const content = useReveal(0.12);
  const form = useReveal(0.1);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setEmail('');
    setMessage('');
  };

  return (
    <section
      id="contact"
      className="scroll-mt-20 border-t border-border bg-background px-6 py-20 md:px-16 lg:px-24"
    >
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
        <div
          ref={content.ref}
          className={`landing-section-block${content.visible ? ' is-visible' : ''}`}
        >
          <p className="mb-3 font-mono text-sm uppercase tracking-widest text-primary">03</p>
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Get in <span className="text-primary">touch</span>
          </h2>
          <p className="mb-10 text-lg font-light leading-relaxed text-muted-foreground">
            Ready to run your next review? Sign in and start a session in under a minute.
          </p>

          <ul className="mb-10 space-y-5">
            {FEATURES.map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/5">
                  <Icon className="size-4 text-primary" strokeWidth={1.75} />
                </span>
                <p className="pt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-2.5">
              {AVATARS.map(({ className, label }) => (
                <span
                  key={label}
                  className={`flex size-9 items-center justify-center rounded-full border-2 border-background text-[10px] font-semibold text-white ${className}`}
                >
                  {label}
                </span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              <strong className="font-medium text-foreground">120+ engineers</strong> already
              reviewing
            </p>
          </div>
        </div>

        <div
          ref={form.ref}
          className={`landing-section-block${form.visible ? ' is-visible' : ''}`}
          style={{ animationDelay: '0.08s' }}
        >
          <div className="rounded-2xl border border-border bg-secondary/40 p-6 sm:p-8">
            <h3 className="mb-6 text-center text-lg font-semibold text-foreground">
              Send us a message
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="contact-email"
                  className="mb-2 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground"
                >
                  Work email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-input bg-muted/60 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="mb-2 block text-[11px] font-medium uppercase tracking-widest text-muted-foreground"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  placeholder="Tell us about your team or review workflow..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full resize-none rounded-lg border border-input bg-muted/60 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {sent && (
                <p className="text-sm text-primary">Thanks — we&apos;ll be in touch shortly.</p>
              )}

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
              >
                <Send className="size-4" strokeWidth={2.25} />
                Send message
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              We reply within a few hours &bull; No spam, ever
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
