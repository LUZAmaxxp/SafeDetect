import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Truck3D() {
  const truckRef = useRef();
  const glowRef = useRef();

  // Truck dimensions (in meters, scaled for visualization)
  const truckConfig = {
    length: 8,
    width: 2.2,
    height: 2.8,
    wheelRadius: 0.4,
    wheelWidth: 0.3,
  };

  // Animate truck with subtle floating motion
  useFrame((state) => {
    if (truckRef.current) {
      const time = state.clock.getElapsedTime();
      truckRef.current.position.y = Math.sin(time * 0.5) * 0.05;
      truckRef.current.rotation.y = Math.sin(time * 0.3) * 0.02;
    }
  });

  return (
    <group ref={truckRef} position={[0, 0, 0]}>
      {/* Ambient glow effect */}
      <mesh ref={glowRef} position={[0, 1, 0]}>
        <sphereGeometry args={[12, 32, 32]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Main truck body - Futuristic metallic */}
      <mesh position={[0, truckConfig.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[truckConfig.length, truckConfig.height, truckConfig.width]} />
        <meshStandardMaterial
          color="#2c3e50"
          metalness={0.8}
          roughness={0.2}
          emissive="#001122"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Truck cabin - Dark tinted glass effect */}
      <mesh position={[-2, truckConfig.height + 0.5, 0]} castShadow>
        <boxGeometry args={[2, 1.5, truckConfig.width]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.9}
          emissive="#00d4ff"
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Front windshield - Advanced glass */}
      <mesh position={[-2.9, truckConfig.height + 0.5, 0]} castShadow>
        <boxGeometry args={[1.8, 0.8, truckConfig.width + 0.1]} />
        <meshPhysicalMaterial
          color="#87CEEB"
          transparent
          opacity={0.3}
          metalness={0.1}
          roughness={0.1}
          transmission={0.9}
          thickness={0.5}
          ior={1.5}
        />
      </mesh>

      {/* Enhanced wheels with metallic rims */}
      <Wheel position={[-3, 0, -1.2]} />
      <Wheel position={[-3, 0, 1.2]} />
      <Wheel position={[2, 0, -1.2]} />
      <Wheel position={[2, 0, 1.2]} />
      <Wheel position={[0, 0, -1.2]} />
      <Wheel position={[0, 0, 1.2]} />

      {/* Side mirrors - Aerodynamic design */}
      <mesh position={[-1.5, truckConfig.height + 0.3, -1.3]} castShadow>
        <boxGeometry args={[0.2, 0.3, 0.1]} />
        <meshStandardMaterial
          color="#34495e"
          metalness={0.7}
          roughness={0.3}
          emissive="#00d4ff"
          emissiveIntensity={0.1}
        />
      </mesh>
      <mesh position={[-1.5, truckConfig.height + 0.3, 1.3]} castShadow>
        <boxGeometry args={[0.2, 0.3, 0.1]} />
        <meshStandardMaterial
          color="#34495e"
          metalness={0.7}
          roughness={0.3}
          emissive="#00d4ff"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* LED accent lights */}
      <mesh position={[3.5, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#ff6b6b" />
      </mesh>
      <mesh position={[-3.5, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#00d4ff" />
      </mesh>

      {/* Enhanced blind spot indicators */}
      <BlindSpotZones truckConfig={truckConfig} />
    </group>
  );
}

/**
 * Enhanced wheel component with metallic materials
 */
function Wheel({ position }) {
  const wheelRef = useRef();

  useFrame((state) => {
    if (wheelRef.current) {
      wheelRef.current.rotation.x = state.clock.getElapsedTime() * 2;
    }
  });

  return (
    <mesh ref={wheelRef} position={position} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
      <meshStandardMaterial
        color="#2c3e50"
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

/**
 * Enhanced visual indicators for blind spot zones with futuristic effects
 */
function BlindSpotZones({ truckConfig }) {
  const leftZoneRef = useRef();
  const rightZoneRef = useRef();
  const rearZoneRef = useRef();
  const gridRef = useRef();

  // Animate blind spot zones with advanced effects
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const pulse = 0.4 + 0.3 * Math.sin(time * 1.5);
    const glow = 0.2 + 0.1 * Math.sin(time * 3);

    // Pulsing opacity effect
    if (leftZoneRef.current) {
      leftZoneRef.current.material.opacity = pulse * 0.6;
      leftZoneRef.current.material.emissiveIntensity = glow;
    }
    if (rightZoneRef.current) {
      rightZoneRef.current.material.opacity = pulse * 0.6;
      rightZoneRef.current.material.emissiveIntensity = glow;
    }
    if (rearZoneRef.current) {
      rearZoneRef.current.material.opacity = pulse * 0.6;
      rearZoneRef.current.material.emissiveIntensity = glow;
    }

    // Grid animation
    if (gridRef.current) {
      gridRef.current.rotation.z = time * 0.1;
    }
  });

  return (
    <group>
      {/* Left blind spot zone - Enhanced */}
      <mesh ref={leftZoneRef} position={[-1, 1.5, -3]} castShadow>
        <boxGeometry args={[2, 3, 1]} />
        <meshStandardMaterial
          color="#ff4757"
          transparent
          opacity={0.4}
          emissive="#ff4757"
          emissiveIntensity={0.2}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>

      {/* Right blind spot zone - Enhanced */}
      <mesh ref={rightZoneRef} position={[-1, 1.5, 3]} castShadow>
        <boxGeometry args={[2, 3, 1]} />
        <meshStandardMaterial
          color="#ff4757"
          transparent
          opacity={0.4}
          emissive="#ff4757"
          emissiveIntensity={0.2}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>

      {/* Rear blind spot zone - Enhanced */}
      <mesh ref={rearZoneRef} position={[4, 1.5, 0]} castShadow>
        <boxGeometry args={[6, 3, 2.5]} />
        <meshStandardMaterial
          color="#ff4757"
          transparent
          opacity={0.4}
          emissive="#ff4757"
          emissiveIntensity={0.2}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>

      {/* Grid overlay effect */}
      <mesh ref={gridRef} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.05}
          wireframe
        />
      </mesh>

      {/* Corner indicators */}
      <mesh position={[-2, 0.5, -4]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#ff6b6b" />
      </mesh>
      <mesh position={[-2, 0.5, 4]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#ff6b6b" />
      </mesh>
      <mesh position={[6, 0.5, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#ff6b6b" />
      </mesh>
    </group>
  );
}
