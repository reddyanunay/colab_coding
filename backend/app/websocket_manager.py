from typing import Dict, Set
from fastapi import WebSocket
import json
import asyncio

class ConnectionManager:
    
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.room_states: Dict[str, str] = {}
    
    async def connect(self, websocket: WebSocket, room_id: str):
        """Accept and register a new WebSocket connection to a room"""
        await websocket.accept()
        
        if room_id not in self.active_connections:
            self.active_connections[room_id] = set()
        
        self.active_connections[room_id].add(websocket)
        
        # Send current room state to the newly connected user
        if room_id in self.room_states:
            await websocket.send_json({
                "type": "init",
                "code": self.room_states[room_id]
            })
    
    def disconnect(self, websocket: WebSocket, room_id: str):
        """Remove a WebSocket connection from a room"""
        if room_id in self.active_connections:
            self.active_connections[room_id].discard(websocket)
            
            # Clean up empty rooms
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
                # Optionally keep room state for reconnections
                # del self.room_states[room_id]
    
    async def broadcast(self, room_id: str, message: dict, sender: WebSocket = None):
        """
        Broadcast a message to all connections in a room except the sender.
        Uses last-write wins strategy for simplicity.
        """
        if room_id not in self.active_connections:
            return
        
        # Update room state
        if message.get("type") == "code_update":
            self.room_states[room_id] = message.get("code", "")
        
        # Send to all connections except sender
        disconnected = set()
        for connection in self.active_connections[room_id]:
            if connection != sender:
                try:
                    await connection.send_json(message)
                except Exception:
                    # Mark for disconnection if send fails
                    disconnected.add(connection)
        
        # Clean up disconnected connections
        for connection in disconnected:
            self.disconnect(connection, room_id)
    
    def get_connection_count(self, room_id: str) -> int:
        """Get the number of active connections in a room"""
        return len(self.active_connections.get(room_id, set()))
    
    def get_room_state(self, room_id: str) -> str:
        """Get current code state for a room"""
        return self.room_states.get(room_id, "")

# Global connection manager instance
manager = ConnectionManager()
