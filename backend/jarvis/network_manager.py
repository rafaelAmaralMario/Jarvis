"""Network operations — HTTP client, OAuth, API key storage."""

from jarvis.database import Database


class NetworkManager:
    def __init__(self, db: Database):
        self._db = db
