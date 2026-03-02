import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useWebSocket
 * Manages a native WebSocket connection with auto-reconnect,
 * FPS measurement, and detection parsing.
 *
 * @param {string} serverIP  - hostname or IPv4 to connect to
 * @returns {{ detections, isConnected, fps, reconnect }}
 */
export default function useWebSocket(serverIP) {
  const [detections, setDetections]   = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [fps, setFps]                 = useState(0);

  const wsRef           = useRef(null);
  const msgCountRef     = useRef(0);
  const reconnectTimer  = useRef(null);
  const fpsTimer        = useRef(null);
  const mountedRef      = useRef(true);

  const clearTimers = () => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    if (fpsTimer.current)       clearInterval(fpsTimer.current);
  };

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onopen    = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror   = null;
      wsRef.current.onclose   = null;
      if (wsRef.current.readyState < 2) {
        wsRef.current.close();
      }
    }

    const url = `ws://${serverIP}:8081`;
    console.log('[WS] Connecting to', url);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      console.log('[WS] Connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(event.data);
        setDetections(data.detections ?? []);
        msgCountRef.current += 1;
      } catch (e) {
        console.warn('[WS] Failed to parse message:', e);
      }
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
      if (!mountedRef.current) return;
      setIsConnected(false);
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      console.log('[WS] Disconnected — reconnecting in 3s');
      setIsConnected(false);
      setDetections([]);
      reconnectTimer.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, 3000);
    };
  }, [serverIP]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start FPS interval
  useEffect(() => {
    fpsTimer.current = setInterval(() => {
      if (!mountedRef.current) return;
      setFps(msgCountRef.current);
      msgCountRef.current = 0;
    }, 1000);
    return () => clearInterval(fpsTimer.current);
  }, []);

  // (Re)connect whenever serverIP changes
  useEffect(() => {
    mountedRef.current = true;
    clearTimers();
    connect();
    return () => {
      mountedRef.current = false;
      clearTimers();
      if (wsRef.current && wsRef.current.readyState < 2) {
        wsRef.current.onclose = null; // prevent auto-reconnect on unmount
        wsRef.current.close();
      }
    };
  }, [connect]);

  const reconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    connect();
  }, [connect]);

  return { detections, isConnected, fps, reconnect };
}
