"""Network operations — HTTP client, OAuth, API key storage."""

import os
import threading
import uuid
from dataclasses import dataclass, field

import httpx

from jarvis.database import Database


_HTTP_TIMEOUT = 30
_OAUTH_REDIRECT_URI = "http://localhost/callback"


@dataclass
class HttpResponse:
    status_code: int = 0
    body: str = ""
    headers: dict[str, str] = field(default_factory=dict)


class NetworkManager:
    def __init__(self, db: Database):
        self._db = db
        self._http = httpx.Client(timeout=_HTTP_TIMEOUT)
        self._lock = threading.Lock()
        self._ws_url = ""
        self._ws_callbacks: dict[str, callable] = {}
        self._oauth_states: dict[str, str] = {}

    def get(self, url: str, headers: dict[str, str] | None = None) -> HttpResponse:
        try:
            response = self._http.get(url, headers=headers)
            return HttpResponse(
                status_code=response.status_code,
                body=response.text,
                headers=dict(response.headers),
            )
        except httpx.HTTPError:
            return HttpResponse(status_code=-1, body="HTTP_ERROR")

    def post(
        self,
        url: str,
        body: str = "",
        content_type: str = "",
        headers: dict[str, str] | None = None,
    ) -> HttpResponse:
        req_headers = dict(headers or {})
        if content_type:
            req_headers.setdefault("Content-Type", content_type)
        try:
            response = self._http.post(url, content=body, headers=req_headers)
            return HttpResponse(
                status_code=response.status_code,
                body=response.text,
                headers=dict(response.headers),
            )
        except httpx.HTTPError:
            return HttpResponse(status_code=-1, body="HTTP_ERROR")

    def start_oauth(self, provider: str) -> str:
        if provider == "github":
            client_id = self._get_oauth_client_id("github")
            if not client_id:
                return ""
            state = uuid.uuid4().hex
            with self._lock:
                self._oauth_states["github"] = state
            return (
                f"https://github.com/login/oauth/authorize"
                f"?client_id={client_id}"
                f"&scope=repo,user"
                f"&state={state}"
                f"&redirect_uri={_OAUTH_REDIRECT_URI}"
            )
        return ""

    def complete_oauth(self, provider: str, code: str) -> str:
        if provider == "github":
            client_id = self._get_oauth_client_id("github")
            client_secret = self._get_oauth_client_secret("github")
            if not client_id or not client_secret:
                return ""

            payload = {
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
            }
            try:
                response = self._http.post(
                    "https://github.com/login/oauth/access_token",
                    json=payload,
                    headers={"Accept": "application/json"},
                )
                if response.status_code == 200:
                    token = response.json().get("access_token", "")
                    if token:
                        self._store_token(provider, token)
                        return token
            except httpx.HTTPError:
                pass
        return ""

    def get_stored_token(self, provider: str) -> str:
        row = self._db.fetchone(
            "SELECT token FROM oauth_tokens WHERE provider = ?",
            (provider,),
        )
        return row["token"] if row else ""

    def clear_token(self, provider: str) -> bool:
        self._db.execute(
            "DELETE FROM oauth_tokens WHERE provider = ?",
            (provider,),
        )
        return True

    def store_api_key(self, service: str, key: str) -> bool:
        self._db.execute(
            "INSERT OR REPLACE INTO api_keys (service, key_encrypted) VALUES (?, ?)",
            (service, key),
        )
        return True

    def get_api_key(self, service: str) -> str:
        row = self._db.fetchone(
            "SELECT key_encrypted FROM api_keys WHERE service = ?",
            (service,),
        )
        return row["key_encrypted"] if row else ""

    def delete_api_key(self, service: str) -> bool:
        self._db.execute(
            "DELETE FROM api_keys WHERE service = ?",
            (service,),
        )
        return True

    def list_api_keys(self) -> list[dict[str, str]]:
        rows = self._db.fetchall(
            "SELECT service, key_encrypted FROM api_keys ORDER BY service"
        )
        return [{"service": r["service"], "key": r["key_encrypted"]} for r in rows]

    def save_oauth_token(
        self,
        provider: str,
        token: str,
        refresh_token: str = "",
        expires_at: str = "",
    ) -> bool:
        self._db.execute(
            """INSERT OR REPLACE INTO oauth_tokens
               (provider, token, refresh_token, expires_at)
               VALUES (?, ?, ?, ?)""",
            (provider, token, refresh_token, expires_at),
        )
        return True

    def _get_oauth_client_id(self, provider: str) -> str:
        key = self.get_api_key(f"{provider}_client_id")
        if not key:
            key = os.environ.get(f"{provider.upper()}_CLIENT_ID", "")
        return key

    def _get_oauth_client_secret(self, provider: str) -> str:
        key = self.get_api_key(f"{provider}_client_secret")
        if not key:
            key = os.environ.get(f"{provider.upper()}_CLIENT_SECRET", "")
        return key

    def _store_token(self, provider: str, token: str) -> None:
        self.save_oauth_token(provider, token)
