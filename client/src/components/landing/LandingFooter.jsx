import { Link } from 'react-router-dom';
import Logo from '../Logo';
import { scrollToSection } from '../../lib/scroll';
import useAppEntryPath from '../../hooks/useAppEntryPath';
import './landing.css';

const FOOTER_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export default function LandingFooter() {
  const entryPath = useAppEntryPath();

  const handleClick = (e, href) => {
    e.preventDefault();
    scrollToSection(href);
  };

  return (
    <footer className="landing-footer border-t border-border bg-hero-bg">
      <div className="landing-footer-inner">
        <div className="landing-footer-top">
          <div className="landing-footer-brand">
            <Logo textClassName="text-lg font-semibold tracking-tight text-foreground" />
            <p className="mt-3 max-w-xs text-sm font-light leading-relaxed text-muted-foreground">
              Real-time collaborative code review for teams who care about craft.
            </p>
          </div>

          <nav className="landing-footer-nav" aria-label="Footer">
            {FOOTER_LINKS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={(e) => handleClick(e, href)}
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="landing-footer-cta">
            <p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">
              Ready to review?
            </p>
            <Link
              to={entryPath}
              className="inline-block rounded-sm bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.97]"
            >
              Get Started
            </Link>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} CodeReview.live — Built for engineers.
          </p>
        </div>
      </div>
    </footer>
  );
}
