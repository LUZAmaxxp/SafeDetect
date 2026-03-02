import React from 'react';
import StatWidget from '../ui/StatWidget';
import './StatusDashboard.css';

/**
 * StatusDashboard Component
 * Display real-time system metrics and statistics
 * 
 * @component
 * @param {number} objectCount - Current count of detected objects
 * @param {number} fps - Current frames per second
 * @param {boolean} alertActive - Whether alert is active
 * @param {string} connectionStatus - Connection status text
 */
export default function StatusDashboard({
  objectCount = 0,
  fps = 0,
  alertActive = false,
  connectionStatus = 'Disconnected'
}) {
  const stats = [
    {
      value: objectCount,
      label: 'Objects Detected',
      icon: '🎯',
      color: 'primary'
    },
    {
      value: `${fps} FPS`,
      label: 'Frame Rate',
      icon: '⚡',
      color: fps > 20 ? 'success' : fps > 10 ? 'warning' : 'danger'
    },
    {
      value: alertActive ? 'ACTIVE' : 'CLEAR',
      label: 'Alert Status',
      icon: alertActive ? '🚨' : '✅',
      color: alertActive ? 'danger' : 'success'
    }
  ];

  return (
    <div className="status-dashboard">
      <div className="status-dashboard__title">
        System Status
      </div>
      
      <div className="status-dashboard__widgets">
        {stats.map((stat, index) => (
          <StatWidget
            key={index}
            value={stat.value}
            label={stat.label}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>
    </div>
  );
}
