from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.websocket_manager import manager
from app.services.room_service import RoomService
import json
import logging

router = APIRouter()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
room_service = RoomService()

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: str,
    db: Session = Depends(get_db)
):
    room = room_service.get_room(db, room_id)
    if not room:
        await websocket.close(code=4004, reason="Room not found")
        return
    
    # Connect to room
    await manager.connect(websocket, room_id)
    
    user_count = manager.get_connection_count(room_id)
    
    # Send current count to the newly joined user
    await websocket.send_json({
        "type": "user_count_update",
        "count": user_count
    })
    
    # Notify all OTHER users that someone joined
    await manager.broadcast(
        room_id,
        {"type": "user_joined", "count": user_count},
        sender=websocket
    )
    
    logger.info(f"User connected to room {room_id}. Total users: {user_count}")
    
    try:
        while True:
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                
                if message.get("type") == "code_update":
                    code = message.get("code", "")
                    room_service.update_room_code(db, room_id, code)
                    await manager.broadcast(room_id, message, sender=websocket)
                
                elif message.get("type") == "cursor_update":
                    await manager.broadcast(room_id, message, sender=websocket)
            
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON"
                })
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        user_count = manager.get_connection_count(room_id)
        await manager.broadcast(
            room_id,
            {"type": "user_left", "count": user_count}
        )
        logger.info(f"User disconnected from room {room_id}")
    
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        manager.disconnect(websocket, room_id)
