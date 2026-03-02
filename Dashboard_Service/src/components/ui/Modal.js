import React, { useEffect } from 'react';
import Button from './Button';
import './Modal.css';

/**
 * Modal Component
 * Accessible dialog/modal component
 * 
 * @component
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Callback when modal should close
 * @param {string} title - Modal title
 * @param {React.ReactNode} children - Modal content
 * @param {React.ReactNode} [footer] - Optional footer with actions
 * @param {string} [size='md'] - Modal size: 'sm', 'md', 'lg'
 * @param {string} [className] - Additional CSS classes
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className = ''
}) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className={`modal modal--${size} ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="modal__header">
          <h2 id="modal-title" className="modal__title">
            {title}
          </h2>
          
          <button
            className="modal__close"
            onClick={onClose}
            title="Close modal"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="modal__content">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="modal__footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
