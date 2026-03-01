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
      {/* Header */}
      <div className="header">
        <h1 className="title">
          SafeDetect
        </h1>

        <div className="header-controls">
          {/* Camera Controls */}
          <div className="camera-controls">
            {[
              { view: 'default', icon: '🎯', title: 'Default View' },
              { view: 'rear', icon: '🔄', title: 'Rear View' },
              { view: 'left', icon: '⬅️', title: 'Left View' },
              { view: 'right', icon: '➡️', title: 'Right View' }
            ].map(({ view, icon, title }) => (
              <button
                key={view}
                onClick={() => setCameraView(view)}
                title={title}
                className={`camera-button ${cameraView === view ? 'active' : ''}`}
              >
                {icon}
              </button>
            ))}
          </div>

          <button
            onClick={reconnect}
            className="reconnect-button"
          >
            🔄 Reconnect
          </button>

          <button
            onClick={() => { setPendingIP(serverIP); setShowSettings(s => !s); }}
            className="reconnect-button"
            title="Configure server IP"
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Settings Panel — configure WebSocket server IP */}
      {showSettings && (
        <div className="settings-panel">
          <span className="settings-label">WebSocket Server IP</span>
          <input
            className="settings-input"
            type="text"
            value={pendingIP}
            placeholder="e.g. 192.168.1.50 or localhost"
            onChange={e => setPendingIP(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setServerIP(pendingIP.trim());
                setShowSettings(false);
              }
            }}
          />
          <button
            className="reconnect-button"
            onClick={() => { setServerIP(pendingIP.trim()); setShowSettings(false); }}
          >
            Apply &amp; Reconnect
          </button>
          <button
            className="reconnect-button"
            onClick={() => setShowSettings(false)}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Status Bar */}
      <div className="connection-container">
        <div className={`status-text ${isConnected ? 'connected' : 'disconnected'}`}>
          {connectionStatus}
        </div>
        <div className="server-text">
          ws://{serverIP}:8081
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="stats-container">
        {[
          { label: 'Objects Detected', value: detections.length, icon: '🎯', color: '#3b82f6' },
          { label: 'Frame Rate', value: `${fps} FPS`, icon: '⚡', color: '#10b981' },
          { label: 'Alert Status', value: alertActive ? 'ACTIVE' : 'CLEAR', icon: alertActive ? '🚨' : '✅', color: alertActive ? '#ef4444' : '#10b981' }
        ].map((stat, index) => (
          <div key={index} className="stats-text">
            <div>{stat.icon}</div>
            <div>
              {stat.value}
            </div>
            <div>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Alert Overlay */}
      {alertActive && (
        <div className="alert-overlay">
          <div className="alert-text">
             BLIND SPOT ALERT! ⚠️
          </div>
        </div>
      )}

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

      {/* Detections Panel */}
      <div className="detections-container">
        {detections.length === 0 ? (
          <div className="empty-state">
            <div>🔍</div>
            <div className="empty-text">
              No objects detected
            </div>
            <div className="empty-subtext">
              Monitoring environment for potential hazards...
            </div>
          </div>
        ) : (
          <div className="detections-list">
            {detections.map((detection, index) => {
              const isInBlindSpot = detection.camera_zone &&
                ['left', 'right', 'rear'].includes(detection.camera_zone);

              return (
                <div key={index} className="detection-card">
                  <div className="detection-header">
                    <span className="object-emoji">
                      {getObjectEmoji(detection.object)}
                    </span>
                    <span className="object-type">
                      {detection.object}
                    </span>
                    <span className="confidence">
                      {(detection.confidence * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="detection-details">
                    <div className="detail-text">
                      📍 Position: X: {detection.position?.x?.toFixed(2) ?? 'N/A'}, Y: {detection.position?.y?.toFixed(2) ?? 'N/A'}
                    </div>
                    {detection.camera_zone && (
                      <div className="detail-text">
                        📷 Zone: {detection.camera_zone}
                      </div>
                    )}
                    <div className="detail-text">
                      ⏰ Detected: {new Date(detection.timestamp * 1000).toLocaleTimeString()}
                    </div>
                  </div>

                  {isInBlindSpot && (
                    <div className="blind-spot-indicator">
                      <span className="blind-spot-text">
                        🚨 BLIND SPOT DETECTED
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="instructions">
        <div className="instruction-text">
          🟢 Vehicles • 🟡 Pedestrians • 🟠 Motorcycles
        </div>
        <div className="instruction-text">
          Real-time object detection and blind spot monitoring system
        </div>
      </div>
    </div>
  );
}
