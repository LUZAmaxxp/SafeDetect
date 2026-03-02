import React from 'react';
import './Button.css';

/**
 * Button Component
 * Reusable button with multiple variants and states
 * 
 * @component
 * @param {string} [variant='primary'] - Button variant: 'primary', 'secondary', 'danger', 'success', 'ghost'
 * @param {string} [size='md'] - Button size: 'sm', 'md', 'lg'
 * @param {boolean} [disabled=false] - Whether button is disabled
 * @param {boolean} [loading=false] - Whether button is in loading state
 * @param {React.ReactNode} children - Button content
 * @param {string} [className] - Additional CSS classes
 * @param {function} onClick - Click handler
 * @param {string} [type='button'] - Button HTML type
 * @param {string} [title] - Button tooltip title
 * @param {React.ReactNode} [icon] - Icon element to display
 * @param {boolean} [iconOnly=false] - Whether button only contains icon
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  className = '',
  onClick,
  type = 'button',
  title,
  icon,
  iconOnly = false,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={`button button--${variant} button--${size} ${iconOnly ? 'button--icon-only' : ''} ${className}`}
      disabled={isDisabled}
      onClick={onClick}
      title={title}
      aria-disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <span className="button__spinner" aria-hidden="true">
          <span className="button__spinner-dot"></span>
        </span>
      )}
      
      {icon && (
        <span className="button__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      
      {children && (
        <span className="button__text">
          {children}
        </span>
      )}
    </button>
  );
}
