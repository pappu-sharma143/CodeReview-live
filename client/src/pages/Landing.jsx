import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import LandingSections from '../components/landing/LandingSections';
import LandingFooter from '../components/landing/LandingFooter';
import '../components/landing/landing.css';

export default function Landing() {
  return (
    <div className="landing-page min-h-screen overflow-x-hidden bg-hero-bg font-sora antialiased">
      <Navbar />
      <main>
        <HeroSection />
        <LandingSections />
      </main>
      <LandingFooter />
    </div>
  );
}
