import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function Globe() {
  const group = useRef<THREE.Group>(null);
  const dots = useRef<THREE.Points>(null);

  const dotGeometry = useMemo(() => {
    const positions: number[] = [];
    const count = 2600;
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = i * 2.399963;
      positions.push(Math.cos(theta) * radius * 1.55, y * 1.55, Math.sin(theta) * radius * 1.55);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return g;
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (group.current) group.current.rotation.y += dt * 0.12;
    if (dots.current) dots.current.rotation.y -= dt * 0.05;
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial color="#0a2a44" transparent opacity={0.55} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.52, 26, 18]} />
        <meshBasicMaterial color="#3fd8ff" wireframe transparent opacity={0.22} />
      </mesh>
      <points ref={dots} geometry={dotGeometry}>
        <pointsMaterial color="#8ee9ff" size={0.022} sizeAttenuation transparent opacity={0.9} />
      </points>
      <mesh>
        <sphereGeometry args={[1.75, 32, 32]} />
        <meshBasicMaterial
          color="#2bb8ff"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

function Ring({
  radius,
  speed,
  tilt,
  thickness = 0.01,
  opacity = 0.7,
}: {
  radius: number;
  speed: number;
  tilt: [number, number, number];
  thickness?: number;
  opacity?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += Math.min(delta, 0.05) * speed;
  });
  return (
    <mesh ref={ref} rotation={tilt}>
      <torusGeometry args={[radius, thickness, 8, 128]} />
      <meshBasicMaterial color="#5fdcff" transparent opacity={opacity} />
    </mesh>
  );
}

function Particles() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const pos: number[] = [];
    for (let i = 0; i < 400; i++) {
      const r = 2.2 + Math.random() * 2.4;
      const a = Math.random() * Math.PI * 2;
      pos.push(Math.cos(a) * r, (Math.random() - 0.5) * 3.4, Math.sin(a) * r);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += Math.min(delta, 0.05) * 0.08;
      const m = ref.current.material as THREE.PointsMaterial;
      m.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 1.4) * 0.25;
    }
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#bff2ff" size={0.03} transparent opacity={0.6} />
    </points>
  );
}

export function CoreCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 6.4], fov: 50 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.8} />
      <Globe />
      <Ring radius={2.15} speed={0.4} tilt={[1.35, 0.2, 0]} thickness={0.012} />
      <Ring radius={2.5} speed={-0.28} tilt={[1.15, -0.4, 0.5]} thickness={0.008} opacity={0.5} />
      <Ring radius={2.9} speed={0.18} tilt={[1.5, 0.1, 0.9]} thickness={0.006} opacity={0.38} />
      <Particles />
    </Canvas>
  );
}
