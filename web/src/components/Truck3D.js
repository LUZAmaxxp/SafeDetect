import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Truck3D() {
  const truckRef = useRef();

  // Truck dimensions (in meters, scaled for visualization)
  const truckConfig = {
    length: 8,
    width: 2.2,
    height: 2.8,
    wheelRadius: 0.4,
    wheelWidth: 0.3,
  };

  return (
    <group ref={truckRef} position={[0, 0, 0]}>
      {/* Main truck body - Simple metallic */}
      <mesh position={[0, truckConfig.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[truckConfig.length, truckConfig.height, truckConfig.width]} />
        <meshStandardMaterial
          color="#4a5568"
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>

      {/* Truck cabin - Simple tinted */}
      <mesh position={[-2, truckConfig.height + 0.5, 0]} castShadow>
        <boxGeometry args={[2, 1.5, truckConfig.width]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.5}
          roughness={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Front windshield - Simple glass */}
      <mesh position={[-2.9, truckConfig.height + 0.5, 0]} castShadow>
        <boxGeometry args={[1.8, 0.8, truckConfig.width + 0.1]} />
        <meshStandardMaterial
          color="#87CEEB"
          transparent
          opacity={0.3}
          metalness={0.1}
          roughness={0.1}
        />
      </mesh>

      {/* Simple wheels */}
      <Wheel position={[-3, 0, -1.2]} />
      <Wheel position={[-3, 0, 1.2]} />
      <Wheel position={[2, 0, -1.2]} />
      <Wheel position={[2, 0, 1.2]} />
      <Wheel position={[0, 0, -1.2]} />
      <Wheel position={[0, 0, 1.2]} />

      {/* Side mirrors - Simple */}
      <mesh position={[-1.5, truckConfig.height + 0.3, -1.3]} castShadow>
        <boxGeometry args={[0.2, 0.3, 0.1]} />
        <meshStandardMaterial
          color="#34495e"
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[-1.5, truckConfig.height + 0.3, 1.3]} castShadow>
        <boxGeometry args={[0.2, 0.3, 0.1]} />
        <meshStandardMaterial
          color="#34495e"
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>

      {/* Simple blind spot indicators */}
      <BlindSpotZones truckConfig={truckConfig} />
    </group>
  );
}

/**
 * Simple wheel component
 */
function Wheel({ position }) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
      <meshStandardMaterial
        color="#2c3e50"
        metalness={0.5}
        roughness={0.5}
      />
    </mesh>
  );
}

/**
 * Simple visual indicators for blind spot zones
 */
function BlindSpotZones({ truckConfig }) {
  return (
    <group>
      {/* Left blind spot zone */}
      <mesh position={[-1, 1.5, -3]} castShadow>
        <boxGeometry args={[2, 3, 1]} />
        <meshStandardMaterial
          color="#dc2626"
          transparent
          opacity={0.3}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>

      {/* Right blind spot zone */}
      <mesh position={[-1, 1.5, 3]} castShadow>
        <boxGeometry args={[2, 3, 1]} />
        <meshStandardMaterial
          color="#dc2626"
          transparent
          opacity={0.3}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>

      {/* Rear blind spot zone */}
      <mesh position={[4, 1.5, 0]} castShadow>
        <boxGeometry args={[6, 3, 2.5]} />
        <meshStandardMaterial
          color="#dc2626"
          transparent
          opacity={0.3}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>
    </group>
  );
}
