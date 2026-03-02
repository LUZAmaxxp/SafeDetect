import React, { useState, useEffect } from 'react';
import './SettingsModal.css';

const IP_RE = /^(\d{1,3}\.){3}\d{1,3}$|^localhost$|^[a-zA-Z0-9][a-zA-Z0-9-]*(\.[a-zA-Z0-9-]+)*$/;

export default function SettingsModal({ isOpen, onClose, currentIP, onSave }) {
  const [ip, setIp]       = useState(currentIP);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) { setIp(currentIP); setError(''); }
  }, [isOpen, currentIP]);

  const handleSave = () => {
    if (!IP_RE.test(ip.trim())) {
      setError('Enter a valid IP address, localhost, or hostname.');
      return;
    }
    onSave(ip.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="sm-overlay" onClick={onClose}>
      <div className="sm-box" onClick={e => e.stopPropagation()}>
        <p className="sm-title">SERVER CONFIGURATION</p>

        <label className="sm-label">WEBSOCKET HOST</label>
        <input
          className="sm-input"
          value={ip}
          onChange={e => { setIp(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="192.168.1.100"
          spellCheck={false}
          autoComplete="off"
        />
        <p className="sm-helper">Hostname or IP address. Port 8081 is used automatically.</p>
        {error && <p className="sm-error">{error}</p>}

        <div className="sm-actions">
          <button className="sm-btn sm-btn--ghost" onClick={onClose}>CANCEL</button>
          <button className="sm-btn sm-btn--solid" onClick={handleSave}>APPLY &amp; RECONNECT</button>
        </div>
      </div>
    </div>
  );
}
