import React, { useState } from 'react';
import DetectionCard from './DetectionCard';
import './DetectionPanel.css';

/**
 * DetectionPanel Component
 * Display list of recent detections
 * 
 * @component
 * @param {Array} detections - Array of detection objects
 */
export default function DetectionPanel({ detections = [] }) {
  const [activeTab, setActiveTab] = useState('all');

  // Filter detections by tab
  const filteredDetections = detections.filter(detection => {
    switch (activeTab) {
      case 'blind-spot':
        return detection.camera_zone && 
               ['left', 'right', 'rear'].includes(detection.camera_zone);
      case 'car':
        return detection.object === 'car';
      case 'person':
        return detection.object === 'person';
      case 'motorcycle':
        return detection.object === 'motorcycle';
      default:
        return true;
    }
  });

  const tabs = [
    { id: 'all', label: 'All', count: detections.length, icon: '🎯' },
    { id: 'blind-spot', label: 'Blind Spot', count: detections.filter(d => d.camera_zone && ['left', 'right', 'rear'].includes(d.camera_zone)).length, icon: '🚨' },
    { id: 'car', label: 'Cars', count: detections.filter(d => d.object === 'car').length, icon: '🚗' },
    { id: 'person', label: 'People', count: detections.filter(d => d.object === 'person').length, icon: '🚶' },
    { id: 'motorcycle', label: 'Motorcycles', count: detections.filter(d => d.object === 'motorcycle').length, icon: '🏍️' }
  ];

  return (
    <div className="detection-panel">
      {/* Tabs */}
      <div className="detection-panel__header">
        <nav className="detection-panel__tabs" aria-label="Detection filters">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`detection-panel__tab ${activeTab === tab.id ? 'detection-panel__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              <span className="detection-panel__tab-icon" aria-hidden="true">
                {tab.icon}
              </span>
              <span className="detection-panel__tab-label">
                {tab.label}
              </span>
              <span className="detection-panel__tab-count">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="detection-panel__content">
        {filteredDetections.length === 0 ? (
          <div className="detection-panel__empty">
            <div className="detection-panel__empty-icon">🔍</div>
            <div className="detection-panel__empty-title">
              No detections found
            </div>
            <div className="detection-panel__empty-text">
              {activeTab === 'all' 
                ? 'Monitoring environment for potential hazards...'
                : `No ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()} detected`}
            </div>
          </div>
        ) : (
          <div className="detection-panel__list">
            {filteredDetections.map((detection, index) => (
              <DetectionCard
                key={`${detection.timestamp}-${index}`}
                detection={detection}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {detections.length > 0 && (
        <div className="detection-panel__footer">
          <span className="detection-panel__footer-text">
            Showing {filteredDetections.length} of {detections.length} detections
          </span>
        </div>
      )}
    </div>
  );
}
