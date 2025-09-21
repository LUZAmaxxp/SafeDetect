# SafeDetect Mobile App

React Native mobile application with 3D visualization for the SafeDetect blind spot detection system.

## Features

- **Real-time 3D Visualization**: Interactive 3D truck model with dynamic object detection overlay
- **WebSocket Communication**: Real-time data streaming from detection backend
- **Alert System**: Visual, audio, and haptic alerts for blind spot detections
- **Multi-platform**: Works on iOS and Android devices
- **Touch Controls**: OrbitControls for camera manipulation (rotate, zoom, pan)

## Installation

### Prerequisites

1. **Node.js**: Version 16 or higher
2. **Expo CLI**: Install globally
   ```bash
   npm install -g @expo/cli
   ```
3. **iOS Simulator** (macOS only) or **Android Emulator/Device**

### Setup

1. **Install Dependencies**:
   ```bash
   cd mobile
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm start
   ```

3. **Run on Device/Emulator**:
   - **iOS**: Press `i` in terminal or scan QR code with Camera app
   - **Android**: Press `a` in terminal or scan QR code with Expo Go app
   - **Web**: Press `w` for web browser

## Configuration

### WebSocket Connection

The app connects to the detection backend via WebSocket. Update the connection URL in `App.js`:

```javascript
const wsService = new WebSocketService('ws://YOUR_IP_ADDRESS:8765');
```

For local development:
- **Android Emulator**: Use `ws://10.0.2.2:8765` (special IP for localhost)
- **iOS Simulator**: Use `ws://localhost:8765`
- **Physical Device**: Use your computer's IP address

### Object Colors

Detection objects are color-coded:
- 🟢 **Green**: Cars
- 🟠 **Orange**: Motorcycles
- 🟡 **Yellow**: Pedestrians

## Components

### Main Components

- **`App.js`**: Main application component with WebSocket integration
- **`Truck3D.js`**: 3D truck model with blind spot zone visualization
- **`DetectionOverlay.js`**: Dynamic object rendering based on detection data

### Services

- **`WebSocketService.js`**: Handles real-time communication with backend

## Usage

1. **Start Backend**: Run the Python detection system first
2. **Launch App**: Start the React Native app
3. **Connect**: The app will automatically connect to the WebSocket server
4. **View Detections**: Objects detected by the backend will appear as colored spheres around the truck
5. **Receive Alerts**: When objects enter blind spot zones, alerts will trigger

### Controls

- **Rotate**: Drag with one finger
- **Zoom**: Pinch to zoom in/out
- **Pan**: Drag with two fingers

## Development

### Project Structure

```
mobile/
├── components/
│   ├── Truck3D.js          # 3D truck visualization
│   └── DetectionOverlay.js # Object detection overlay
├── services/
│   └── WebSocketService.js # WebSocket communication
├── App.js                  # Main app component
├── package.json           # Dependencies
└── README.md             # This file
```

### Adding New Features

1. **New Object Types**: Add to color mapping in `DetectionOverlay.js`
2. **Custom Alerts**: Extend alert system in `App.js`
3. **Additional 3D Models**: Add to `Truck3D.js` component

### Debugging

1. **Console Logs**: Use `console.log()` for debugging
2. **React DevTools**: Available in development mode
3. **Network Inspector**: Check WebSocket connections in browser dev tools

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**:
   - Verify backend is running on correct port (8765)
   - Check IP address configuration
   - Ensure firewall allows WebSocket connections

2. **3D Graphics Not Rendering**:
   - Check Expo GL compatibility
   - Verify Three.js dependencies are installed
   - Try restarting Expo development server

3. **Performance Issues**:
   - Reduce number of detection objects
   - Lower 3D model complexity
   - Check device capabilities

### Debug Mode

Enable debug logging by setting:
```javascript
console.log('Debug: ', data);
```

## Performance Optimization

- **Reduce Object Complexity**: Use simpler 3D models for better performance
- **Limit Concurrent Objects**: Cap maximum number of rendered detection objects
- **Optimize Re-renders**: Use React.memo for static components
- **WebSocket Batching**: Group detection updates to reduce render cycles

## Deployment

### Production Build

1. **Configure for Production**:
   ```bash
   expo build:android
   expo build:ios
   ```

2. **Update Configuration**:
   - Set production WebSocket URLs
   - Optimize assets and models
   - Enable production logging

### App Store Deployment

1. **Android**: Submit `.aab` file to Google Play Store
2. **iOS**: Submit to App Store Connect for TestFlight or App Store

## API Reference

### WebSocketService

#### Methods
- `connect()`: Establish WebSocket connection
- `disconnect()`: Close WebSocket connection
- `send(data)`: Send message to server
- `on(event, callback)`: Register event listener
- `off(event, callback)`: Remove event listener

#### Events
- `connected`: Fired when WebSocket connects
- `disconnected`: Fired when WebSocket disconnects
- `detections`: Fired when detection data is received
- `error`: Fired when connection errors occur

### Detection Data Format

```javascript
{
  object: "car",           // Object type
  position: {              // 3D position
    x: 2.5,               // X coordinate (meters)
    y: -1.0               // Y coordinate (meters)
  },
  confidence: 0.85,        // Detection confidence (0-1)
  bbox: [100, 200, 300, 400], // Bounding box coordinates
  class_id: 2,             // Object class ID
  timestamp: 1234567890.123 // Detection timestamp
}
```

## Contributing

1. Follow React Native best practices
2. Test on multiple devices/platforms
3. Maintain consistent code style
4. Add documentation for new features
5. Ensure performance on target devices

## License

This project is licensed under the MIT License - see the main README for details.
