import { Component, lazy, Suspense, useEffect, useState } from 'react';
import { canUseWebGL } from '../../lib/webgl';
import HeroFallbackBackground from './HeroFallbackBackground';

const Spline = lazy(() => import('@splinetool/react-spline'));

const SCENE_URL = 'https://prod.spline.design/Slk6b8kz3LRlKiyk/scene.splinecode';

class SplineErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.warn('[Spline] WebGL scene unavailable, using CSS fallback.', error?.message);
  }

  render() {
    if (this.state.failed) {
      return <HeroFallbackBackground />;
    }
    return this.props.children;
  }
}

export default function SplineBackground() {
  const [webglOk, setWebglOk] = useState(null);

  useEffect(() => {
    setWebglOk(canUseWebGL());
  }, []);

  if (webglOk === null || webglOk === false) {
    return <HeroFallbackBackground />;
  }

  return (
    <div className="spline-bg absolute inset-0 overflow-hidden bg-hero-bg">
      <SplineErrorBoundary>
        <Suspense fallback={<HeroFallbackBackground />}>
          <Spline scene={SCENE_URL} className="spline-scene h-full w-full scale-[1.02]" />
        </Suspense>
      </SplineErrorBoundary>
    </div>
  );
}
