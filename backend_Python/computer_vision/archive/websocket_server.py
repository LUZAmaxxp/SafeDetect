"""
WebSocket Server for Blind Spot Detection System (DEPRECATED)
Streams detection results to connected clients in real-time

DEPRECATED: This server has been replaced by Kafka-based communication.
Use the Kafka producer in detection.py for sending detections.
The WebSocket functionality is disabled but kept for reference.
"""

import asyncio
import json
import websockets
from websockets.server import WebSocketServerProtocol
from typing import Set, Dict, List
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from shared.config import WEBSOCKET_HOST, WEBSOCKET_PORT
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DetectionWebSocketServer:
    def __init__(self, host: str = WEBSOCKET_HOST, port: int = WEBSOCKET_PORT):
        """Initialize the WebSocket server"""
        self.host = host
        self.port = port
        self.connected_clients: Set[WebSocketServerProtocol] = set()
        self.is_running = False
        self.server = None

    async def register_client(self, websocket: WebSocketServerProtocol):
        """Register a new client connection"""
        self.connected_clients.add(websocket)
        logger.info(f"Client connected. Total clients: {len(self.connected_clients)}")

        try:
            # Send welcome message
            welcome_msg = {
                "type": "connection",
                "status": "connected",
                "message": "Connected to SafeDetect Blind Spot Detection System"
            }
            await websocket.send(json.dumps(welcome_msg))
        except Exception as e:
            logger.error(f"Error sending welcome message: {e}")

    async def unregister_client(self, websocket: WebSocketServerProtocol):
        """Unregister a client connection"""
        self.connected_clients.discard(websocket)
        logger.info(f"Client disconnected. Total clients: {len(self.connected_clients)}")

    async def broadcast_detections(self, detections: List[Dict]):
        """Broadcast detection results to all connected clients"""
        if not self.connected_clients:
            return

        # Format detections for WebSocket transmission
        message = {
            "type": "detections",
            "timestamp": asyncio.get_event_loop().time(),
            "detections": detections
        }

        # Convert to JSON
        json_message = json.dumps(message)

        # Send to all connected clients
        disconnected_clients = set()
        for client in self.connected_clients:
            try:
                await client.send(json_message)
            except websockets.exceptions.ConnectionClosed:
                logger.warning("Client connection closed during broadcast")
                disconnected_clients.add(client)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                disconnected_clients.add(client)

        # Clean up disconnected clients
        for client in disconnected_clients:
            await self.unregister_client(client)

    async def handle_client(self, websocket: WebSocketServerProtocol, path: str = ""):
        """Handle individual client connection"""
        await self.register_client(websocket)

        try:
            async for message in websocket:
                # Handle incoming messages from clients
                try:
                    data = json.loads(message)
                    await self.process_client_message(websocket, data)
                except json.JSONDecodeError:
                    logger.warning("Received invalid JSON from client")
                except Exception as e:
                    logger.error(f"Error processing client message: {e}")

        except websockets.exceptions.ConnectionClosed:
            logger.info("Client connection closed")
        except Exception as e:
            logger.error(f"Error handling client: {e}")
        finally:
            await self.unregister_client(websocket)

    async def process_client_message(self, websocket: WebSocketServerProtocol, data: Dict):
        """Process messages received from clients"""
        message_type = data.get("type", "")

        if message_type == "ping":
            # Respond to ping with pong
            response = {
                "type": "pong",
                "timestamp": asyncio.get_event_loop().time()
            }
            await websocket.send(json.dumps(response))

        elif message_type == "status":
            # Send system status
            status = {
                "type": "status",
                "connected_clients": len(self.connected_clients),
                "server_status": "running"
            }
            await websocket.send(json.dumps(status))

        elif message_type == "command":
            # Handle commands from clients
            command = data.get("command", "")
            if command == "get_config":
                config = {
                    "type": "config",
                    "blind_spot_zones": {
                        "left": {"x_min": 0, "x_max": 0.3, "y_min": 0.2, "y_max": 0.8},
                        "right": {"x_min": 0.7, "x_max": 1.0, "y_min": 0.2, "y_max": 0.8},
                        "rear": {"x_min": 0.3, "x_max": 0.7, "y_min": 0.7, "y_max": 1.0}
                    },
                    "object_colors": {
                        "car": "green",
                        "motorcycle": "orange",
                        "person": "yellow"
                    }
                }
                await websocket.send(json.dumps(config))

        else:
            logger.warning(f"Unknown message type: {message_type}")

    async def start_server(self):
        """Start the WebSocket server"""
        if self.is_running:
            logger.warning("Server is already running")
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
            logger.info(f"WebSocket server started on ws://{self.host}:{self.port}")
            logger.info("Waiting for connections...")

            # Keep the server running
            await self.server.wait_closed()

        except Exception as e:
            logger.error(f"Error starting WebSocket server: {e}")
            self.is_running = False
            raise

    async def stop_server(self):
        """Stop the WebSocket server"""
        if not self.is_running:
            return

        logger.info("Stopping WebSocket server...")
        self.is_running = False

        if self.server:
            self.server.close()
            await self.server.wait_closed()

        # Close all client connections
        for client in self.connected_clients.copy():
            await self.unregister_client(client)

        logger.info("WebSocket server stopped")

    def get_status(self) -> Dict:
        """Get server status information"""
        return {
            "is_running": self.is_running,
            "host": self.host,
            "port": self.port,
            "connected_clients": len(self.connected_clients)
        }


async def main():
    """Main function for testing the WebSocket server"""
    server = DetectionWebSocketServer()

    try:
        await server.start_server()
    except KeyboardInterrupt:
        logger.info("Shutting down server...")
        await server.stop_server()
    except Exception as e:
        logger.error(f"Server error: {e}")


if __name__ == "__main__":
    # Run the server
    asyncio.run(main())
