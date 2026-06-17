export default function HeroFallbackBackground() {
  return (
    <div
      className="hero-fallback pointer-events-none absolute inset-0 overflow-hidden bg-hero-bg"
      aria-hidden="true"
    >
      <div className="hero-fallback-grid" />
      <div className="hero-parallax-orb-wrap hero-parallax-orb-wrap--1">
        <div className="hero-fallback-orb hero-fallback-orb--1" />
      </div>
      <div className="hero-parallax-orb-wrap hero-parallax-orb-wrap--2">
        <div className="hero-fallback-orb hero-fallback-orb--2" />
      </div>
      <div className="hero-parallax-orb-wrap hero-parallax-orb-wrap--3">
        <div className="hero-fallback-orb hero-fallback-orb--3" />
      </div>
      <div className="hero-fallback-glow" />
    </div>
  );
}
