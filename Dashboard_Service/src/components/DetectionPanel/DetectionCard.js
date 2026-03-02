import React from 'react';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import './DetectionCard.css';

/**
 * DetectionCard Component
 * Display individual object detection
 * 
 * @component
 * @param {Object} detection - Detection object with properties
 * @param {number} index - Card index for animations
 */
export default function DetectionCard({ detection, index }) {
  const getObjectEmoji = (objectType) => {
    switch (objectType) {
      case 'car': return '🚗';
      case 'motorcycle': return '🏍️';
      case 'person': return '🚶';
      default: return '❓';
    }
  };

  const getObjectBadgeVariant = (objectType) => {
    switch (objectType) {
      case 'car': return 'car';
      case 'motorcycle': return 'motorcycle';
      case 'person': return 'person';
      default: return 'default';
    }
  };

  const isInBlindSpot = detection.camera_zone &&
    ['left', 'right', 'rear'].includes(detection.camera_zone);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  const confidencePercent = (detection.confidence * 100).toFixed(1);

  return (
    <Card
      variant="elevated"
      hoverable
      className={`detection-card detection-card--index-${index % 5}`}
    >
      {/* Header */}
      <div className="detection-card__header">
        <span className="detection-card__emoji" aria-hidden="true">
          {getObjectEmoji(detection.object)}
        </span>
        
        <div className="detection-card__title-group">
          <h3 className="detection-card__title">
            {detection.object.toUpperCase()}
          </h3>
          
          <Badge
            variant={getObjectBadgeVariant(detection.object)}
            size="sm"
          >
            {confidencePercent}%
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="detection-card__body">
        {/* Position */}
        <div className="detection-card__detail">
          <span className="detection-card__label">Position:</span>
          <span className="detection-card__value">
            X: {detection.position?.x?.toFixed(2) ?? 'N/A'},
            Y: {detection.position?.y?.toFixed(2) ?? 'N/A'}
          </span>
        </div>

        {/* Zone Info */}
        {detection.camera_zone && (
          <div className="detection-card__detail">
            <span className="detection-card__label">Zone:</span>
            <Badge variant="info" size="sm">
              {detection.camera_zone.toUpperCase()}
            </Badge>
          </div>
        )}

        {/* Timestamp */}
        <div className="detection-card__detail">
          <span className="detection-card__label">Detected:</span>
          <span className="detection-card__value detection-card__timestamp">
            {formatTime(detection.timestamp)}
          </span>
        </div>

        {/* Blind Spot Alert */}
        {isInBlindSpot && (
          <div className="detection-card__alert">
            <span className="detection-card__alert-icon" aria-hidden="true">
              🚨
            </span>
            <span className="detection-card__alert-text">
              BLIND SPOT DETECTED
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
