import pytest

from jarvis.database import Database


@pytest.fixture
def db(tmp_path):
    d = Database(tmp_path / "test.db")
    yield d
    d.close()


def test_open_creates_file(tmp_path):
    p = tmp_path / "test.db"
    d = Database(p)
    assert p.exists()
    d.close()


def test_exec_creates_table(db):
    db.exec("CREATE TABLE IF NOT EXISTS foo (id INTEGER PRIMARY KEY, val TEXT)")
    rows = db.fetchall("SELECT name FROM sqlite_master WHERE type='table' AND name='foo'")
    assert len(rows) == 1


def test_exec_multiple_statements(db):
    db.exec("""
        CREATE TABLE t1 (a INTEGER);
        CREATE TABLE t2 (b TEXT);
    """)
    assert len(db.fetchall("SELECT name FROM sqlite_master WHERE type='table' AND name='t1'")) == 1
    assert len(db.fetchall("SELECT name FROM sqlite_master WHERE type='table' AND name='t2'")) == 1


def test_insert_and_fetch(db):
    db.exec("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)")
    db.execute("INSERT INTO test (id, name) VALUES (?, ?)", (1, "hello"))
    row = db.fetchone("SELECT * FROM test WHERE id = ?", (1,))
    assert row is not None
    assert row["name"] == "hello"


def test_fetchall(db):
    db.exec("CREATE TABLE nums (v INTEGER)")
    for i in range(5):
        db.execute("INSERT INTO nums (v) VALUES (?)", (i,))
    rows = db.fetchall("SELECT * FROM nums ORDER BY v")
    assert len(rows) == 5
    assert [r["v"] for r in rows] == [0, 1, 2, 3, 4]


def test_last_insert_id(db):
    db.exec("CREATE TABLE t (id INTEGER PRIMARY KEY AUTOINCREMENT, v TEXT)")
    db.execute("INSERT INTO t (v) VALUES (?)", ("a",))
    assert db.last_insert_id() == 1


def test_transaction_commit(db):
    db.exec("CREATE TABLE t (v TEXT)")
    db.begin()
    db.execute("INSERT INTO t (v) VALUES (?)", ("x",))
    db.commit()
    assert len(db.fetchall("SELECT * FROM t")) == 1


def test_transaction_rollback(db):
    db.exec("CREATE TABLE t (v TEXT)")
    db.begin()
    db.execute("INSERT INTO t (v) VALUES (?)", ("y",))
    db.rollback()
    assert len(db.fetchall("SELECT * FROM t")) == 0


def test_checkpoint(db):
    db.exec("CREATE TABLE t (v TEXT)")
    db.execute("INSERT INTO t (v) VALUES (?)", ("data",))
    db.commit()
    db.checkpoint()
    row = db.fetchone("PRAGMA wal_checkpoint")
    assert row is not None


def test_row_factory_is_row(db):
    db.exec("CREATE TABLE t (a INTEGER, b TEXT)")
    db.execute("INSERT INTO t VALUES (1, 'test')")
    row = db.fetchone("SELECT * FROM t")
    assert dict(row) == {"a": 1, "b": "test"}


def test_executemany(db):
    db.exec("CREATE TABLE t (v TEXT)")
    db.executemany("INSERT INTO t (v) VALUES (?)", [("a",), ("b",), ("c",)])
    assert len(db.fetchall("SELECT * FROM t")) == 3


def test_thread_safety(db):
    import threading
    db.exec("CREATE TABLE t (v TEXT)")
    errors = []

    def worker(n):
        try:
            for _ in range(20):
                db.execute("INSERT INTO t (v) VALUES (?)", (f"w{n}",))
        except Exception as e:
            errors.append(e)

    threads = [threading.Thread(target=worker, args=(i,)) for i in range(4)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert len(errors) == 0
    assert len(db.fetchall("SELECT * FROM t")) == 80


def test_wal_mode(db):
    row = db.fetchone("PRAGMA journal_mode")
    assert row[0].lower() == "wal"


def test_foreign_keys_on(db):
    row = db.fetchone("PRAGMA foreign_keys")
    assert row[0] == 1


def test_synchronous_normal(db):
    row = db.fetchone("PRAGMA synchronous")
    assert row[0] == 1  # NORMAL
