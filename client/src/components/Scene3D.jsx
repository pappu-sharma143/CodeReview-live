import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';

const INTENSITY = {
  full: { stars: 2200, shapes: 1, float: 1 },
  lite: { stars: 900, shapes: 0.6, float: 0.7 },
};

function FloatingShape({ position, color, geometry, speed = 1, scale = 1 }) {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.x = t * 0.18 * speed;
    ref.current.rotation.y = t * 0.28 * speed;
    ref.current.rotation.z = t * 0.08 * speed;
  });

  return (
    <Float speed={1.8} rotationIntensity={0.6} floatIntensity={1.2}>
      <mesh ref={ref} position={position} scale={scale}>
        {geometry}
        <meshPhysicalMaterial
          color={color}
          metalness={0.85}
          roughness={0.15}
          transparent
          opacity={0.5}
          emissive={color}
          emissiveIntensity={0.12}
        />
      </mesh>
    </Float>
  );
}

function CodeBracket({ position, scale = 1 }) {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.25;
  });

  const mat = (color, emissive = 0.22) => (
    <meshPhysicalMaterial
      color={color}
      metalness={0.9}
      roughness={0.1}
      emissive={color}
      emissiveIntensity={emissive}
    />
  );

  return (
    <Float speed={2} rotationIntensity={0.25} floatIntensity={0.7}>
      <group ref={ref} position={position} scale={scale}>
        <mesh position={[-0.35, 0, 0]}>
          <boxGeometry args={[0.12, 1.4, 0.12]} />
          {mat('#7c6af7', 0.28)}
        </mesh>
        <mesh position={[-0.15, 0.5, 0]}>
          <boxGeometry args={[0.35, 0.12, 0.12]} />
          {mat('#a78bfa')}
        </mesh>
        <mesh position={[-0.15, -0.5, 0]}>
          <boxGeometry args={[0.35, 0.12, 0.12]} />
          {mat('#a78bfa')}
        </mesh>
        <mesh position={[0.35, 0, 0]}>
          <boxGeometry args={[0.12, 1.4, 0.12]} />
          {mat('#6366f1', 0.28)}
        </mesh>
        <mesh position={[0.15, 0.5, 0]}>
          <boxGeometry args={[0.35, 0.12, 0.12]} />
          {mat('#818cf8')}
        </mesh>
        <mesh position={[0.15, -0.5, 0]}>
          <boxGeometry args={[0.35, 0.12, 0.12]} />
          {mat('#818cf8')}
        </mesh>
      </group>
    </Float>
  );
}

function CursorRing({ position }) {
  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.45, 0.04, 16, 48]} />
        <meshPhysicalMaterial
          color="#34c97a"
          metalness={0.7}
          roughness={0.2}
          emissive="#34c97a"
          emissiveIntensity={0.35}
          transparent
          opacity={0.7}
        />
      </mesh>
    </Float>
  );
}

function SceneContent({ intensity, mouseRef }) {
  const groupRef = useRef();
  const cfg = INTENSITY[intensity] || INTENSITY.full;

  useFrame(() => {
    if (!groupRef.current || !mouseRef.current) return;
    const { x, y } = mouseRef.current;
    groupRef.current.rotation.y += (x * 0.08 - groupRef.current.rotation.y) * 0.04;
    groupRef.current.rotation.x += (-y * 0.05 - groupRef.current.rotation.x) * 0.04;
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.32} />
      <pointLight position={[8, 8, 6]} intensity={1.1} color="#7c6af7" />
      <pointLight position={[-6, -4, 4]} intensity={0.55} color="#6366f1" />
      <spotLight position={[0, 10, 0]} angle={0.4} penumbra={1} intensity={0.35} color="#c4b5fd" />

      <Stars
        radius={90}
        depth={60}
        count={Math.floor(cfg.stars)}
        factor={2.2}
        saturation={0.12}
        fade
        speed={0.35}
      />

      <FloatingShape
        position={[-3.5, 0.5, -3]}
        color="#7c6af7"
        geometry={<icosahedronGeometry args={[0.7 * cfg.shapes, 0]} />}
        speed={0.85}
      />
      <FloatingShape
        position={[4, -0.8, -4]}
        color="#6366f1"
        geometry={<torusGeometry args={[0.5 * cfg.shapes, 0.16, 24, 48]} />}
        speed={0.6}
      />
      <FloatingShape
        position={[0.5, 2.2, -5]}
        color="#a78bfa"
        geometry={<octahedronGeometry args={[0.6 * cfg.shapes]} />}
        speed={1}
        scale={cfg.shapes}
      />
      <CodeBracket position={[-1.2, -0.3, -1.2]} scale={0.85 * cfg.shapes} />
      <CodeBracket position={[2.8, 1.2, -2.5]} scale={0.55 * cfg.shapes} />
      <CursorRing position={[3.5, -1.5, -3]} />
    </group>
  );
}

export default function Scene3D({ intensity = 'full' }) {
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 55 }}
      dpr={[1, Math.min(window.devicePixelRatio, 1.5)]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <SceneContent intensity={intensity} mouseRef={mouseRef} />
    </Canvas>
  );
}
