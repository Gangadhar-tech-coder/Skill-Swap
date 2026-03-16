"""
WebSocket router for real-time session chat.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from typing import Dict, List
import json
from datetime import datetime

from ..database import get_db, SessionLocal
from ..models import ChatMessage, User
from ..schemas import ChatMessageResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/chat", tags=["Chat"])
# Store active connections per session
# Key: session_id, Value: list of WebSocket connections
active_connections: Dict[int, List[WebSocket]] = {}


class ConnectionManager:
    """Manages WebSocket connections for real-time chat."""

    def __init__(self):
        self.connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: int):
        """Accept a new WebSocket connection and add it to the session room."""
        await websocket.accept()
        if session_id not in self.connections:
            self.connections[session_id] = []
        self.connections[session_id].append(websocket)

    def disconnect(self, websocket: WebSocket, session_id: int):
        """Remove a WebSocket connection from the session room."""
        if session_id in self.connections:
            self.connections[session_id] = [
                conn for conn in self.connections[session_id] if conn != websocket
            ]
            if not self.connections[session_id]:
                del self.connections[session_id]

    async def broadcast(self, session_id: int, message: dict):
        """Broadcast a message to all connections in a session room."""
        if session_id in self.connections:
            message_json = json.dumps(message)
            for connection in self.connections[session_id]:
                try:
                    await connection.send_text(message_json)
                except Exception:
                    pass


# Global connection manager instance
manager = ConnectionManager()


@router.websocket("/ws/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: int):
    """
    WebSocket endpoint for real-time session chat.
    Messages are broadcast to all participants in the same session and saved to DB.
    """
    await manager.connect(websocket, session_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            timestamp = message.get("timestamp", datetime.utcnow().isoformat())
            message["timestamp"] = timestamp
            message["session_id"] = session_id
            
            # Save to database
            if "sender_id" in message:
                db = SessionLocal()
                try:
                    db_msg = ChatMessage(
                        session_id=session_id,
                        sender_id=message["sender_id"],
                        message=message.get("message", ""),
                        timestamp=datetime.fromisoformat(timestamp.replace('Z', '+00:00')) if isinstance(timestamp, str) else datetime.utcnow()
                    )
                    db.add(db_msg)
                    db.commit()
                except Exception as e:
                    print(f"Error saving message: {e}")
                finally:
                    db.close()

            await manager.broadcast(session_id, message)
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
        await manager.broadcast(session_id, {
            "type": "system",
            "message": "A user has left the chat",
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception:
        manager.disconnect(websocket, session_id)

@router.get("/history/{session_id}", response_model=List[ChatMessageResponse])
def get_chat_history(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve the chat history for a session."""
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.timestamp.asc()).all()
    # Pydantic schemas expect a string timestamp typically, but from_attributes converts datetime models
    # We will format it slightly to match the schema
    result = []
    for msg in messages:
        result.append({
            "id": msg.id,
            "session_id": msg.session_id,
            "sender_id": msg.sender_id,
            "message": msg.message,
            "timestamp": msg.timestamp.isoformat()
        })
    return result
