"""Security Manager — permissions, audit log, secret storage."""

import datetime
import json
import os
from dataclasses import dataclass, field
from typing import Any

from jarvis.database import Database


class SecurityError(Exception):
    pass


@dataclass
class Permission:
    module_id: str
    permission: str
    granted: bool = True
    updated_at: str = ""


@dataclass
class AuditEntry:
    id: int = 0
    module: str = ""
    action: str = ""
    detail: str = ""
    created_at: str = ""


@dataclass
class SecretEntry:
    key: str = ""
    value: str = ""
    category: str = ""
    created_at: str = ""
    updated_at: str = ""


DEFAULT_PERMISSIONS: dict[str, list[str]] = {
    "workspace": ["read", "write", "delete", "list"],
    "knowledge": ["read", "write", "delete", "search"],
    "editor": ["read", "write"],
    "terminal": ["run", "read"],
    "git": ["read", "write", "push", "pull"],
    "network": ["read", "write", "oauth"],
    "models": ["read", "write", "pull", "delete"],
    "agents": ["read", "write", "delete"],
    "orchestration": ["read", "write", "execute"],
    "plugins": ["read", "write", "enable", "disable"],
    "workflows": ["read", "write", "execute"],
    "mcp": ["read", "write", "execute"],
    "security": ["read", "write"],
    "admin": ["all"],
}


class SecurityManager:
    def __init__(self, db: Database):
        self._db = db
        self._ensure_defaults()

    def _ensure_defaults(self):
        for module_id, perms in DEFAULT_PERMISSIONS.items():
            for perm in perms:
                self._db.execute(
                    "INSERT OR IGNORE INTO permissions (module_id, permission, granted) VALUES (?, ?, 1)",
                    (module_id, perm),
                )

    def get_permissions(self) -> list[dict]:
        rows = self._db.fetchall("SELECT * FROM permissions ORDER BY module_id, permission")
        return [
            {"moduleId": r["module_id"], "permission": r["permission"], "granted": bool(r["granted"])}
            for r in rows
        ]

    def get_module_permissions(self, module_id: str) -> list[dict]:
        rows = self._db.fetchall(
            "SELECT * FROM permissions WHERE module_id = ? ORDER BY permission",
            (module_id,),
        )
        return [
            {"moduleId": r["module_id"], "permission": r["permission"], "granted": bool(r["granted"])}
            for r in rows
        ]

    def set_permission(self, module_id: str, permission: str, granted: bool) -> bool:
        now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        self._db.execute(
            """INSERT INTO permissions (module_id, permission, granted, updated_at)
               VALUES (?, ?, ?, ?)
               ON CONFLICT(module_id, permission) DO UPDATE SET
                   granted = excluded.granted,
                   updated_at = excluded.updated_at""",
            (module_id, permission, 1 if granted else 0, now),
        )
        return True

    def check_permission(self, module_id: str, permission: str) -> bool:
        row = self._db.fetchone(
            "SELECT granted FROM permissions WHERE module_id = ? AND permission = ?",
            (module_id, permission),
        )
        return bool(row and row["granted"])

    def get_default_permissions(self) -> dict[str, list[str]]:
        return {k: v for k, v in DEFAULT_PERMISSIONS.items()}

    def log_action(self, module: str, action: str, detail: str = ""):
        self._db.execute(
            """INSERT INTO audit_log (module, action, detail, created_at)
               VALUES (?, ?, ?, ?)""",
            (
                module,
                action,
                detail[:500],
                datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            ),
        )

    def get_audit_log(
        self, module: str = "", limit: int = 50, offset: int = 0
    ) -> list[dict]:
        if module:
            rows = self._db.fetchall(
                "SELECT * FROM audit_log WHERE module = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (module, limit, offset),
            )
        else:
            rows = self._db.fetchall(
                "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (limit, offset),
            )
        return [
            {
                "id": r["id"],
                "module": r["module"],
                "action": r["action"],
                "detail": r["detail"],
                "createdAt": r["created_at"],
            }
            for r in rows
        ]

    def clear_audit_log(self, before_days: int = 90) -> int:
        cutoff = (
            datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=before_days)
        ).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        self._db.execute("DELETE FROM audit_log WHERE created_at < ?", (cutoff,))
        return self._db._db.total_changes

    def store_secret(self, key: str, value: str, category: str = "general") -> bool:
        now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        self._db.execute(
            """INSERT INTO secret_storage (key, value, category, updated_at)
               VALUES (?, ?, ?, ?)
               ON CONFLICT(key) DO UPDATE SET
                   value = excluded.value,
                   category = excluded.category,
                   updated_at = excluded.updated_at""",
            (key, value, category, now),
        )
        return True

    def get_secret(self, key: str) -> str:
        row = self._db.fetchone(
            "SELECT value FROM secret_storage WHERE key = ?", (key,)
        )
        return row["value"] if row else ""

    def delete_secret(self, key: str) -> bool:
        self._db.execute("DELETE FROM secret_storage WHERE key = ?", (key,))
        return True

    def list_secrets(self, category: str = "") -> list[dict]:
        if category:
            rows = self._db.fetchall(
                "SELECT key, category, created_at, updated_at FROM secret_storage WHERE category = ? ORDER BY key",
                (category,),
            )
        else:
            rows = self._db.fetchall(
                "SELECT key, category, created_at, updated_at FROM secret_storage ORDER BY key"
            )
        return [
            {
                "key": r["key"],
                "category": r["category"],
                "createdAt": r["created_at"],
                "updatedAt": r["updated_at"],
            }
            for r in rows
        ]
