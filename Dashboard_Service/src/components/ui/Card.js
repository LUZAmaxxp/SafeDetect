import React from 'react';
import './Card.css';

/**
 * Card Component
 * Reusable card container with variants
 * 
 * @component
 * @param {string} [variant='elevated'] - Card variant: 'elevated', 'outlined', 'filled'
 * @param {React.ReactNode} children - Card content
 * @param {React.ReactNode} [header] - Optional header content
 * @param {React.ReactNode} [footer] - Optional footer content
 * @param {string} [className] - Additional CSS classes
 * @param {boolean} [hoverable=true] - Whether card has hover effect
 * @param {function} [onClick] - Click handler
 */
export default function Card({
  variant = 'elevated',
  children,
  header,
  footer,
  className = '',
  hoverable = true,
  onClick,
  ...props
}) {
  return (
    <div
      className={`card card--${variant} ${hoverable ? 'card--hoverable' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick(e);
        }
      } : undefined}
      {...props}
    >
      {header && (
        <div className="card__header">
          {header}
        </div>
      )}

      <div className="card__content">
        {children}
      </div>

      {footer && (
        <div className="card__footer">
          {footer}
        </div>
      )}
    </div>
  );
}
