import React from 'react';
import Button from '../ui/Button';
import StatusIndicator from '../ui/StatusIndicator';
import './Header.css';

/**
 * Header Component
 * Main dashboard header with navigation and controls
 * 
 * @component
 * @param {boolean} isConnected - WebSocket connection status
 * @param {string} serverIP - Current server IP
 * @param {function} onReconnect - Callback for reconnect button
 * @param {function} onSettings - Callback for settings button
 * @param {string} cameraView - Current camera view
 * @param {function} onCameraChange - Callback for camera view change
 */
export default function Header({
  isConnected,
  serverIP,
  onReconnect,
  onSettings,
  cameraView,
  onCameraChange
}) {
  const cameraViews = [
    { id: 'default', label: 'Default', icon: '🎯' },
    { id: 'rear', label: 'Rear', icon: '🔄' },
    { id: 'left', label: 'Left', icon: '⬅️' },
    { id: 'right', label: 'Right', icon: '➡️' }
  ];

  return (
    <header className="header">
      <div className="header__logo">
        <h1 className="header__title">SafeDetect</h1>
      </div>

      <div className="header__controls">
        {/* Camera View Controls */}
        <nav className="header__camera-nav" aria-label="Camera Views">
          <div className="camera-group">
            {cameraViews.map(view => (
              <Button
                key={view.id}
                variant={cameraView === view.id ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => onCameraChange(view.id)}
                title={view.label}
                icon={view.icon}
                className="camera-button"
              >
                {view.label}
              </Button>
            ))}
          </div>
        </nav>

        {/* Action Buttons */}
        <div className="header__actions">
          <Button
            variant="success"
            size="md"
            onClick={onReconnect}
            title="Reconnect to WebSocket server"
            icon="🔄"
          >
            Reconnect
          </Button>

          <Button
            variant="ghost"
            size="md"
            onClick={onSettings}
            title="Configure server settings"
            icon="⚙️"
          >
            Settings
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="header__status">
        <StatusIndicator
          status={isConnected ? 'connected' : 'disconnected'}
          size="sm"
          animated
          label={isConnected ? 'Connected' : 'Disconnected'}
        />
        <span className="header__server-ip" title={`ws://${serverIP}:8081`}>
          ws://{serverIP}:8081
        </span>
      </div>
    </header>
  );
}
