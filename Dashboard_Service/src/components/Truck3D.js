import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Truck3D() {
  const truckRef = useRef();
  const wheelsRef = useRef([]);

  // Enhanced truck dimensions (in meters, scaled for visualization)
  const truckConfig = {
    length: 10,
    width: 2.5,
    height: 3.2,
    cabinLength: 3,
    cabinHeight: 2.8,
    wheelRadius: 0.5,
    wheelWidth: 0.4,
    bumperHeight: 0.3,
  };

  // Animate wheels rotation
  useFrame((state, delta) => {
    wheelsRef.current.forEach((wheel) => {
      if (wheel) {
        wheel.rotation.x += delta * 2;
      }
    });
  });

  // Enhanced materials
  const materials = useMemo(
    () => ({
      body: new THREE.MeshStandardMaterial({
        color: "#2c5aa0",
        metalness: 0.8,
        roughness: 0.2,
        envMapIntensity: 1,
      }),
      cabin: new THREE.MeshStandardMaterial({
        color: "#1a365d",
        metalness: 0.7,
        roughness: 0.3,
      }),
      chrome: new THREE.MeshStandardMaterial({
        color: "#e2e8f0",
        metalness: 0.9,
        roughness: 0.1,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: "#4a90e2",
        transparent: true,
        opacity: 0.3,
        metalness: 0.1,
        roughness: 0.1,
      }),
      tire: new THREE.MeshStandardMaterial({
        color: "#1a1a1a",
        metalness: 0.1,
        roughness: 0.9,
      }),
      rim: new THREE.MeshStandardMaterial({
        color: "#718096",
        metalness: 0.8,
        roughness: 0.2,
      }),
      lights: new THREE.MeshStandardMaterial({
        color: "#ffd700",
        emissive: "#ffd700",
        emissiveIntensity: 0.5,
      }),
      redLights: new THREE.MeshStandardMaterial({
        color: "#ff4444",
        emissive: "#ff4444",
        emissiveIntensity: 0.3,
      }),
      grille: new THREE.MeshStandardMaterial({
        color: "#2d3748",
        metalness: 0.6,
        roughness: 0.4,
      }),
    }),
    []
  );

  return (
    <group ref={truckRef} position={[0, 0, 0]}>
      {/* Main truck body - Enhanced with rounded edges */}
      <group position={[1, 0, 0]}>
        {/* Main cargo area */}
        <mesh
          position={[0, truckConfig.height / 2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry
            args={[
              truckConfig.length - 3,
              truckConfig.height,
              truckConfig.width,
            ]}
          />
          <primitive object={materials.body} />
        </mesh>

        {/* Cargo area details */}
        <mesh position={[0, truckConfig.height + 0.1, 0]} castShadow>
          <boxGeometry
            args={[truckConfig.length - 3.2, 0.2, truckConfig.width + 0.1]}
          />
          <primitive object={materials.chrome} />
        </mesh>

        {/* Side panels with rivets */}
        <mesh
          position={[0, truckConfig.height / 2, truckConfig.width / 2 + 0.05]}
          castShadow
        >
          <boxGeometry
            args={[truckConfig.length - 3.2, truckConfig.height - 0.2, 0.1]}
          />
          <primitive object={materials.body} />
        </mesh>
        <mesh
          position={[0, truckConfig.height / 2, -truckConfig.width / 2 - 0.05]}
          castShadow
        >
          <boxGeometry
            args={[truckConfig.length - 3.2, truckConfig.height - 0.2, 0.1]}
          />
          <primitive object={materials.body} />
        </mesh>

        {/* Rear doors */}
        <mesh
          position={[truckConfig.length / 2 - 1.5, truckConfig.height / 2, 0]}
          castShadow
        >
          <boxGeometry
            args={[0.2, truckConfig.height - 0.5, truckConfig.width - 0.2]}
          />
          <primitive object={materials.body} />
        </mesh>

        {/* Door handles */}
        <mesh
          position={[truckConfig.length / 2 - 1.4, truckConfig.height / 2, 0.5]}
          castShadow
        >
          <boxGeometry args={[0.1, 0.1, 0.3]} />
          <primitive object={materials.chrome} />
        </mesh>
        <mesh
          position={[
            truckConfig.length / 2 - 1.4,
            truckConfig.height / 2,
            -0.5,
          ]}
          castShadow
        >
          <boxGeometry args={[0.1, 0.1, 0.3]} />
          <primitive object={materials.chrome} />
        </mesh>
      </group>

      {/* Enhanced truck cabin */}
      <group position={[-2.5, 0, 0]}>
        {/* Main cabin body */}
        <mesh
          position={[0, truckConfig.cabinHeight / 2 + 0.2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry
            args={[
              truckConfig.cabinLength,
              truckConfig.cabinHeight,
              truckConfig.width,
            ]}
          />
          <primitive object={materials.cabin} />
        </mesh>

        {/* Cabin roof */}
        <mesh position={[0, truckConfig.cabinHeight + 0.3, 0]} castShadow>
          <boxGeometry
            args={[truckConfig.cabinLength + 0.1, 0.2, truckConfig.width + 0.1]}
          />
          <primitive object={materials.chrome} />
        </mesh>

        {/* Front windshield */}
        <mesh
          position={[-1.4, truckConfig.cabinHeight / 2 + 0.5, 0]}
          castShadow
        >
          <boxGeometry
            args={[0.1, truckConfig.cabinHeight - 0.5, truckConfig.width - 0.2]}
          />
          <primitive object={materials.glass} />
        </mesh>

        {/* Side windows */}
        <mesh
          position={[
            0,
            truckConfig.cabinHeight / 2 + 0.5,
            truckConfig.width / 2,
          ]}
          castShadow
        >
          <boxGeometry
            args={[
              truckConfig.cabinLength - 0.4,
              truckConfig.cabinHeight - 1,
              0.1,
            ]}
          />
          <primitive object={materials.glass} />
        </mesh>
        <mesh
          position={[
            0,
            truckConfig.cabinHeight / 2 + 0.5,
            -truckConfig.width / 2,
          ]}
          castShadow
        >
          <boxGeometry
            args={[
              truckConfig.cabinLength - 0.4,
              truckConfig.cabinHeight - 1,
              0.1,
            ]}
          />
          <primitive object={materials.glass} />
        </mesh>

        {/* Rear cabin window */}
        <mesh position={[1.4, truckConfig.cabinHeight / 2 + 0.5, 0]} castShadow>
          <boxGeometry
            args={[0.1, truckConfig.cabinHeight - 1, truckConfig.width - 0.4]}
          />
          <primitive object={materials.glass} />
        </mesh>

        {/* Door frames */}
        <mesh
          position={[
            0.5,
            truckConfig.cabinHeight / 2,
            truckConfig.width / 2 + 0.05,
          ]}
          castShadow
        >
          <boxGeometry args={[0.1, truckConfig.cabinHeight, 0.1]} />
          <primitive object={materials.chrome} />
        </mesh>
        <mesh
          position={[
            0.5,
            truckConfig.cabinHeight / 2,
            -truckConfig.width / 2 - 0.05,
          ]}
          castShadow
        >
          <boxGeometry args={[0.1, truckConfig.cabinHeight, 0.1]} />
          <primitive object={materials.chrome} />
        </mesh>

        {/* Door handles */}
        <mesh position={[0.3, 1.5, truckConfig.width / 2 + 0.1]} castShadow>
          <boxGeometry args={[0.3, 0.1, 0.1]} />
          <primitive object={materials.chrome} />
        </mesh>
        <mesh position={[0.3, 1.5, -truckConfig.width / 2 - 0.1]} castShadow>
          <boxGeometry args={[0.3, 0.1, 0.1]} />
          <primitive object={materials.chrome} />
        </mesh>
      </group>

      {/* Enhanced front section */}
      <group position={[-4.5, 0, 0]}>
        {/* Front bumper */}
        <mesh position={[0, truckConfig.bumperHeight / 2, 0]} castShadow>
          <boxGeometry
            args={[0.3, truckConfig.bumperHeight, truckConfig.width + 0.2]}
          />
          <primitive object={materials.chrome} />
        </mesh>

        {/* Front grille */}
        <mesh position={[-0.1, 1.5, 0]} castShadow>
          <boxGeometry args={[0.2, 1.2, truckConfig.width - 0.5]} />
          <primitive object={materials.grille} />
        </mesh>

        {/* Grille details */}
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} position={[-0.05, 1.5, -0.8 + i * 0.2]} castShadow>
            <boxGeometry args={[0.1, 1, 0.05]} />
            <primitive object={materials.chrome} />
          </mesh>
        ))}

        {/* Headlights */}
        <mesh position={[-0.1, 1.2, 1]} castShadow>
          <sphereGeometry args={[0.3, 16, 16]} />
          <primitive object={materials.lights} />
        </mesh>
        <mesh position={[-0.1, 1.2, -1]} castShadow>
          <sphereGeometry args={[0.3, 16, 16]} />
          <primitive object={materials.lights} />
        </mesh>

        {/* Turn signals */}
        <mesh position={[-0.1, 0.8, 1.1]} castShadow>
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshStandardMaterial
            color="#ff8800"
            emissive="#ff8800"
            emissiveIntensity={0.3}
          />
        </mesh>
        <mesh position={[-0.1, 0.8, -1.1]} castShadow>
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshStandardMaterial
            color="#ff8800"
            emissive="#ff8800"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>

      {/* Enhanced wheels with rims */}
      <EnhancedWheel
        ref={(el) => (wheelsRef.current[0] = el)}
        position={[-3.5, truckConfig.wheelRadius, -1.4]}
        materials={materials}
        config={truckConfig}
      />
      <EnhancedWheel
        ref={(el) => (wheelsRef.current[1] = el)}
        position={[-3.5, truckConfig.wheelRadius, 1.4]}
        materials={materials}
        config={truckConfig}
      />
      <EnhancedWheel
        ref={(el) => (wheelsRef.current[2] = el)}
        position={[2, truckConfig.wheelRadius, -1.4]}
        materials={materials}
        config={truckConfig}
      />
      <EnhancedWheel
        ref={(el) => (wheelsRef.current[3] = el)}
        position={[2, truckConfig.wheelRadius, 1.4]}
        materials={materials}
        config={truckConfig}
      />
      <EnhancedWheel
        ref={(el) => (wheelsRef.current[4] = el)}
        position={[0.5, truckConfig.wheelRadius, -1.4]}
        materials={materials}
        config={truckConfig}
      />
      <EnhancedWheel
        ref={(el) => (wheelsRef.current[5] = el)}
        position={[0.5, truckConfig.wheelRadius, 1.4]}
        materials={materials}
        config={truckConfig}
      />

      {/* Rear lights */}
      <group position={[4, 0, 0]}>
        <mesh position={[0, 1.5, 1.3]} castShadow>
          <boxGeometry args={[0.1, 0.4, 0.2]} />
          <primitive object={materials.redLights} />
        </mesh>
        <mesh position={[0, 1.5, -1.3]} castShadow>
          <boxGeometry args={[0.1, 0.4, 0.2]} />
          <primitive object={materials.redLights} />
        </mesh>
        <mesh position={[0, 1, 1.3]} castShadow>
          <boxGeometry args={[0.1, 0.3, 0.15]} />
          <meshStandardMaterial
            color="#ff8800"
            emissive="#ff8800"
            emissiveIntensity={0.2}
          />
        </mesh>
        <mesh position={[0, 1, -1.3]} castShadow>
          <boxGeometry args={[0.1, 0.3, 0.15]} />
          <meshStandardMaterial
            color="#ff8800"
            emissive="#ff8800"
            emissiveIntensity={0.2}
          />
        </mesh>
      </group>

      {/* Side mirrors - Enhanced */}
      <EnhancedMirror position={[-1.8, truckConfig.cabinHeight + 0.3, -1.4]} />
      <EnhancedMirror position={[-1.8, truckConfig.cabinHeight + 0.3, 1.4]} />

      {/* Enhanced blind spot zones with better visualization */}
      <BlindSpotZones truckConfig={truckConfig} />

      {/* Exhaust pipes */}
      <mesh position={[-1, 0.5, -1.5]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 2, 12]} />
        <primitive object={materials.chrome} />
      </mesh>
      <mesh position={[-1, 0.5, 1.5]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 2, 12]} />
        <primitive object={materials.chrome} />
      </mesh>

      {/* License plate */}
      <mesh position={[4.1, 1, 0]} castShadow>
        <boxGeometry args={[0.05, 0.3, 0.6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

/**
 * Enhanced wheel component with detailed rim
 */
const EnhancedWheel = React.forwardRef(
  ({ position, materials, config }, ref) => {
    return (
      <group ref={ref} position={position} rotation={[0, 0, Math.PI / 2]}>
        {/* Tire */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry
            args={[
              config.wheelRadius,
              config.wheelRadius,
              config.wheelWidth,
              24,
            ]}
          />
          <primitive object={materials.tire} />
        </mesh>

        {/* Rim */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry
            args={[
              config.wheelRadius - 0.1,
              config.wheelRadius - 0.1,
              config.wheelWidth + 0.05,
              24,
            ]}
          />
          <primitive object={materials.rim} />
        </mesh>

        {/* Rim spokes */}
        {Array.from({ length: 6 }, (_, i) => (
          <mesh
            key={i}
            position={[0, 0, 0]}
            rotation={[0, 0, (i * Math.PI) / 3]}
            castShadow
          >
            <boxGeometry
              args={[0.05, config.wheelRadius - 0.2, config.wheelWidth + 0.1]}
            />
            <primitive object={materials.rim} />
          </mesh>
        ))}

        {/* Center cap */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, config.wheelWidth + 0.1, 16]} />
          <primitive object={materials.chrome} />
        </mesh>
      </group>
    );
  }
);

/**
 * Enhanced side mirror component
 */
function EnhancedMirror({ position }) {
  return (
    <group position={position}>
      {/* Mirror arm */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.3, 0.1, 0.1]} />
        <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Mirror housing */}
      <mesh position={[0.2, 0, 0]} castShadow>
        <boxGeometry args={[0.2, 0.3, 0.15]} />
        <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Mirror glass */}
      <mesh position={[0.25, 0, 0]} castShadow>
        <boxGeometry args={[0.05, 0.25, 0.12]} />
        <meshStandardMaterial
          color="#87ceeb"
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

/**
 * Enhanced blind spot zones with particle effects
 */
function BlindSpotZones({ truckConfig }) {
  const zonesRef = useRef();

  useFrame((state) => {
    if (zonesRef.current) {
      zonesRef.current.children.forEach((zone, index) => {
        zone.material.opacity =
          0.1 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.05;
      });
    }
  });

  return (
    <group ref={zonesRef}>
      {/* Left blind spot zone */}
      <mesh position={[-1, 1.5, -3.5]} castShadow>
        <boxGeometry args={[2, 3, 2]} />
        <meshStandardMaterial
          color="#dc2626"
          transparent
          opacity={0.15}
          metalness={0.1}
          roughness={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Right blind spot zone */}
      <mesh position={[-1, 1.5, 3.5]} castShadow>
        <boxGeometry args={[2, 3, 2]} />
        <meshStandardMaterial
          color="#dc2626"
          transparent
          opacity={0.15}
          metalness={0.1}
          roughness={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Rear blind spot zone */}
      <mesh position={[5.5, 1.5, 0]} castShadow>
        <boxGeometry args={[2, 3, 6]} />
        <meshStandardMaterial
          color="#dc2626"
          transparent
          opacity={0.15}
          metalness={0.1}
          roughness={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Zone boundary lines */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(4, 3, 2)]} />
        <lineBasicMaterial color="#ff4444" transparent opacity={0.6} />
      </lineSegments>
    </group>
  );
}
