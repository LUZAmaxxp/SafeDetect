import React from 'react';
import './StatWidget.css';

/**
 * StatWidget Component
 * Display metric statistics with icon and label
 * 
 * @component
 * @param {string|number} value - The main value to display
 * @param {string} label - Label for the stat
 * @param {string} [icon] - Icon element or emoji
 * @param {string} [trend] - Trend indicator: 'up', 'down', 'stable'
 * @param {number} [trendPercent] - Trend percentage
 * @param {string} [color] - Color theme: 'primary', 'success', 'danger', 'warning', 'info'
 * @param {string} [className] - Additional CSS classes
 */
export default function StatWidget({
  value,
  label,
  icon,
  trend,
  trendPercent,
  color = 'primary',
  className = '',
  ...props
}) {
  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→'
  };

  const trendClass = {
    up: 'stat-widget__trend--up',
    down: 'stat-widget__trend--down',
    stable: 'stat-widget__trend--stable'
  };

  return (
    <div
      className={`stat-widget stat-widget--${color} ${className}`}
      {...props}
    >
      <div className="stat-widget__header">
        {icon && (
          <div className="stat-widget__icon" aria-hidden="true">
            {icon}
          </div>
        )}
        <h3 className="stat-widget__label">
          {label}
        </h3>
      </div>

      <div className="stat-widget__content">
        <div className="stat-widget__value">
          {value}
        </div>

        {trend && (
          <div className={`stat-widget__trend ${trendClass[trend]}`}>
            <span className="stat-widget__trend-icon" aria-hidden="true">
              {trendIcons[trend]}
            </span>
            {trendPercent !== undefined && (
              <span className="stat-widget__trend-percent">
                {Math.abs(trendPercent)}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
