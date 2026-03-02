import React from 'react';
import './Alert.css';

/**
 * Alert Component
 * Prominent alert notification for critical events
 * 
 * @component
 * @param {string} [type='warning'] - Alert type: 'danger', 'warning', 'success', 'info'
 * @param {string} [title] - Alert title
 * @param {React.ReactNode} children - Alert content
 * @param {boolean} [visible=true] - Whether alert is visible
 * @param {string} [icon] - Alert icon
 * @param {string} [className] - Additional CSS classes
 */
export default function Alert({
  type = 'warning',
  title,
  children,
  visible = true,
  icon = '⚠️',
  className = '',
  ...props
}) {
  if (!visible) return null;

  return (
    <div
      className={`alert alert--${type} ${className}`}
      role="alert"
      aria-live="assertive"
      {...props}
    >
      <div className="alert__content">
        {icon && (
          <span className="alert__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        
        <div className="alert__text">
          {title && (
            <div className="alert__title">
              {title}
            </div>
          )}
          
          {children && (
            <div className="alert__message">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
