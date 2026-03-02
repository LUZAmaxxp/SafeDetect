import React from 'react';
import './Header.css';

/**
 * Header — 60px top bar
 * Left: logo | Center: camera segmented control | Right: connection pill + icon buttons
 */
export default function Header({
  isConnected,
  serverIP,
  onReconnect,
  onSettings,
  cameraView,
  onCameraChange
}) {
  const views = [
    { id: 'default', label: '360°' },
    { id: 'rear',    label: 'REAR' },
    { id: 'left',    label: 'LEFT' },
    { id: 'right',   label: 'RIGHT' },
  ];

  return (
    <header className="hd">
      {/* Logo */}
      <div className="hd__logo">
        <div className="hd__logo-mark">S</div>
        <span className="hd__logo-text">SAFEDETECT</span>
      </div>

      {/* Camera segmented control */}
      <nav className="hd__cam-nav">
        {views.map(v => (
          <button
            key={v.id}
            className={`hd__cam-btn${cameraView === v.id ? ' hd__cam-btn--active' : ''}`}
            onClick={() => onCameraChange(v.id)}
          >
            {v.label}
          </button>
        ))}
      </nav>

      {/* Right actions */}
      <div className="hd__actions">
        {/* Connection pill */}
        <div className={`hd__conn${isConnected ? ' hd__conn--live' : ''}`}>
          <span className="hd__conn-dot" />
          <span className="hd__conn-label">{serverIP} : 8081</span>
        </div>

        {/* Reconnect */}
        <button className="hd__icon-btn" onClick={onReconnect} title="Reconnect">↺</button>

        {/* Settings */}
        <button className="hd__icon-btn" onClick={onSettings} title="Settings">⚙</button>
      </div>
    </header>
  );
}
