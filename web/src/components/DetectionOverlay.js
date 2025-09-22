import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function DetectionOverlay({ detections }) {
  // Group detections by object type for efficient rendering
  const groupedDetections = useMemo(() => {
    const groups = {
      car: [],
      motorcycle: [],
      person: []
    };

    detections.forEach(detection => {
      if (groups[detection.object]) {
        groups[detection.object].push(detection);
      }
    });

    return groups;
  }, [detections]);

  return (
    <group>
      {/* Car detections (Green spheres) */}
      {groupedDetections.car.map((detection, index) => (
        <DetectionSphere
          key={`car-${index}`}
          detection={detection}
          color="#4CAF50"
          size={0.5}
        />
      ))}

      {/* Motorcycle detections (Orange spheres) */}
      {groupedDetections.motorcycle.map((detection, index) => (
        <DetectionSphere
          key={`motorcycle-${index}`}
          detection={detection}
          color="#FF9800"
          size={0.4}
        />
      ))}

      {/* Person detections (Yellow spheres) */}
      {groupedDetections.person.map((detection, index) => (
        <DetectionSphere
          key={`person-${index}`}
          detection={detection}
          color="#FFEB3B"
          size={0.3}
        />
      ))}
    </group>
  );
}

/**
 * Individual detection sphere component
 */
function DetectionSphere({ detection, color, size }) {
  const sphereRef = useRef();
  const confidence = detection.confidence || 0.8;

  // Animate sphere based on detection confidence and time
  useFrame((state) => {
    if (sphereRef.current) {
      const time = state.clock.getElapsedTime();

      // Pulsing effect based on confidence
      const scale = 1 + 0.2 * Math.sin(time * 4) * confidence;
      sphereRef.current.scale.setScalar(scale);

      // Slight floating motion
      sphereRef.current.position.y = detection.position.y + Math.sin(time * 2 + detection.timestamp) * 0.1;
    }
  });

  // Convert detection position to 3D world coordinates
  const worldPosition = useMemo(() => {
    // Scale and position relative to truck
    const x = detection.position.x * 1.5; // Scale for visibility
    const y = detection.position.y  ;  // Offset from ground
    const z =  detection.position.z; 

    return [x, y, z];
  }, [detection.position]);

  return (
    <group position={worldPosition}>
      {/* Main detection sphere */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.8 * confidence}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Confidence indicator ring */}
      <mesh>
        <sphereGeometry args={[size * 1.2, 16, 16]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.1 * confidence}
          wireframe
        />
      </mesh>

      {/* Glow effect for high confidence detections */}
      {confidence > 0.7 && (
        <mesh>
          <sphereGeometry args={[size * 1.5, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.05}
          />
        </mesh>
      )}
    </group>
  );
}
