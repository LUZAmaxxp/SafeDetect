import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Alert, Vibration, ScrollView, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import WebSocketService from './services/WebSocketService';

export default function App() {
  const [detections, setDetections] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [alertActive, setAlertActive] = useState(false);
  const [fps, setFps] = useState(0);
  const [serverIP, setServerIP] = useState('localhost');
  const wsService = useRef(null);

  useEffect(() => {
    // Initialize WebSocket service
    wsService.current = new WebSocketService(`ws://${serverIP}:8765`);

    // Set up event listeners
    wsService.current.on('connected', () => {
      setIsConnected(true);
      setConnectionStatus('Connected');
    });

    wsService.current.on('disconnected', () => {
      setIsConnected(false);
      setConnectionStatus('Disconnected');
    });

    wsService.current.on('detections', (data) => {
      setDetections(data.detections || []);

      // Check for blind spot detections and trigger alerts
      const blindSpotObjects = data.detections?.filter(detection => {
        // Simple blind spot detection based on position
        return detection.position.x < -1 || detection.position.x > 1 ||
               detection.position.y < -2 || detection.position.y > 0;
      });

      if (blindSpotObjects && blindSpotObjects.length > 0 && !alertActive) {
        triggerAlert();
      }
    });

    wsService.current.on('error', (error) => {
      setConnectionStatus(`Error: ${error.message}`);
      Alert.alert('Connection Error', 'Failed to connect to detection server');
    });

    // Connect to WebSocket server
    wsService.current.connect();

    // Cleanup on unmount
    return () => {
      if (wsService.current) {
        wsService.current.disconnect();
      }
    };
  }, [serverIP]);

  const triggerAlert = async () => {
    setAlertActive(true);

    try {
      // Visual alert
      Vibration.vibrate([0, 500, 200, 500, 200, 500], true);

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Reset alert after 3 seconds
      setTimeout(() => {
        setAlertActive(false);
        Vibration.cancel();
      }, 3000);
    } catch (error) {
      console.error('Error triggering alert:', error);
    }
  };

  const getObjectColor = (objectType) => {
    switch (objectType) {
      case 'car': return '#4CAF50';
      case 'motorcycle': return '#FF9800';
      case 'person': return '#FFEB3B';
      default: return '#9E9E9E';
    }
  };

  const getObjectEmoji = (objectType) => {
    switch (objectType) {
      case 'car': return '🚗';
      case 'motorcycle': return '🏍️';
      case 'person': return '🚶';
      default: return '❓';
    }
  };

  const reconnect = () => {
    if (wsService.current) {
      wsService.current.disconnect();
      wsService.current = new WebSocketService(`ws://${serverIP}:8765`);
      wsService.current.on('connected', () => {
        setIsConnected(true);
        setConnectionStatus('Connected');
      });
      wsService.current.on('disconnected', () => {
        setIsConnected(false);
        setConnectionStatus('Disconnected');
      });
      wsService.current.on('detections', (data) => {
        setDetections(data.detections || []);
      });
      wsService.current.connect();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>SafeDetect</Text>
        <TouchableOpacity onPress={reconnect} style={styles.reconnectButton}>
          <Text style={styles.reconnectText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Connection Status */}
      <View style={styles.connectionContainer}>
        <Text style={[
          styles.statusText,
          { color: isConnected ? '#4CAF50' : '#F44336' }
        ]}>
          {connectionStatus}
        </Text>
        <Text style={styles.serverText}>
          Server: {serverIP}:8765
        </Text>
      </View>

      {/* Detection Count */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Objects Detected: {detections.length}
        </Text>
        <Text style={styles.statsText}>
          FPS: {fps}
        </Text>
      </View>

      {/* Alert Indicator */}
      {alertActive && (
        <View style={styles.alertOverlay}>
          <Text style={styles.alertText}>⚠️ BLIND SPOT ALERT! ⚠️</Text>
        </View>
      )}

      {/* Detections List */}
      <ScrollView style={styles.detectionsContainer}>
        {detections.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No objects detected</Text>
            <Text style={styles.emptySubtext}>
              Make sure the backend is running and connected
            </Text>
            <Text style={styles.emptySubtext}>
              Backend command: cd backend && source venv/bin/activate && PYTHONPATH=/Users/aymanallouch/Desktop/SafeDetect python computer_vision/blind_spot.py
            </Text>
          </View>
        ) : (
          detections.map((detection, index) => (
            <View key={index} style={styles.detectionCard}>
              <View style={styles.detectionHeader}>
                <Text style={styles.objectEmoji}>
                  {getObjectEmoji(detection.object)}
                </Text>
                <Text style={styles.objectType}>
                  {detection.object.toUpperCase()}
                </Text>
                <Text style={styles.confidence}>
                  {(detection.confidence * 100).toFixed(1)}%
                </Text>
              </View>
              
              <View style={styles.detectionDetails}>
                <Text style={styles.detailText}>
                  Position: X: {detection.position.x.toFixed(2)}, Y: {detection.position.y.toFixed(2)}
                </Text>
                <Text style={styles.detailText}>
                  Timestamp: {new Date(detection.timestamp * 1000).toLocaleTimeString()}
                </Text>
              </View>

              {/* Blind spot indicator */}
              {(detection.position.x < -1 || detection.position.x > 1 ||
                detection.position.y < -2 || detection.position.y > 0) && (
                <View style={styles.blindSpotIndicator}>
                  <Text style={styles.blindSpotText}>🚨 IN BLIND SPOT</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          🟢 Cars • 🟠 Motorcycles • 🟡 Pedestrians
        </Text>
        <Text style={styles.instructionText}>
          Connect to backend at ws://{serverIP}:8765
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  reconnectButton: {
    padding: 10,
  },
  reconnectText: {
    fontSize: 20,
  },
  connectionContainer: {
    padding: 15,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  serverText: {
    fontSize: 12,
    color: '#ccc',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  statsText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  alertOverlay: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    right: '10%',
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    zIndex: 1000,
  },
  alertText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  detectionsContainer: {
    flex: 1,
    padding: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
    marginBottom: 5,
    lineHeight: 16,
  },
  detectionCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  detectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  objectEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  objectType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  confidence: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  detectionDetails: {
    marginBottom: 10,
  },
  detailText: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 2,
  },
  blindSpotIndicator: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    padding: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  blindSpotText: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instructions: {
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  instructionText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 5,
  },
});