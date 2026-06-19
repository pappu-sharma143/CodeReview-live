import { Suspense, useEffect, useState } from 'react';
import Scene3D from './Scene3D';
import { canUseWebGL } from '../lib/webgl';

/**
 * variant:
 * - immersive — full WebGL scene (auth, lobby)
 * - ambient   — CSS grid + glow orbs only (profile)
 * - flat      — solid dark bg (fallback / reduced motion)
 */
export default function PremiumBackground({
  children,
  className = '',
  variant = 'immersive',
}) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    setWebglOk(canUseWebGL());
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const show3d = variant === 'immersive' && !reducedMotion && webglOk;
  const showAmbient = variant === 'ambient' || (variant === 'immersive' && (reducedMotion || !webglOk));

  return (
    <div className={`premium-page premium-page--${variant} ${className}`.trim()}>
      {show3d && (
        <Suspense fallback={null}>
          <Scene3D intensity={variant === 'immersive' ? 'full' : 'lite'} />
        </Suspense>
      )}

      {showAmbient && (
        <>
          <div className="premium-grid-bg" aria-hidden="true" />
          <div className="premium-orb premium-orb--1" aria-hidden="true" />
          <div className="premium-orb premium-orb--2" aria-hidden="true" />
          <div className="premium-orb premium-orb--3" aria-hidden="true" />
        </>
      )}

      <div className="premium-overlay" aria-hidden="true" />
      <div className="premium-grain" aria-hidden="true" />
      <div className="premium-content">{children}</div>
    </div>
  );
}
