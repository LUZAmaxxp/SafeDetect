import React from 'react';
import './Badge.css';

/**
 * Badge Component
 * Small label for status, tags, and classifications
 * 
 * @component
 * @param {string} [variant='default'] - Badge variant: 'default', 'success', 'danger', 'warning', 'info', 'primary'
 * @param {string} [size='md'] - Badge size: 'sm', 'md', 'lg'
 * @param {React.ReactNode} children - Badge content
 * @param {React.ReactNode} [icon] - Optional icon
 * @param {string} [className] - Additional CSS classes
 */
export default function Badge({
  variant = 'default',
  size = 'md',
  children,
  icon,
  className = '',
  ...props
}) {
  return (
    <span
      className={`badge badge--${variant} badge--${size} ${className}`}
      {...props}
    >
      {icon && (
        <span className="badge__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="badge__text">
        {children}
      </span>
    </span>
  );
}
