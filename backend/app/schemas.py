from pydantic import BaseModel
from typing import Optional

class RoomCreate(BaseModel):
    language: Optional[str] = "python"
    initial_code: Optional[str] = "# Start coding here...\n"

class RoomResponse(BaseModel):
    roomId: str
    code: str
    language: str
    
    class Config:
        from_attributes = True

class AutocompleteRequest(BaseModel):
    code: str
    cursorPosition: int
    language: str = "python"

class AutocompleteResponse(BaseModel):
    suggestion: str
    confidence: float = 0.8

class CodeUpdate(BaseModel):
    code: str
    cursorPosition: Optional[int] = None
    userId: Optional[str] = None
