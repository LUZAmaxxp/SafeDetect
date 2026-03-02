import React from 'react';
import DetectionCard from './DetectionCard';
import './DetectionPanel.css';

const BLIND = ['left', 'right', 'rear'];
const TABS = [
  { id: 'all',        label: 'ALL',      danger: false },
  { id: 'blind',      label: 'BLIND',    danger: true  },
  { id: 'car',        label: 'VEHICLES', danger: false },
  { id: 'person',     label: 'PEOPLE',   danger: false },
  { id: 'motorcycle', label: 'MOTO',     danger: false },
];

function filterTab(detections, tab) {
  switch (tab) {
    case 'blind':      return detections.filter(d => BLIND.includes(d.camera_zone));
    case 'car':        return detections.filter(d => d.object === 'car' || d.object === 'truck' || d.object === 'bus');
    case 'person':     return detections.filter(d => d.object === 'person');
    case 'motorcycle': return detections.filter(d => d.object === 'motorcycle');
    default:           return detections;
  }
}

export default function SidePanel({
  detections = [],
  activeTab = 'all',
  onTabChange,
  fps = 0,
  alertActive = false,
  blindCount = 0
}) {
  const filtered = filterTab(detections, activeTab);
  const avgConf  = detections.length
    ? (detections.reduce((s, d) => s + (d.confidence || 0), 0) / detections.length * 100).toFixed(0) + '%'
    : '—';

  return (
    <aside className="sp">
      {/* Header */}
      <div className="sp__hd">
        <span className="sp__title">Live Detections</span>
        <div className="sp__count-wrap">
          <span className="sp__count-num">{detections.length}</span>
          <span className="sp__count-suffix">objects</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="sp__tabs">
        {TABS.map(t => {
          const n = filterTab(detections, t.id).length;
          const isActive = activeTab === t.id;
          const cls = [
            'sp__tab',
            isActive ? 'sp__tab--active' : '',
            t.danger ? 'sp__tab--danger' : '',
          ].filter(Boolean).join(' ');
          return (
            <button
              key={t.id}
              className={cls}
              onClick={() => onTabChange && onTabChange(t.id)}
            >
              {t.id === 'blind' && blindCount > 0 ? `BLIND ${blindCount}` : t.label}
              {t.danger && n > 0 && (
                <span className="sp__tab-badge">{n}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="sp__list">
        {filtered.length === 0 ? (
          <div className="sp__empty">
            <div className="sp__empty-icon">◎</div>
            <p className="sp__empty-text">No Detections</p>
          </div>
        ) : (
          filtered.map((d, i) => (
            <DetectionCard key={`${d.timestamp}-${i}`} detection={d} />
          ))
        )}
      </div>

      {/* Stats footer */}
      <div className="sp__foot">
        <div className="sp__stat">
          <span className="sp__stat-label">CONF AVG</span>
          <span className="sp__stat-value">{avgConf}</span>
        </div>
        <div className="sp__stat">
          <span className="sp__stat-label">BLIND</span>
          <span className={`sp__stat-value${blindCount > 0 ? ' sp__stat-value--danger' : ''}`}>{blindCount}</span>
        </div>
        <div className="sp__stat">
          <span className="sp__stat-label">FPS</span>
          <span className="sp__stat-value">{fps}</span>
        </div>
        <div className="sp__stat">
          <span className="sp__stat-label">ALERT</span>
          <span className={`sp__stat-value${alertActive ? ' sp__stat-value--danger' : ''}`}>{alertActive ? 'ON' : 'OFF'}</span>
        </div>
      </div>
    </aside>
  );
}


