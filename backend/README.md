# Collaborative Coding Backend

A FastAPI backend for real-time pair-programming. Users can join the same room and edit code together with instant synchronization.

## Features

- Room management with unique IDs
- Real-time code synchronization via WebSockets
- Basic autocomplete suggestions
- PostgreSQL database storage

## Tech Stack

- FastAPI
- WebSockets
- PostgreSQL with SQLAlchemy
- Python 3.9+

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI application entry point
│   ├── config.py                # Configuration settings
│   ├── database.py              # Database connection and session
│   ├── models.py                # SQLAlchemy models
│   ├── schemas.py               # Pydantic schemas for validation
│   ├── websocket_manager.py     # WebSocket connection manager
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── rooms.py             # Room creation/retrieval endpoints
│   │   ├── autocomplete.py      # Autocomplete endpoint
│   │   └── websocket.py         # WebSocket endpoint
│   └── services/
│       ├── __init__.py
│       ├── room_service.py      # Room business logic
│       └── autocomplete_service.py  # Autocomplete logic
├── requirements.txt
├── .env.example
└── .gitignore
```

## Setup

### Prerequisites

- Python 3.9+
- PostgreSQL installed
- pip

### Installation Steps

1. Create virtual environment:
```bash
python -m venv venv
.\venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Setup PostgreSQL:
```sql
CREATE DATABASE collab_coding;
CREATE USER username WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE collab_coding TO username;
```

4. Configure environment:
```bash
copy .env.example .env
```
Edit `.env` with your database credentials.

5. Run the server:
```bash
uvicorn app.main:app --reload
```

6. Check: http://localhost:8000/docs

## API Endpoints

### REST Endpoints

#### 1. Create Room
```http
POST /rooms
Content-Type: application/json

{
  "language": "python",
  "initial_code": "# Start coding here...\n"
}

Response:
{
  "roomId": "550e8400-e29b-41d4-a716-446655440000",
  "code": "# Start coding here...\n",
  "language": "python"
}
```

#### 2. Get Room
```http
GET /rooms/{room_id}

Response:
{
  "roomId": "550e8400-e29b-41d4-a716-446655440000",
  "code": "# Current code content",
  "language": "python"
}
```

#### 3. Autocomplete
```http
POST /autocomplete
Content-Type: application/json

{
  "code": "def calc",
  "cursorPosition": 8,
  "language": "python"
}

Response:
{
  "suggestion": "def function_name():\n    pass",
  "confidence": 0.85
}
```

### WebSocket

Connect to: `WS /ws/{room_id}`

Send:
```json
{"type": "code_update", "code": "...", "cursorPosition": 10}
```

Receive:
```json
{"type": "init", "code": "..."}
{"type": "user_joined", "count": 2}
{"type": "code_update", "code": "..."}
```

## Testing

Create a room:
```bash
curl -X POST http://localhost:8000/rooms
```

Test WebSocket:
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/abc-123');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
ws.send(JSON.stringify({type: 'code_update', code: 'print("test")'}));
```

## Design

- Last-write wins for code updates
- WebSocket manager handles connections
- Service layer for business logic
- Basic autocomplete with keyword matching

## Possible Improvements

- Better conflict resolution (OT or CRDT)
- Real AI autocomplete integration
- User authentication
- Code history/versioning
- Redis for scaling

## Known Limitations

- No conflict resolution for simultaneous edits
- No authentication
- In-memory state (doesn't scale horizontally)
- Basic autocomplete

## Troubleshooting

PostgreSQL not connecting? Check `.env` credentials and ensure PostgreSQL service is running.
