export default function AppShell({ children }) {
  return (
    <div className="app-shell relative min-h-screen bg-hero-bg font-sora text-foreground antialiased">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="hero-fallback-grid" />
        <div className="hero-fallback-glow" />
        <div className="hero-fallback-orb hero-fallback-orb--1" />
        <div className="hero-fallback-orb hero-fallback-orb--2" />
        <div className="hero-fallback-orb hero-fallback-orb--3" />
      </div>
      <div className="pointer-events-none fixed inset-0 z-[1] bg-black/25" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
