from sqlalchemy.orm import Session
from app.models import Room
from app.schemas import RoomCreate
import uuid

class RoomService:
    
    def create_room(self, db: Session, room_data: RoomCreate):
        room = Room(
            id=str(uuid.uuid4()),
            code=room_data.initial_code,
            language=room_data.language
        )
        db.add(room)
        db.commit()
        db.refresh(room)
        return room
    
    def get_room(self, db: Session, room_id: str):
        return db.query(Room).filter(Room.id == room_id).first()
    
    def update_room_code(self, db: Session, room_id: str, code: str):
        room = db.query(Room).filter(Room.id == room_id).first()
        if room:
            room.code = code
            db.commit()
            db.refresh(room)
        return room
