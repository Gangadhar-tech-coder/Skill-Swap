"""
WebSocket consumer for real-time session chat.
Replaces FastAPI WebSocket router with Django Channels.
"""
import json
from datetime import datetime
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class ChatConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time chat in skill exchange sessions."""

    async def connect(self):
        self.session_id = self.scope["url_route"]["kwargs"]["session_id"]
        self.room_group_name = f"chat_{self.session_id}"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": json.dumps({
                    "type": "system",
                    "message": "A user has left the chat",
                    "timestamp": datetime.utcnow().isoformat(),
                }),
            },
        )

    async def receive(self, text_data):
        message = json.loads(text_data)
        timestamp = message.get("timestamp", datetime.utcnow().isoformat())
        message["timestamp"] = timestamp
        message["session_id"] = int(self.session_id)

        # Save to database
        if "sender_id" in message:
            await self.save_message(message)

        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "chat_message", "message": json.dumps(message)},
        )

    async def chat_message(self, event):
        await self.send(text_data=event["message"])

    @database_sync_to_async
    def save_message(self, message):
        from .models import ChatMessage
        try:
            ts = message.get("timestamp", "")
            if isinstance(ts, str):
                try:
                    dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                except Exception:
                    dt = datetime.utcnow()
            else:
                dt = datetime.utcnow()

            ChatMessage.objects.create(
                session_id=message["session_id"],
                sender_id=message["sender_id"],
                message=message.get("message", ""),
                timestamp=dt,
            )
        except Exception as e:
            print(f"Error saving message: {e}")
