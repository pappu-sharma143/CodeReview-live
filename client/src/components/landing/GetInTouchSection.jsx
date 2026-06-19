import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Send, Shield, Users } from 'lucide-react';
import useAppEntryPath from '../../hooks/useAppEntryPath';
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

function GitHubIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

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
  const entryPath = useAppEntryPath();
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
              Start for free or reach out
            </h3>

            <div className="space-y-3">
              <Link
                to={entryPath}
                className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-background transition-all hover:brightness-95 active:scale-[0.98]"
              >
                <GitHubIcon className="size-5" />
                Continue with GitHub
              </Link>
              <Link
                to={entryPath}
                className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
              >
                <GoogleIcon className="size-5" />
                Continue with Google
              </Link>
            </div>

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or send a message</span>
              <span className="h-px flex-1 bg-border" />
            </div>

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
