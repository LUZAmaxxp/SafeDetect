#!/usr/bin/env python3
"""
SafeDetect Test Server - Generates fake detection data for testing the mobile app
"""

import asyncio
import json
import websockets
import time
import random
from typing import Set

class TestDetectionServer:
    def __init__(self, host="localhost", port=8765):
        self.host = host
        self.port = port
        self.connected_clients: Set[websockets.WebSocketServerProtocol] = set()
        self.is_running = False
        
    async def register_client(self, websocket):
        """Register a new client connection"""
        self.connected_clients.add(websocket)
        print(f"Client connected. Total clients: {len(self.connected_clients)}")
        
        # Send welcome message
        welcome_msg = {
            "type": "connection",
            "status": "connected",
            "message": "Connected to SafeDetect Test Server"
        }
        await websocket.send(json.dumps(welcome_msg))
        
    async def unregister_client(self, websocket):
        """Unregister a client connection"""
        self.connected_clients.discard(websocket)
        print(f"Client disconnected. Total clients: {len(self.connected_clients)}")
        
    async def handle_client(self, websocket, path=""):
        """Handle individual client connection"""
        await self.register_client(websocket)
        
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    await self.process_client_message(websocket, data)
                except json.JSONDecodeError:
                    print("Received invalid JSON from client")
                except Exception as e:
                    print(f"Error processing client message: {e}")
                    
        except websockets.exceptions.ConnectionClosed:
            print("Client connection closed")
        except Exception as e:
            print(f"Error handling client: {e}")
        finally:
            await self.unregister_client(websocket)
            
    async def process_client_message(self, websocket, data):
        """Process messages received from clients"""
        message_type = data.get("type", "")
        
        if message_type == "ping":
            response = {
                "type": "pong",
                "timestamp": time.time()
            }
            await websocket.send(json.dumps(response))
            
    async def generate_fake_detections(self):
        """Generate fake detection data for testing"""
        object_types = ["car", "motorcycle", "person"]
        colors = {
            "car": "#4CAF50",
            "motorcycle": "#FF9800", 
            "person": "#FFEB3B"
        }
        
        frame_count = 0
        
        while self.is_running:
            if self.connected_clients:
                # Generate 1-3 random detections
                num_detections = random.randint(1, 3)
                detections = []
                
                for i in range(num_detections):
                    obj_type = random.choice(object_types)
                    detection = {
                        "object": obj_type,
                        "position": {
                            "x": random.uniform(-3, 3),
                            "y": random.uniform(-2, 2)
                        },
                        "confidence": random.uniform(0.6, 0.95),
                        "bbox": [
                            random.randint(50, 400),
                            random.randint(50, 300),
                            random.randint(450, 600),
                            random.randint(350, 450)
                        ],
                        "class_id": {"car": 2, "motorcycle": 3, "person": 0}[obj_type],
                        "timestamp": time.time()
                    }
                    detections.append(detection)
                
                # Create message
                message = {
                    "type": "detections",
                    "timestamp": time.time(),
                    "detections": detections
                }
                
                # Send to all connected clients
                json_message = json.dumps(message)
                disconnected_clients = set()
                
                for client in self.connected_clients:
                    try:
                        await client.send(json_message)
                    except websockets.exceptions.ConnectionClosed:
                        disconnected_clients.add(client)
                    except Exception as e:
                        print(f"Error sending to client: {e}")
                        disconnected_clients.add(client)
                
                # Clean up disconnected clients
                for client in disconnected_clients:
                    await self.unregister_client(client)
                
                frame_count += 1
                print(f"Sent detection frame #{frame_count} with {len(detections)} objects")
                
                # Log detections
                for det in detections:
                    print(f"  - {det['object']} (confidence: {det['confidence']:.2f})")
            
            # Wait before next frame
            await asyncio.sleep(0.5)  # 2 FPS for testing
            
    async def start_server(self):
        """Start the test server"""
        if self.is_running:
            print("Server is already running")
            return
            
        try:
            self.server = await websockets.serve(
                self.handle_client,
                self.host,
                self.port,
                ping_interval=20,
                ping_timeout=10
            )
            
            self.is_running = True
            print(f"SafeDetect Test Server started on ws://{self.host}:{self.port}")
            print("Generating fake detection data...")
            
            # Start detection generation task
            asyncio.create_task(self.generate_fake_detections())
            
            # Keep the server running
            await self.server.wait_closed()
            
        except Exception as e:
            print(f"Error starting server: {e}")
            self.is_running = False
            raise
            
    async def stop_server(self):
        """Stop the test server"""
        if not self.is_running:
            return
            
        print("Stopping test server...")
        self.is_running = False
        
        if self.server:
            self.server.close()
            await self.server.wait_closed()
            
        # Close all client connections
        for client in self.connected_clients.copy():
            await self.unregister_client(client)
            
        print("Test server stopped")

async def main():
    """Main function"""
    server = TestDetectionServer()
    
    try:
        await server.start_server()
    except KeyboardInterrupt:
        print("Shutting down server...")
        await server.stop_server()
    except Exception as e:
        print(f"Server error: {e}")

if __name__ == "__main__":
    print("🚀 Starting SafeDetect Test Server...")
    print("This will generate fake detection data for testing the mobile app")
    print("Open http://localhost:19000/index.html in your browser")
    print("Press Ctrl+C to stop")
    asyncio.run(main())
