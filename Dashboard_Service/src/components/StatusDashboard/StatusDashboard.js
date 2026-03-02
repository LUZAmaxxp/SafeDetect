import React from 'react';
import './StatusDashboard.css';

/**
 * StatusStrip — 38px inline metrics bar
 * Props: objectCount, blindCount, fps, cameraView, isConnected, alertActive
 */
export default function StatusStrip({
  objectCount = 0,
  blindCount = 0,
  fps = 0,
  cameraView = 'default',
  isConnected = false,
  alertActive = false
}) {
  const items = [
    {
      label: 'OBJECTS',
      value: objectCount,
      mod: ''
    },
    {
      label: 'BLIND SPOT',
      value: blindCount > 0 ? `${blindCount} ACTIVE` : 'CLEAR',
      mod: blindCount > 0 ? 'danger' : ''
    },
    {
      label: 'FRAME RATE',
      value: `${fps} FPS`,
      mod: fps < 15 ? 'danger' : fps < 20 ? 'dim' : ''
    },
    {
      label: 'VIEW',
      value: cameraView === 'default' ? '360°' : cameraView.toUpperCase(),
      mod: 'dim'
    },
    {
      label: 'STATUS',
      value: isConnected ? 'LIVE' : 'OFFLINE',
      mod: isConnected ? 'live' : 'danger'
    }
  ];

  return (
    <div className={`ss${alertActive ? ' ss--alert' : ''}`}>
      {items.map(item => (
        <div key={item.label} className="ss__item">
          <span className="ss__label">{item.label}</span>
          <span className={`ss__value${item.mod ? ` ss__value--${item.mod}` : ''}`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
