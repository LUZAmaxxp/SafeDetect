import React, { useState, useEffect } from 'react';
import './DetectionCard.css';

const BLIND = ['left', 'right', 'rear'];

const EMOJI = { car: '\uD83D\uDE97', motorcycle: '\uD83C\uDFCD\uFE0F', person: '\uD83D\uDEB6', truck: '\uD83D\uDE9B', bus: '\uD83D\uDE8C' };

function ago(ts, now) {
  if (!ts) return '';
  const s = Math.floor((now - ts * 1000) / 1000);
  if (s < 2)    return 'now';
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function DetectionCard({ detection }) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!detection) return null;
  const { object = 'unknown', confidence = 0, camera_zone, timestamp } = detection;
  const isBlind  = BLIND.includes(camera_zone);
  const confPct  = (confidence * 100).toFixed(0);
  const highConf = confidence >= 0.8;

  return (
    <div className={`dc${isBlind ? ' dc--blind' : ''}`}>
      <div className="dc__top">
        <span className="dc__emoji">{EMOJI[object] || '\u2753'}</span>
        <span className="dc__type">{object.toUpperCase()}</span>
        <span className={`dc__conf${highConf ? ' dc__conf--hi' : ''}`}>{confPct}%</span>
      </div>
      <div className="dc__bot">
        <span className={`dc__zone-dot${isBlind ? ' dc__zone-dot--blind' : ''}`} />
        <span className="dc__zone">{camera_zone ? camera_zone.toUpperCase() : 'UNKNOWN'}</span>
        <span className="dc__time">{ago(timestamp, now)}</span>
      </div>
    </div>
  );
}
