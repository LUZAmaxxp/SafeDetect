"""
WebRTC Server for Blind Spot Detection System
Streams detection results to connected clients in real-time using WebRTC
"""

import asyncio
import json
import sys
import os
from aiortc import RTCPeerConnection, RTCDataChannel, RTCSessionDescription
from aiortc.mediastreams import MediaStreamTrack
import logging

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from shared.config import WEBSOCKET_HOST, WEBSOCKET_PORT  # Reuse config, but we'll use different port for WebRTC

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DetectionWebRTCServer:
    def __init__(self, host: str = WEBSOCKET_HOST, port: int = WEBSOCKET_PORT + 1):  # Use different port
        """Initialize the WebRTC server"""
        self.host = host
        self.port = port
        self.connected_clients = set()
        self.is_running = False
        self.server = None

    async def handle_client(self, reader, writer):
        """Handle individual client connection"""
        peer_connection = RTCPeerConnection()

        # Create data channel for sending detection data
        data_channel = peer_connection.createDataChannel('detections')

        data_channel.onopen = lambda: logger.info("Data channel opened")
        data_channel.onclose = lambda: logger.info("Data channel closed")

        # Handle incoming data channels from client
        @peer_connection.on("datachannel")
        def on_datachannel(channel):
            @channel.on("message")
            def on_message(message):
                try:
                    data = json.loads(message)
                    asyncio.create_task(self.process_client_message(channel, data))
                except json.JSONDecodeError:
                    logger.warning("Received invalid JSON from client")
                except Exception as e:
                    logger.error(f"Error processing client message: {e}")

        # Handle ICE candidates
        @peer_connection.on("icecandidate")
        def on_icecandidate(candidate):
            # In a real implementation, you'd send this to the client via signaling
            pass

        # Handle connection state changes
        @peer_connection.on("connectionstatechange")
        async def on_connectionstatechange():
            logger.info(f"Connection state: {peer_connection.connectionState}")
            if peer_connection.connectionState == "failed":
                await peer_connection.close()
            elif peer_connection.connectionState == "closed":
                self.connected_clients.discard(peer_connection)

        self.connected_clients.add(peer_connection)

        try:
            # Wait for offer from client
            data = await reader.read(1024)
            if not data:
                logger.warning("No data received from client")
                return

            try:
                offer = json.loads(data.decode())
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON received from client: {e}")
                return

            await peer_connection.setRemoteDescription(RTCSessionDescription(**offer))

            # Create answer
            answer = await peer_connection.createAnswer()
            await peer_connection.setLocalDescription(answer)

            # Send answer back to client
            response = json.dumps({
                "type": "answer",
                "sdp": answer.sdp,
                "type": answer.type
            }).encode()
            writer.write(response)
            await writer.drain()

            # Keep connection alive
            while peer_connection.connectionState != "closed":
                await asyncio.sleep(1)

        except Exception as e:
            logger.error(f"Error handling client: {e}")
        finally:
            if peer_connection in self.connected_clients:
                self.connected_clients.discard(peer_connection)
            try:
                await peer_connection.close()
            except Exception as e:
                logger.warning(f"Error closing peer connection: {e}")
            writer.close()
            await writer.wait_closed()

    async def process_client_message(self, channel, data):
        """Process messages received from clients"""
        message_type = data.get("type", "")

        if message_type == "ping":
            # Respond to ping
            response = {
                "type": "pong",
                "timestamp": asyncio.get_event_loop().time()
            }
            channel.send(json.dumps(response))

        elif message_type == "status":
            # Send system status
            status = {
                "type": "status",
                "connected_clients": len(self.connected_clients),
                "server_status": "running"
            }
            channel.send(json.dumps(status))

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
                channel.send(json.dumps(config))

        else:
            logger.warning(f"Unknown message type: {message_type}")

    async def broadcast_detections(self, detections):
        """Broadcast detection results to all connected clients"""
        if not self.connected_clients:
            return

        message = {
            "type": "detections",
            "timestamp": asyncio.get_event_loop().time(),
            "detections": detections
        }

        json_message = json.dumps(message)

        for peer_connection in self.connected_clients.copy():
            if peer_connection.connectionState == "connected":
                for channel in peer_connection._data_channels.values():
                    if channel.readyState == "open":
                        try:
                            channel.send(json_message)
                        except Exception as e:
                            logger.error(f"Error broadcasting to client: {e}")

    async def start_server(self):
        """Start the WebRTC server"""
        if self.is_running:
            logger.warning("Server is already running")
            return

        try:
            self.server = await asyncio.start_server(
                self.handle_client,
                self.host,
                self.port
            )

            self.is_running = True
            logger.info(f"WebRTC server started on {self.host}:{self.port}")
            logger.info("Waiting for connections...")

            # Keep the server running
            async with self.server:
                await self.server.serve_forever()

        except Exception as e:
            logger.error(f"Error starting WebRTC server: {e}")
            self.is_running = False
            raise

    async def stop_server(self):
        """Stop the WebRTC server"""
        if not self.is_running:
            return

        logger.info("Stopping WebRTC server...")
        self.is_running = False

        if self.server:
            self.server.close()
            await self.server.wait_closed()

        # Close all client connections
        for peer_connection in self.connected_clients.copy():
            try:
                await peer_connection.close()
            except Exception as e:
                logger.warning(f"Error closing peer connection: {e}")

        logger.info("WebRTC server stopped")

    def get_status(self):
        """Get server status information"""
        return {
            "is_running": self.is_running,
            "host": self.host,
            "port": self.port,
            "connected_clients": len(self.connected_clients)
        }


async def main():
    """Main function for testing the WebRTC server"""
    server = DetectionWebRTCServer()

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
