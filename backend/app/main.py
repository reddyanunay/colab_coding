from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import rooms, autocomplete, websocket

Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS - must be added as middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "null"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(rooms.router, prefix="/rooms", tags=["rooms"])
app.include_router(autocomplete.router, prefix="/autocomplete", tags=["autocomplete"])
app.include_router(websocket.router, tags=["websocket"])

@app.get("/")
async def root():
    return {"message": "Collaborative Coding API"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}
