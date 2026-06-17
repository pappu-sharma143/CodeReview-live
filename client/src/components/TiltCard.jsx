import { useRef } from 'react';

export default function TiltCard({ children, className = '', style = {}, intensity = 12, onClick }) {
  const ref = useRef(null);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `
      perspective(900px)
      rotateX(${-y * intensity}deg)
      rotateY(${x * intensity}deg)
      translateY(-4px)
      scale3d(1.02, 1.02, 1.02)
    `;
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0) scale3d(1, 1, 1)';
  };

  return (
    <div
      ref={ref}
      className={`tilt-card ${className}`.trim()}
      style={style}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
    >
      <div className="tilt-card-shine" aria-hidden="true" />
      {children}
    </div>
  );
}
