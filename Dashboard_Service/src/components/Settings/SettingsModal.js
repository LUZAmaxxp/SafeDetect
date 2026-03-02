import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import './SettingsModal.css';

/**
 * SettingsModal Component
 * Configure WebSocket server connection
 * 
 * @component
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Callback when modal closes
 * @param {string} currentIP - Current server IP
 * @param {function} onSave - Callback when settings are saved (receives new IP)
 */
export default function SettingsModal({
  isOpen,
  onClose,
  currentIP,
  onSave
}) {
  const [ip, setIp] = useState(currentIP);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIp(currentIP);
      setError('');
    }
  }, [isOpen, currentIP]);

  const validateIP = (value) => {
    // Simple validation - allow localhost, IPv4, IPv6, or domain names
    if (!value) return 'Server IP is required';
    
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const isLocalhost = value === 'localhost';
    const isDomain = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value);
    
    if (!ipv4Regex.test(value) && !isLocalhost && !isDomain) {
      return 'Please enter a valid IP address, localhost, or domain name';
    }
    
    return '';
  };

  const handleSave = () => {
    const validationError = validateIP(ip);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSave(ip.trim());
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  const footer = (
    <div className="settings-modal__footer">
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="success" onClick={handleSave}>
        Apply & Reconnect
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Server Configuration"
      size="sm"
      footer={footer}
    >
      <div className="settings-modal__content">
        <div className="settings-modal__form">
          <label htmlFor="server-ip" className="settings-modal__label">
            WebSocket Server Address
          </label>
          
          <div className="settings-modal__input-group">
            <span className="settings-modal__prefix">ws://</span>
            <input
              id="server-ip"
              type="text"
              className={`settings-modal__input ${error ? 'settings-modal__input--error' : ''}`}
              value={ip}
              onChange={(e) => {
                setIp(e.target.value);
                if (error) setError('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="e.g. 192.168.1.50 or localhost"
              aria-describedby={error ? 'server-ip-error' : undefined}
            />
            <span className="settings-modal__suffix">:8081</span>
          </div>

          {error && (
            <div id="server-ip-error" className="settings-modal__error">
              {error}
            </div>
          )}

          <div className="settings-modal__hint">
            <p>Enter the IP address or hostname of your SafeDetect server.</p>
            <p>Common examples:</p>
            <ul>
              <li><code>localhost</code> - Local development</li>
              <li><code>192.168.1.100</code> - Local network</li>
              <li><code>safedetect.local</code> - mDNS hostname</li>
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  );
}
