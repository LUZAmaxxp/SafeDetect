import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import WebSocketService from './services/WebSocketService';
import Truck3D from './components/Truck3D';
import DetectionOverlay from './components/DetectionOverlay';
import Header from './components/Header/Header';
import StatusDashboard from './components/StatusDashboard/StatusDashboard';
import DetectionPanel from './components/DetectionPanel/DetectionPanel';
import Alert from './components/ui/Alert';
import SettingsModal from './components/Settings/SettingsModal';
import './App.css';

export default function App() {
  const [detections, setDetections] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [alertActive, setAlertActive] = useState(false);
  const [fps, setFps] = useState(0);
  // Default to the current browser host so the app works out-of-the-box in
  // Docker (served from the same machine) and in local dev (localhost).
  const [serverIP, setServerIP] = useState(
    typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost'
  );
  const [showSettings, setShowSettings] = useState(false);
  const [pendingIP, setPendingIP] = useState('');
  const [cameraView, setCameraView] = useState('default');
  const wsService = useRef(null);
  const cameraRef = useRef(null);
  // Rolling window of message timestamps for real FPS calculation
  const fpsTimestamps = useRef([]);

  useEffect(() => {
    // Initialize WebSocket service
    wsService.current = new WebSocketService(`ws://${serverIP}:8081`);

    // Set up event listeners
    wsService.current.on('connected', () => {
      setIsConnected(true);
      setConnectionStatus('Connected');
    });

    wsService.current.on('disconnected', () => {
      setIsConnected(false);
      setConnectionStatus('Disconnected');
    });

    wsService.current.on('detections', (data) => {
      const incoming = data.detections || [];
      setDetections(incoming);

      // --- Real FPS: count messages received in the last second ---
      const now = Date.now();
      fpsTimestamps.current.push(now);
      fpsTimestamps.current = fpsTimestamps.current.filter(t => now - t <= 1000);
      setFps(fpsTimestamps.current.length);

      // --- Alert logic: use camera_zone sent by the Python backend ---
      // The Kafka message includes a `camera_zone` field ('left'|'right'|'rear').
      const blindSpotObjects = incoming.filter(
        d => d.camera_zone && ['left', 'right', 'rear'].includes(d.camera_zone)
      );
      if (blindSpotObjects.length > 0 && !alertActive) {
        triggerAlert();
      }
    });

    wsService.current.on('error', (error) => {
      setConnectionStatus(`Error: ${error.message}`);
    });

    // Connect to WebSocket server
    wsService.current.connect();

    // Cleanup on unmount
    return () => {
      if (wsService.current) {
        wsService.current.disconnect();
      }
    };
  }, [serverIP]);

  // Update camera position when view changes
  useEffect(() => {
    if (cameraRef.current) {
      const position = getCameraPosition();
      const target = getCameraTarget();

      cameraRef.current.position.set(position[0], position[1], position[2]);
      cameraRef.current.lookAt(target[0], target[1], target[2]);
      cameraRef.current.updateProjectionMatrix();

      setTimeout(() => {
        if (cameraRef.current) {
          cameraRef.current.updateProjectionMatrix();
        }
      }, 100);
    }
  }, [cameraView]);

  const triggerAlert = async () => {
    setAlertActive(true);

    try {
      if (navigator.vibrate) {
        navigator.vibrate([0, 500, 200, 500, 200, 500]);
      }

      setTimeout(() => {
        setAlertActive(false);
      }, 3000);
    } catch (error) {
      console.error('Error triggering alert:', error);
    }
  };

  const getObjectColor = (objectType) => {
    switch (objectType) {
      case 'car': return '#4CAF50';
      case 'motorcycle': return '#FF9800';
      case 'person': return '#FFEB3B';
      default: return '#9E9E9E';
    }
  };

  const getObjectEmoji = (objectType) => {
    switch (objectType) {
      case 'car': return '🚗';
      case 'motorcycle': return '🏍️';
      case 'person': return '🚶';
      default: return '❓';
    }
  };

  const reconnect = () => {
    if (wsService.current) {
      wsService.current.disconnect();
    }
    wsService.current = new WebSocketService(`ws://${serverIP}:8081`);
    wsService.current.on('connected', () => {
      setIsConnected(true);
      setConnectionStatus('Connected');
    });
    wsService.current.on('disconnected', () => {
      setIsConnected(false);
      setConnectionStatus('Disconnected');
    });
    wsService.current.on('detections', (data) => {
      const incoming = data.detections || [];
      setDetections(incoming);

      const now = Date.now();
      fpsTimestamps.current.push(now);
      fpsTimestamps.current = fpsTimestamps.current.filter(t => now - t <= 1000);
      setFps(fpsTimestamps.current.length);

      const blindSpotObjects = incoming.filter(
        d => d.camera_zone && ['left', 'right', 'rear'].includes(d.camera_zone)
      );
      if (blindSpotObjects.length > 0 && !alertActive) {
        triggerAlert();
      }
    });
    wsService.current.on('error', (error) => {
      setConnectionStatus(`Error: ${error.message}`);
    });
    wsService.current.connect();
  };

  const switchToDefaultView = () => setCameraView('default');
  const switchToRearView = () => setCameraView('rear');
  const switchToLeftView = () => setCameraView('left');
  const switchToRightView = () => setCameraView('right');

  const getCameraPosition = () => {
    switch (cameraView) {
      case 'rear': return [-10, 5, 0];
      case 'left': return [0, 5, -15];
      case 'right': return [0, 5, 15];
      default: return [10, 5, 10];
    }
  };

  const getCameraTarget = () => {
    return [0, 0, 0];
  };

  return (
    <div className="app">
      {/* Header Component */}
      <Header
        isConnected={isConnected}
        serverIP={serverIP}
        onReconnect={reconnect}
        onSettings={() => { setPendingIP(serverIP); setShowSettings(s => !s); }}
        cameraView={cameraView}
        onCameraChange={setCameraView}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentIP={serverIP}
        onSave={(newIP) => setServerIP(newIP)}
      />

      {/* Status Dashboard Component */}
      <StatusDashboard
        objectCount={detections.length}
        fps={fps}
        alertActive={alertActive}
        connectionStatus={connectionStatus}
      />

      {/* Alert Component */}
      <Alert
        type="danger"
        title="BLIND SPOT ALERT!"
        icon="🚨"
        visible={alertActive}
      >
        Obstacle detected in blind spot zone
      </Alert>

      {/* 3D Scene */}
      <div className="scene-container">
        <Canvas
          camera={{ position: getCameraPosition(), fov: 60 }}
          shadows
          onCreated={({ camera, gl, scene }) => {
            cameraRef.current = camera;
            gl.setClearColor('#0f0f23', 1);
          }}
        >
          <ambientLight intensity={0.3} color="#4a90e2" />
          <directionalLight
            position={[10, 10, 5]}
            intensity={2}
            color="#ffffff"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-10, 5, -10]} intensity={1} color="#00d4ff" />
          <pointLight position={[10, 5, 10]} intensity={0.8} color="#ff6b6b" />
          <spotLight
            position={[0, 15, 0]}
            angle={0.3}
            penumbra={1}
            intensity={1}
            color="#ffffff"
            castShadow
          />

         

          <Truck3D detections={detections} />
          <DetectionOverlay detections={detections} />

          <OrbitControls
            target={getCameraTarget()}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={30}
            enableDamping={true}
            dampingFactor={0.05}
          />
        </Canvas>
      </div>

      {/* Detection Panel Component */}
      <div className="detections-wrapper">
        <DetectionPanel detections={detections} />
      </div>

      {/* Footer */}
      <footer className="instructions">
        <div className="instruction-text">
          🟢 Vehicles • 🟡 Pedestrians • 🟠 Motorcycles
        </div>
        <div className="instruction-text">
          Real-time object detection and blind spot monitoring system
        </div>
      </footer>
    </div>
  );
}
