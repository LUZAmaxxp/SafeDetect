import React from 'react';
import './StatusIndicator.css';

/**
 * StatusIndicator Component
 * Visual status indicator with animated pulse
 * 
 * @component
 * @param {string} [status='idle'] - Status: 'connected', 'disconnected', 'loading', 'error'
 * @param {string} [size='md'] - Size: 'sm', 'md', 'lg'
 * @param {boolean} [animated=true] - Whether to animate the indicator
 * @param {string} [label] - Optional label text
 * @param {string} [className] - Additional CSS classes
 */
export default function StatusIndicator({
  status = 'idle',
  size = 'md',
  animated = true,
  label,
  className = '',
  ...props
}) {
  const statusColors = {
    connected: '#10b981',
    disconnected: '#ef4444',
    loading: '#f59e0b',
    error: '#ef4444',
    idle: '#9E9E9E',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  };

  const statusText = {
    connected: 'Connected',
    disconnected: 'Disconnected',
    loading: 'Loading',
    error: 'Error',
    idle: 'Idle',
    success: 'Success',
    warning: 'Warning',
    danger: 'Danger'
  };

  return (
    <div
      className={`status-indicator status-indicator--${status} status-indicator--${size} ${animated ? 'status-indicator--animated' : ''} ${className}`}
      {...props}
    >
      <span
        className="status-indicator__dot"
        style={{ backgroundColor: statusColors[status] }}
        aria-hidden="true"
      />
      
      {(label || statusText[status]) && (
        <span className="status-indicator__label">
          {label || statusText[status]}
        </span>
      )}
    </div>
  );
}
