"""Chat conversation persistence — uses existing SQLite tables."""

import datetime
import logging
import uuid
from typing import Any

from jarvis.database import Database

logger = logging.getLogger(__name__)


class ChatManager:
    def __init__(self, db: Database):
        self._db = db

    def list_conversations(self) -> list[dict[str, Any]]:
        rows = self._db.fetchall(
            "SELECT id, agent_id, title, model, created_at, updated_at, "
            "(SELECT COUNT(*) FROM conversation_messages WHERE conversation_id = id) AS message_count "
            "FROM agent_conversations ORDER BY updated_at DESC"
        )
        return [dict(r) for r in rows]

    def get_conversation(self, conv_id: str) -> dict[str, Any] | None:
        row = self._db.fetchone(
            "SELECT id, agent_id, title, model, created_at, updated_at "
            "FROM agent_conversations WHERE id = ?",
            (conv_id,),
        )
        if not row:
            return None
        return dict(row)

    def get_messages(self, conv_id: str) -> list[dict[str, Any]]:
        rows = self._db.fetchall(
            "SELECT id, role, content, agent_id, model, tokens_used, latency_ms, created_at "
            "FROM conversation_messages WHERE conversation_id = ? ORDER BY created_at ASC",
            (conv_id,),
        )
        return [dict(r) for r in rows]

    def create_conversation(self, title: str = "Nova conversa", agent_id: str | None = None, model: str = "") -> dict[str, Any]:
        conv_id = uuid.uuid4().hex
        now = _now()
        self._db.execute(
            "INSERT INTO agent_conversations (id, agent_id, title, model, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (conv_id, agent_id, title, model, now, now),
        )
        return {
            "id": conv_id,
            "agentId": agent_id,
            "title": title,
            "model": model,
            "createdAt": now,
            "updatedAt": now,
            "messageCount": 0,
        }

    def update_conversation_title(self, conv_id: str, title: str) -> bool:
        self._db.execute(
            "UPDATE agent_conversations SET title = ?, updated_at = ? WHERE id = ?",
            (title, _now(), conv_id),
        )
        return True

    def delete_conversation(self, conv_id: str) -> bool:
        self._db.execute("DELETE FROM conversation_messages WHERE conversation_id = ?", (conv_id,))
        self._db.execute("DELETE FROM agent_conversations WHERE id = ?", (conv_id,))
        return True

    def save_message(
        self,
        conv_id: str,
        role: str,
        content: str,
        agent_id: str | None = None,
        model: str | None = None,
        tokens_used: int = 0,
        latency_ms: int = 0,
    ) -> dict[str, Any]:
        msg_id = uuid.uuid4().hex
        now = _now()
        self._db.execute(
            "INSERT INTO conversation_messages (id, conversation_id, role, content, agent_id, model, tokens_used, latency_ms, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (msg_id, conv_id, role, content, agent_id, model, tokens_used, latency_ms, now),
        )
        self._db.execute(
            "UPDATE agent_conversations SET updated_at = ? WHERE id = ?",
            (now, conv_id),
        )
        return {
            "id": msg_id,
            "role": role,
            "content": content,
            "agentId": agent_id,
            "model": model,
            "tokensUsed": tokens_used,
            "latencyMs": latency_ms,
            "createdAt": now,
        }

    def auto_title(self, conv_id: str, first_message: str) -> str:
        title = first_message[:60].strip()
        if len(first_message) > 60:
            title += "..."
        self.update_conversation_title(conv_id, title)
        return title


def _now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
