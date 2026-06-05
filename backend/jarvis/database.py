import sqlite3
import threading
from pathlib import Path


class Database:
    def __init__(self, db_path: str | Path):
        self._lock = threading.RLock()
        self._db = sqlite3.connect(str(db_path), check_same_thread=False)
        self._db.isolation_level = None
        self._db.execute("PRAGMA journal_mode=WAL")
        self._db.execute("PRAGMA synchronous=NORMAL")
        self._db.execute("PRAGMA foreign_keys=ON")
        self._db.execute("PRAGMA busy_timeout=5000")
        self._db.row_factory = sqlite3.Row

    def exec(self, sql: str) -> None:
        with self._lock:
            self._db.execute("BEGIN")
            try:
                self._db.executescript(sql)
                self._db.commit()
            except Exception:
                self._db.rollback()
                raise

    def execute(self, sql: str, params: tuple = ()) -> sqlite3.Cursor:
        with self._lock:
            return self._db.execute(sql, params)

    def executemany(self, sql: str, seq: list[tuple]) -> None:
        with self._lock:
            self._db.executemany(sql, seq)
            self._db.commit()

    def fetchone(self, sql: str, params: tuple = ()) -> sqlite3.Row | None:
        with self._lock:
            return self._db.execute(sql, params).fetchone()

    def fetchall(self, sql: str, params: tuple = ()) -> list[sqlite3.Row]:
        with self._lock:
            return self._db.execute(sql, params).fetchall()

    def last_insert_id(self) -> int:
        return self._db.execute("SELECT last_insert_rowid()").fetchone()[0]

    def begin(self) -> None:
        self._db.execute("BEGIN")

    def commit(self) -> None:
        self._db.commit()

    def rollback(self) -> None:
        self._db.rollback()

    def checkpoint(self) -> None:
        self._db.execute("PRAGMA wal_checkpoint(TRUNCATE)")

    def close(self) -> None:
        self._db.close()

    @property
    def connection(self) -> sqlite3.Connection:
        return self._db
