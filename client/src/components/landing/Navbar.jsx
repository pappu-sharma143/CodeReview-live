import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { scrollToSection } from '../../lib/scroll';
import useAppEntryPath from '../../hooks/useAppEntryPath';
import './landing.css';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Sessions', href: '#sessions' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const entryPath = useAppEntryPath();

  const handleNavClick = (e, href) => {
    e.preventDefault();
    scrollToSection(href);
  };

  return (
    <header className="landing-nav fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 lg:px-16">
      <Link to="/" className="text-xl font-semibold tracking-tight text-foreground">
        CodeReview<span className="text-primary">.live</span>
      </Link>

      <nav className="hidden items-center gap-8 md:flex">
        {NAV_LINKS.map(({ label, href }) => (
          <a
            key={href}
            href={href}
            onClick={(e) => handleNavClick(e, href)}
            className="text-sm uppercase tracking-widest text-muted-foreground transition-colors duration-300 ease-out hover:text-foreground"
          >
            {label}
          </a>
        ))}
      </nav>

      <Button variant="navCta" size="lg" className="hidden px-6 md:inline-flex" asChild>
        <Link to={entryPath}>Get Started</Link>
      </Button>
    </header>
  );
}
