from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import RoomCreate, RoomResponse
from app.services.room_service import RoomService

router = APIRouter()
room_service = RoomService()

@router.post("", response_model=RoomResponse, status_code=201)
async def create_room(
    room_data: RoomCreate = RoomCreate(),
    db: Session = Depends(get_db)
):
    room = room_service.create_room(db, room_data)
    return RoomResponse(
        roomId=room.id,
        code=room.code,
        language=room.language
    )

@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(
    room_id: str,
    db: Session = Depends(get_db)
):
    room = room_service.get_room(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    return RoomResponse(
        roomId=room.id,
        code=room.code,
        language=room.language
    )
