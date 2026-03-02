import React, { useState, useEffect, useRef, useCallback } from 'react';
import useWebSocket from './hooks/useWebSocket';
import useThreeScene from './hooks/useThreeScene';
import Header from './components/Header/Header';
import StatusStrip from './components/StatusDashboard/StatusDashboard';
import SidePanel from './components/DetectionPanel/DetectionPanel';
import SettingsModal from './components/Settings/SettingsModal';
import './App.css';

const BLIND_ZONES = ['left', 'right', 'rear'];

export default function App() {
  const [serverIP, setServerIP]       = useState(
    (typeof window !== 'undefined' && window.location.hostname) || '192.168.1.100'
  );
  const [cameraView, setCameraView]   = useState('default');
  const [alertActive, setAlertActive] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab]     = useState('all');
  const alertTimerRef = useRef(null);

  const { detections, isConnected, fps, reconnect } = useWebSocket(serverIP);

  // Trigger alert when blind-spot detections arrive
  useEffect(() => {
    const hasBlind = detections.some(d => BLIND_ZONES.includes(d.camera_zone));
    if (hasBlind) {
      setAlertActive(true);
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      alertTimerRef.current = setTimeout(() => setAlertActive(false), 3000);
      if (navigator.vibrate) navigator.vibrate(200);
    }
  }, [detections]);

  // Cleanup alert timer on unmount
  useEffect(() => () => { if (alertTimerRef.current) clearTimeout(alertTimerRef.current); }, []);

  const handleSaveIP = useCallback((newIP) => {
    setServerIP(newIP);
    setSettingsOpen(false);
  }, []);

  // Three.js canvas ref — scene setup lives in useThreeScene
  const canvasRef = useRef(null);
  useThreeScene(canvasRef, detections, cameraView);

  const blindCount = detections.filter(d => BLIND_ZONES.includes(d.camera_zone)).length;

  return (
    <div className="app">
      {/* ── Header ── */}
      <div className="app__header-wrap">
        <Header
          isConnected={isConnected}
          serverIP={serverIP}
          onReconnect={reconnect}
          onSettings={() => setSettingsOpen(true)}
          cameraView={cameraView}
          onCameraChange={setCameraView}
        />
        {/* Alert banner — slides down from top of header area */}
        <div className={`alert-banner${alertActive ? ' alert-banner--active' : ''}`}>
          <span className="alert-banner__dot" />
          <span className="alert-banner__dot" />
          <span className="alert-banner__text">
            BLIND SPOT ALERT — OBSTACLE DETECTED
          </span>
        </div>
      </div>

      {/* ── Status Strip ── */}
      <StatusStrip
        objectCount={detections.length}
        blindCount={blindCount}
        fps={fps}
        cameraView={cameraView}
        isConnected={isConnected}
        alertActive={alertActive}
      />

      {/* ── Main body: Scene + Side Panel ── */}
      <div className="app__body">
        {/* 3D Scene */}
        <div className="app__scene">
          <canvas ref={canvasRef} className="three-canvas" />
          {/* Overlay labels */}
          <div className="scene-label scene-label--tl">LIVE · 3D SURROUND VIEW</div>
          <div className="scene-label scene-label--bc">DRAG TO ROTATE · SCROLL TO ZOOM</div>
          {/* In-scene view buttons */}
          <div className="scene-views">
            {['default','rear','left','right'].map(v => (
              <button
                key={v}
                className={`scene-view-btn${cameraView === v ? ' scene-view-btn--active' : ''}`}
                onClick={() => setCameraView(v)}
              >
                {v === 'default' ? '360°' : v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Side Panel */}
        <SidePanel
          detections={detections}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          fps={fps}
          alertActive={alertActive}
          blindCount={blindCount}
        />
      </div>

      {/* ── Settings Modal ── */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentIP={serverIP}
        onSave={handleSaveIP}
      />
    </div>
  );
}
