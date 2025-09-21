# SafeDetect Web App

A React.js web application for real-time object detection and blind spot monitoring.

## Features

- **Real-time 3D Visualization**: Interactive 3D truck model with object detection overlays
- **WebSocket Communication**: Real-time connection to the detection backend
- **Blind Spot Monitoring**: Visual and audio alerts for objects in blind spots
- **Responsive Design**: Works on desktop and mobile browsers
- **Modern UI/UX**: Clean dark theme with intuitive user experience

## Technology Stack

- **React 18**: Modern React with hooks
- **React Three Fiber**: 3D graphics rendering
- **Three.js**: 3D graphics library
- **Webpack**: Module bundler
- **WebSocket**: Real-time communication

## Installation

1. Navigate to the web directory:
   ```bash
   cd web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Start the Backend**: Make sure the Python detection backend is running:
   ```bash
   cd ../backend
   source venv/bin/activate
   PYTHONPATH=/Users/aymanallouch/Desktop/SafeDetect python computer_vision/blind_spot.py
   ```

2. **Connect**: The web app will automatically connect to `ws://localhost:8765`

3. **View Detections**: Objects will appear as colored spheres around the 3D truck model:
   - 🟢 Green spheres: Cars
   - 🟠 Orange spheres: Motorcycles  
   - 🟡 Yellow spheres: Pedestrians

4. **Blind Spot Alerts**: Objects in blind spots will trigger visual alerts and browser notifications

## Controls

- **Mouse/Touch**: Rotate, zoom, and pan the 3D scene
- **Reconnect Button**: Manually reconnect to the WebSocket server
- **Responsive**: Works on both desktop and mobile devices

## Development

### Available Scripts

- `npm start`: Start development server
- `npm run build`: Build for production
- `npm run dev`: Start development server and open browser

### Project Structure

```
web/
├── public/
│   └── index.html          # HTML entry point
├── src/
│   ├── components/
│   │   ├── Truck3D.js      # 3D truck model component
│   │   └── DetectionOverlay.js # 3D detection spheres
│   ├── services/
│   │   └── WebSocketService.js # WebSocket communication
│   ├── App.js              # Main application component
│   ├── App.css             # Application styles
│   └── index.js            # React entry point
├── package.json            # Dependencies and scripts
├── webpack.config.js       # Webpack configuration
└── README.md              # This file
```

## Web-Specific Features

### 3D Graphics:
- Built with React Three Fiber for optimal web performance
- Interactive 3D truck model with real-time detection overlays
- WebGL-accelerated rendering for smooth 60 FPS experience

### Responsive Design:
- CSS-based styling with modern web standards
- Responsive layout that works on all screen sizes
- Clean dark theme optimized for visibility

### Browser Integration:
- Native WebSocket support for real-time communication
- Browser notifications for alerts
- Web Vibration API for haptic feedback on supported devices

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile Browsers**: Responsive design works on mobile

## Troubleshooting

### Connection Issues
- Ensure the backend is running on port 8765
- Check firewall settings
- Verify WebSocket URL in browser console

### 3D Rendering Issues
- Ensure WebGL is enabled in your browser
- Try a different browser if 3D doesn't load
- Check browser console for errors

### Performance
- Close other browser tabs for better performance
- Use a modern browser for optimal 3D rendering
- Reduce browser zoom if experiencing lag
