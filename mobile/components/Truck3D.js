import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder } from '@react-three/drei';
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
      <Box
        args={[truckConfig.length, truckConfig.height, truckConfig.width]}
        position={[0, truckConfig.height / 2, 0]}
      >
        <meshStandardMaterial color="#4169E1" />
      </Box>

      {/* Truck cabin */}
      <Box
        args={[2, 1.5, truckConfig.width]}
        position={[-2, truckConfig.height + 0.5, 0]}
      >
        <meshStandardMaterial color="#1E40AF" />
      </Box>

      {/* Front windshield */}
      <Box
        args={[1.8, 0.8, truckConfig.width + 0.1]}
        position={[-2.9, truckConfig.height + 0.5, 0]}
      >
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.7} />
      </Box>

      {/* Wheels */}
      {/* Front wheels */}
      <Cylinder
        args={[truckConfig.wheelRadius, truckConfig.wheelRadius, truckConfig.wheelWidth, 16]}
        position={[-3, 0, -1.2]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <meshStandardMaterial color="#333" />
      </Cylinder>
      <Cylinder
        args={[truckConfig.wheelRadius, truckConfig.wheelRadius, truckConfig.wheelWidth, 16]}
        position={[-3, 0, 1.2]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <meshStandardMaterial color="#333" />
      </Cylinder>

      {/* Rear wheels */}
      <Cylinder
        args={[truckConfig.wheelRadius, truckConfig.wheelRadius, truckConfig.wheelWidth, 16]}
        position={[2, 0, -1.2]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <meshStandardMaterial color="#333" />
      </Cylinder>
      <Cylinder
        args={[truckConfig.wheelRadius, truckConfig.wheelRadius, truckConfig.wheelWidth, 16]}
        position={[2, 0, 1.2]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <meshStandardMaterial color="#333" />
      </Cylinder>

      {/* Additional rear wheels for truck */}
      <Cylinder
        args={[truckConfig.wheelRadius, truckConfig.wheelRadius, truckConfig.wheelWidth, 16]}
        position={[0, 0, -1.2]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <meshStandardMaterial color="#333" />
      </Cylinder>
      <Cylinder
        args={[truckConfig.wheelRadius, truckConfig.wheelRadius, truckConfig.wheelWidth, 16]}
        position={[0, 0, 1.2]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <meshStandardMaterial color="#333" />
      </Cylinder>

      {/* Side mirrors */}
      <Box
        args={[0.2, 0.3, 0.1]}
        position={[-1.5, truckConfig.height + 0.3, -1.3]}
      >
        <meshStandardMaterial color="#444" />
      </Box>
      <Box
        args={[0.2, 0.3, 0.1]}
        position={[-1.5, truckConfig.height + 0.3, 1.3]}
      >
        <meshStandardMaterial color="#444" />
      </Box>

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
      <Box
        ref={leftZoneRef}
        args={[2, 3, 1]}
        position={[-1, 1.5, -3]}
      >
        <meshStandardMaterial
          color="#FF4444"
          transparent
          opacity={0.3}
          wireframe
        />
      </Box>

      {/* Right blind spot zone */}
      <Box
        ref={rightZoneRef}
        args={[2, 3, 1]}
        position={[-1, 1.5, 3]}
      >
        <meshStandardMaterial
          color="#FF4444"
          transparent
          opacity={0.3}
          wireframe
        />
      </Box>

      {/* Rear blind spot zone */}
      <Box
        ref={rearZoneRef}
        args={[6, 3, 2.5]}
        position={[4, 1.5, 0]}
      >
        <meshStandardMaterial
          color="#FF4444"
          transparent
          opacity={0.3}
          wireframe
        />
      </Box>
    </group>
  );
}
