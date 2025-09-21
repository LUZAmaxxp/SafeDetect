import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
// import { OrbitControls } from '@react-three/drei';
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
  const wsService = useRef(null);

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
      alert('Connection Error: Failed to connect to detection server');
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

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <h1 className="title">SafeDetect</h1>
        <button onClick={reconnect} className="reconnect-button">
          🔄
        </button>
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

      {/* 3D Scene */}
      <div className="scene-container">
        <Canvas
          camera={{ position: [10, 5, 10], fov: 60 }}
          style={{ background: '#000' }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          
          <Truck3D />
          <DetectionOverlay detections={detections} />
          
          {/* OrbitControls temporarily disabled for compatibility */}
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
