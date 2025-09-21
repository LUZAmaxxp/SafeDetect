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
      {/* Main truck body */}
      <mesh position={[0, truckConfig.height / 2, 0]}>
        <boxGeometry args={[truckConfig.length, truckConfig.height, truckConfig.width]} />
        <meshStandardMaterial color="#4169E1" />
      </mesh>

      {/* Truck cabin */}
      <mesh position={[-2, truckConfig.height + 0.5, 0]}>
        <boxGeometry args={[2, 1.5, truckConfig.width]} />
        <meshStandardMaterial color="#1E40AF" />
      </mesh>

      {/* Front windshield */}
      <mesh position={[-2.9, truckConfig.height + 0.5, 0]}>
        <boxGeometry args={[1.8, 0.8, truckConfig.width + 0.1]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.7} />
      </mesh>

      {/* Wheels */}
      {/* Front wheels */}
      <mesh position={[-3, 0, -1.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[truckConfig.wheelRadius, truckConfig.wheelRadius, truckConfig.wheelWidth, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[-3, 0, 1.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[truckConfig.wheelRadius, truckConfig.wheelRadius, truckConfig.wheelWidth, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Rear wheels */}
      <mesh position={[2, 0, -1.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[truckConfig.wheelRadius, truckConfig.wheelRadius, truckConfig.wheelWidth, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[2, 0, 1.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[truckConfig.wheelRadius, truckConfig.wheelRadius, truckConfig.wheelWidth, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Additional rear wheels for truck */}
      <mesh position={[0, 0, -1.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[truckConfig.wheelRadius, truckConfig.wheelRadius, truckConfig.wheelWidth, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, 0, 1.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[truckConfig.wheelRadius, truckConfig.wheelRadius, truckConfig.wheelWidth, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Side mirrors */}
      <mesh position={[-1.5, truckConfig.height + 0.3, -1.3]}>
        <boxGeometry args={[0.2, 0.3, 0.1]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      <mesh position={[-1.5, truckConfig.height + 0.3, 1.3]}>
        <boxGeometry args={[0.2, 0.3, 0.1]} />
        <meshStandardMaterial color="#444" />
      </mesh>

      {/* Blind spot indicators */}
      <BlindSpotZones truckConfig={truckConfig} />
    </group>
  );
}

/**
 * Visual indicators for blind spot zones
 */
function BlindSpotZones({ truckConfig }) {
  const leftZoneRef = useRef();
  const rightZoneRef = useRef();
  const rearZoneRef = useRef();

  // Animate blind spot zones to make them visible
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const opacity = 0.3 + 0.2 * Math.sin(time * 2);

    if (leftZoneRef.current) {
      leftZoneRef.current.material.opacity = opacity;
    }
    if (rightZoneRef.current) {
      rightZoneRef.current.material.opacity = opacity;
    }
    if (rearZoneRef.current) {
      rearZoneRef.current.material.opacity = opacity;
    }
  });

  return (
    <group>
      {/* Left blind spot zone */}
      <mesh ref={leftZoneRef} position={[-1, 1.5, -3]}>
        <boxGeometry args={[2, 3, 1]} />
        <meshStandardMaterial
          color="#FF4444"
          transparent
          opacity={0.3}
          wireframe
        />
      </mesh>

      {/* Right blind spot zone */}
      <mesh ref={rightZoneRef} position={[-1, 1.5, 3]}>
        <boxGeometry args={[2, 3, 1]} />
        <meshStandardMaterial
          color="#FF4444"
          transparent
          opacity={0.3}
          wireframe
        />
      </mesh>

      {/* Rear blind spot zone */}
      <mesh ref={rearZoneRef} position={[4, 1.5, 0]}>
        <boxGeometry args={[6, 3, 2.5]} />
        <meshStandardMaterial
          color="#FF4444"
          transparent
          opacity={0.3}
          wireframe
        />
      </mesh>
    </group>
  );
}
