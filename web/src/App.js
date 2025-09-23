import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import WebSocketService from './services/WebSocketService';
import Truck3D from './components/Truck3D';
import DetectionOverlay from './components/DetectionOverlay';
import './App.css';

export default function App() {
  const [detections, setDetections] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [alertActive, setAlertActive] = useState(false);
  const [fps, setFps] = useState(0);
  const [serverIP, setServerIP] = useState('localhost');
  const [cameraView, setCameraView] = useState('default'); // 'default', 'rear', 'left', 'right'
  const wsService = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    // Initialize WebSocket service
    wsService.current = new WebSocketService(`ws://${serverIP}:8765`);

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
      setDetections(data.detections || []);

      // Check for blind spot detections and trigger alerts
      const blindSpotObjects = data.detections?.filter(detection => {
        // Simple blind spot detection based on position
        return detection.position.x < -1 || detection.position.x > 1 ||
               detection.position.y < -2 || detection.position.y > 0;
      });

      if (blindSpotObjects && blindSpotObjects.length > 0 && !alertActive) {
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

      console.log(`Updating camera to view: ${cameraView}, position:`, position);

      // Smooth camera transition
      cameraRef.current.position.set(position[0], position[1], position[2]);
      cameraRef.current.lookAt(target[0], target[1], target[2]);
      cameraRef.current.updateProjectionMatrix();

      // Add a small delay to ensure smooth transition
      setTimeout(() => {
        if (cameraRef.current) {
          cameraRef.current.updateProjectionMatrix();
          console.log(`Camera updated for view: ${cameraView}`);
        }
      }, 100);
    }
  }, [cameraView]);

  const triggerAlert = async () => {
    setAlertActive(true);

    try {
      // Web vibration API
      if (navigator.vibrate) {
        navigator.vibrate([0, 500, 200, 500, 200, 500]);
      }

      // Reset alert after 3 seconds
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
      wsService.current = new WebSocketService(`ws://${serverIP}:8765`);
      wsService.current.on('connected', () => {
        setIsConnected(true);
        setConnectionStatus('Connected');
      });
      wsService.current.on('disconnected', () => {
        setIsConnected(false);
        setConnectionStatus('Disconnected');
      });
      wsService.current.on('detections', (data) => {
        setDetections(data.detections || []);
      });
      wsService.current.connect();
    }
  };

  // Camera view switching functions
  const switchToDefaultView = () => {
    console.log('Switching to default view');
    setCameraView('default');
  };

  const switchToRearView = () => {
    console.log('Switching to rear view');
    setCameraView('rear');
  };

  const switchToLeftView = () => {
    console.log('Switching to left view');
    setCameraView('left');
  };

  const switchToRightView = () => {
    console.log('Switching to right view');
    setCameraView('right');
  };

  // Get camera position based on current view
  const getCameraPosition = () => {
    switch (cameraView) {
      case 'rear':
        return [-10, 5, 0]; // Behind the truck
      case 'left':
        return [0, 5, -15]; // Left side of truck
      case 'right':
        return [0, 5, 15]; // Right side of truck
      default:
        return [10, 5, 10]; // Default diagonal view
    }
  };

  // Get camera target (look at) position
  const getCameraTarget = () => {
    return [0, 0, 0]; // Always look at the truck
  };

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <h1 className="title">SafeDetect</h1>
        <div className="header-controls">
          {/* Camera View Controls */}
          <div className="camera-controls">
            <button
              onClick={switchToDefaultView}
              className={`camera-button ${cameraView === 'default' ? 'active' : ''}`}
              title="Default View"
            >
              📐
            </button>
            <button
              onClick={switchToRearView}
              className={`camera-button ${cameraView === 'rear' ? 'active' : ''}`}
              title="Rear View"
            >
              🔄
            </button>
            <button
              onClick={switchToLeftView}
              className={`camera-button ${cameraView === 'left' ? 'active' : ''}`}
              title="Left Side View"
            >
              ⬅️
            </button>
            <button
              onClick={switchToRightView}
              className={`camera-button ${cameraView === 'right' ? 'active' : ''}`}
              title="Right Side View"
            >
              ➡️
            </button>
          </div>
          <button onClick={reconnect} className="reconnect-button">
            🔄
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="connection-container">
        <div className={`status-text ${isConnected ? 'connected' : 'disconnected'}`}>
          {connectionStatus}
        </div>
        <div className="server-text">
          Server: {serverIP}:8765
        </div>
      </div>

      {/* Detection Count */}
      <div className="stats-container">
        <div className="stats-text">
          Objects Detected: {detections.length}
        </div>
        <div className="stats-text">
          FPS: {fps}
        </div>
      </div>

      {/* Alert Indicator */}
      {alertActive && (
        <div className="alert-overlay">
          <div className="alert-text">⚠️ BLIND SPOT ALERT! ⚠️</div>
        </div>
      )}

      {/* 3D Scene - Enhanced with futuristic lighting */}
      <div className="scene-container">
        <Canvas
          camera={{ position: getCameraPosition(), fov: 60 }}
          style={{ background: 'transparent' }}
          shadows
          onCreated={({ camera, gl, scene }) => {
            // Store camera reference for manual updates
            cameraRef.current = camera;
            camera.userData = { ...camera.userData, needsUpdate: true };
            // Set background color to white
            gl.setClearColor('#ffffff', 1);
          }}
        >
          {/* Advanced lighting setup */}
          <ambientLight intensity={0.2} color="#4a90e2" />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1.5}
            color="#ffffff"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />
          <pointLight position={[-10, 5, -10]} intensity={0.8} color="#00d4ff" />
          <pointLight position={[10, 5, 10]} intensity={0.6} color="#ff6b6b" />
          <spotLight
            position={[0, 15, 0]}
            angle={0.3}
            penumbra={1}
            intensity={0.5}
            color="#ffffff"
            castShadow
          />

          {/* Fog effect for depth */}
          <fog attach="fog" args={['#0a0a0a', 15, 50]} />

          <Truck3D />
          <DetectionOverlay detections={detections} />

          {/* Camera Controls */}
          <OrbitControls
            target={getCameraTarget()}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={30}
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
            enableDamping={true}
            dampingFactor={0.05}
            onChange={() => {
              // Optional: Add any camera change logic here
            }}
          />
        </Canvas>
      </div>

      {/* Detections List */}
      <div className="detections-container">
        {detections.length === 0 ? (
          <div className="empty-state">
            <div className="empty-text">No objects detected</div>
            <div className="empty-subtext">
              Make sure the backend is running and connected
            </div>
            <div className="empty-subtext">
              Backend command: cd backend && source venv/bin/activate && PYTHONPATH=/Users/aymanallouch/Desktop/SafeDetect python computer_vision/blind_spot.py
            </div>
          </div>
        ) : (
          <div className="detections-list">
            {detections.map((detection, index) => (
              <div key={index} className="detection-card">
                <div className="detection-header">
                  <span className="object-emoji">
                    {getObjectEmoji(detection.object)}
                  </span>
                  <span className="object-type">
                    {detection.object.toUpperCase()}
                  </span>
                  <span className="confidence">
                    {(detection.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                
                <div className="detection-details">
                  <div className="detail-text">
                    Position: X: {detection.position.x.toFixed(2)}, Y: {detection.position.y.toFixed(2)}
                  </div>
                  <div className="detail-text">
                    Timestamp: {new Date(detection.timestamp * 1000).toLocaleTimeString()}
                  </div>
                </div>

                {/* Blind spot indicator */}
                {(detection.position.x < -1 || detection.position.x > 1 ||
                  detection.position.y < -2 || detection.position.y > 0) && (
                  <div className="blind-spot-indicator">
                    <span className="blind-spot-text">🚨 IN BLIND SPOT</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="instructions">
        <div className="instruction-text">
          🟢 Cars • 🟠 Motorcycles • 🟡 Pedestrians
        </div>
        <div className="instruction-text">
          Connect to backend at ws://{serverIP}:8765
        </div>
      </div>
    </div>
  );
}
