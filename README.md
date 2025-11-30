# Real-Time Collaborative Coding Platform

A full-stack application for real-time pair programming with WebSocket-based collaboration, intelligent autocomplete, and a modern TypeScript frontend.

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue.svg)](https://www.postgresql.org/)

## Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [API Documentation](#-api-documentation)
- [Future Improvements](#-future-improvements)

---

## Features

### Core Features

1. **Room Management**
   - Create new coding rooms with auto-generated UUIDs
   - Join existing rooms via room ID
   - No authentication required for quick collaboration

2. **Real-Time Collaboration**
   - WebSocket-based bidirectional communication
   - Instant code synchronization across all users in a room
   - Live user count tracking
   - Connection state management with auto-reconnect

3. **Smart Autocomplete**
   - Inline ghost text suggestions
   - Context-aware pattern matching for Python & JavaScript
   - 400ms debounced trigger for optimal UX
   - Tab to accept, Escape to dismiss

### Bonus Features

- **TypeScript Frontend** - Type-safe code with interfaces
- **Inline Ghost Text** - Professional autocomplete UI
- **Auto-Reconnect** - Resilient WebSocket connections (5 retries)
- **Visual Feedback** - Real-time status indicators and notifications
- **Database Persistence** - Room state survives server restarts
- **Clean Architecture** - Service layer pattern, separation of concerns

---

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **WebSockets** - Real-time bidirectional communication
- **PostgreSQL** - Persistent room storage
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation and serialization
- **Uvicorn** - ASGI server

### Frontend
- **TypeScript** - Type-safe JavaScript
- **Native Web APIs** - WebSocket, Fetch API
- **CSS3** - Modern styling with flexbox/grid
- **ES2020+** - Modern JavaScript features

### Infrastructure
- **Python 3.11+**
- **Node.js 16+**
- **PostgreSQL 13+**

---

## Project Structure

```
collaborative-coding/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI app & CORS config
│   │   ├── config.py          # Environment configuration
│   │   ├── database.py        # Database connection & session
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── websocket_manager.py  # WebSocket connection manager
│   │   ├── routers/           # API route handlers
│   │   │   ├── rooms.py       # Room CRUD operations
│   │   │   ├── autocomplete.py # Autocomplete endpoint
│   │   │   └── websocket.py   # WebSocket endpoint
│   │   └── services/          # Business logic layer
│   │       ├── room_service.py
│   │       └── autocomplete_service.py
│   ├── .env.example           # Environment variables template
│   ├── requirements.txt       # Python dependencies
│   ├── start.bat             # Windows startup script
│   └── README.md             # Backend documentation
│
├── frontend/                  # TypeScript Frontend
│   ├── src/                  # TypeScript source
│   │   ├── landing.ts        # Landing page logic
│   │   └── editor.ts         # Editor page logic
│   ├── dist/                 # Compiled JavaScript
│   ├── landing.html          # Landing page
│   ├── editor.html           # Editor page
│   ├── tsconfig.json         # TypeScript config
│   ├── package.json          # NPM dependencies
│   └── start.bat            # Windows startup script
│
└── README.md                 # This file
```

---

## Quick Start

### Prerequisites

1. **Python 3.11+** - [Download](https://www.python.org/downloads/)
2. **PostgreSQL** - [Download](https://www.postgresql.org/download/)
3. **Node.js 16+** - [Download](https://nodejs.org/)

### Step 1: Database Setup

```sql
-- Create database
CREATE DATABASE collaborative_coding;

-- Create user (optional)
CREATE USER collab_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE collaborative_coding TO collab_user;
```

### Step 2: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run backend
uvicorn app.main:app --reload
# Server runs on http://localhost:8000
# API docs at http://localhost:8000/docs
```

### Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Compile TypeScript
npm run build

# Start server
npm run serve
# Or use Python:
python -m http.server 3000

# Open browser
# Navigate to http://localhost:3000/landing.html
```

### Quick Start Scripts (Windows)

```bash
# Backend
cd backend
start.bat

# Frontend
cd frontend
start.bat
```

---

## Architecture

### System Architecture

```
┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │
│   Frontend      │◄───────►│   Backend       │
│   (Browser)     │  HTTP   │   (FastAPI)     │
│                 │         │                 │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │ WebSocket                 │
         │ Connection                │
         │                           │
         ▼                           ▼
    ┌────────────────────────────────────┐
    │     WebSocket Manager              │
    │  (In-Memory Connection Pool)       │
    └────────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────┐
         │   PostgreSQL     │
         │   (Persistent    │
         │    Storage)      │
         └──────────────────┘
```

### Data Flow

#### 1. Room Creation
```
User → POST /rooms → Backend → Database
                  ↓
            Generate UUID
                  ↓
        Return {roomId, code, language}
                  ↓
     Frontend redirects to editor
```

#### 2. Real-Time Collaboration
```
User A types "hello"
      ↓
WebSocket send({type: "code_update", code: "hello"})
      ↓
Backend receives
      ↓
Save to database (persistent)
      ↓
Broadcast to all users EXCEPT sender
      ↓
User B & C see "hello" appear instantly
```

#### 3. Autocomplete Flow
```
User stops typing for 400ms
      ↓
POST /autocomplete {code, cursorPosition, language}
      ↓
Pattern matching service
      ↓
Return suggestion
      ↓
Display as ghost text (gray italic)
      ↓
User presses Tab → Accept
```

### Backend Architecture

#### Layered Architecture Pattern

```
┌─────────────────────────────────────┐
│         Routers Layer               │  ← HTTP/WebSocket endpoints
│  (rooms.py, websocket.py, etc.)     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       Services Layer                │  ← Business logic
│  (room_service, autocomplete)       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         Models Layer                │  ← Data models
│    (SQLAlchemy, Pydantic)           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│        Database Layer               │  ← PostgreSQL
└─────────────────────────────────────┘
```

### WebSocket Connection Manager

**Singleton Pattern** - One global manager instance

```python
class ConnectionManager:
    active_connections: Dict[str, Set[WebSocket]]
    room_states: Dict[str, str]  # In-memory cache
    
    - connect(websocket, room_id)
    - disconnect(websocket, room_id)
    - broadcast(room_id, message, sender)
    - get_connection_count(room_id)
```

**Why both in-memory and database?**
- **In-memory (ConnectionManager):** Fast reads/writes for real-time sync
- **Database (PostgreSQL):** Persistence across restarts, room rejoining

### Frontend Architecture

#### TypeScript Modules

```typescript
// landing.ts - Room management
interface RoomData {
    roomId: string;
    code: string;
    language: string;
}

// editor.ts - Real-time collaboration
interface WebSocketMessage {
    type: string;
    code?: string;
    count?: number;
}

// Type-safe DOM manipulation
const editor = document.getElementById('codeEditor') as HTMLTextAreaElement;
```

#### Component Structure

```
Landing Page (landing.html)
├── Create Room Form
├── Join Room Form
└── Error/Loading States

Editor Page (editor.html)
├── Header
│   ├── Room Info (ID, language, user count)
│   ├── Connection Status
│   └── Leave Button
├── Code Editor
│   ├── Textarea
│   ├── Ghost Text Overlay (autocomplete)
│   └── Hint Display
└── Footer
    ├── Autocomplete Preview
    └── Last Update Timestamp
```

---

## API Documentation

### REST Endpoints

#### 1. Create Room
```http
POST /rooms
Content-Type: application/json

Request Body (Optional):
{
    "language": "python",
    "initial_code": "# Start coding..."
}

Response: 201 Created
{
    "roomId": "uuid-string",
    "code": "# Start coding...",
    "language": "python"
}
```

#### 2. Get Room
```http
GET /rooms/{room_id}

Response: 200 OK
{
    "roomId": "uuid-string",
    "code": "existing code...",
    "language": "python"
}

Response: 404 Not Found
{
    "detail": "Room not found"
}
```

#### 3. Autocomplete
```http
POST /autocomplete
Content-Type: application/json

Request Body:
{
    "code": "def hello",
    "cursorPosition": 9,
    "language": "python"
}

Response: 200 OK
{
    "suggestion": "(self):",
    "confidence": 0.9
}
```

### WebSocket Endpoint

```
WS /ws/{room_id}
```

#### Client → Server Messages

**Code Update:**
```json
{
    "type": "code_update",
    "code": "full code content",
    "language": "python"
}
```

**Cursor Update:**
```json
{
    "type": "cursor_update",
    "position": 42
}
```

#### Server → Client Messages

**Initial State:**
```json
{
    "type": "init",
    "code": "existing code"
}
```

**User Count Update:**
```json
{
    "type": "user_count_update",
    "count": 2
}
```

**User Joined:**
```json
{
    "type": "user_joined",
    "count": 3
}
```

**User Left:**
```json
{
    "type": "user_left",
    "count": 2
}
```

**Code Update:**
```json
{
    "type": "code_update",
    "code": "updated code"
}
```

**Error:**
```json
{
    "type": "error",
    "message": "Error description"
}
```

### Interactive API Docs

Visit `http://localhost:8000/docs` for interactive Swagger UI documentation.

---


## Future Improvements

1. **Operational Transformation / CRDTs**
   - Conflict-free concurrent editing
   - Position-aware transformations
   - More robust for 10+ users

2. **Real AI Integration**
   ```python
   # OpenAI Codex or similar
   async def get_ai_suggestion(code: str) -> str:
       response = await openai.Completion.create(
           model="code-davinci-002",
           prompt=code,
           max_tokens=50
       )
       return response.choices[0].text
   ```

3. **Syntax Highlighting**
   - Monaco Editor or CodeMirror
   - Language-specific themes
   - Better code readability

4. **Authentication & Authorization**
   - User accounts (JWT tokens)
   - Room ownership
   - Private/public rooms
   - Access control

5. **Cursor Position Indicators**
   - Show other users' cursors
   - Color-coded per user
   - Real-time position updates

6. **Code Execution**
   - Sandbox environment
   - Run Python/JavaScript code
   - Display output panel

7. **Chat Feature**
   - WebSocket-based chat
   - Persistent message history
   - @mentions

8. **Version History**
   - Git-like commits
   - Rollback to previous versions
   - Diff visualization

9. **Multiple Files**
   - Tab-based file system
   - File tree navigation
   - Import/export project

10. **Theme Customization**
    - Light/dark modes
    - Custom color schemes
    - Font size adjustment

11. **Mobile Support**
    - Responsive design
    - Touch-optimized editor
    - Mobile keyboards

12. **Horizontal Scaling**
    ```
    ┌────────┐    ┌────────┐
    │ Server │◄──►│ Redis  │◄──►┌────────┐
    │   1    │    │ Pub/Sub│    │ Server │
    └────────┘    └────────┘    │   2    │
                                 └────────┘
    ```
    - Redis for cross-server messaging
    - Load balancer
    - Shared session store

---
