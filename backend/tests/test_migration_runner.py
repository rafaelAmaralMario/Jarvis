import pytest

from jarvis.database import Database
from jarvis.migration_runner import MIGRATIONS, MigrationRunner


@pytest.fixture
def db(tmp_path):
    d = Database(tmp_path / "test.db")
    yield d
    d.close()


def test_initial_version_is_zero(db):
    runner = MigrationRunner(db)
    assert runner.current_version() == 0


def test_pending_returns_all_on_fresh_db(db):
    runner = MigrationRunner(db)
    pending = runner.pending()
    assert len(pending) == len(MIGRATIONS)
    assert [m.version for m in pending] == [m.version for m in MIGRATIONS]


def test_run_pending_applies_all_migrations(db):
    runner = MigrationRunner(db)
    assert runner.run_pending() is True
    assert runner.current_version() == len(MIGRATIONS)


def test_run_pending_idempotent(db):
    runner = MigrationRunner(db)
    runner.run_pending()
    assert runner.run_pending() is False
    assert runner.current_version() == len(MIGRATIONS)


def test_tables_exist_after_migration(db):
    runner = MigrationRunner(db)
    runner.run_pending()

    expected_tables = [
        "system_config", "extension_registry", "audit_log",
        "permissions", "extensions",
        "model_metadata", "agents", "orchestration_config",
        "agent_conversations", "conversation_messages",
        "notes", "note_links", "note_tags", "notes_fts",
        "workspaces", "workspace_folders", "recent_files",
        "editor_settings",
        "oauth_tokens", "api_keys",
        "schema_version",
    ]
    existing = {
        r["name"]
        for r in db.fetchall(
            "SELECT name FROM sqlite_master WHERE type='table'"
        )
    }
    for tbl in expected_tables:
        assert tbl in existing, f"Table {tbl} not found after migrations"


def test_orchestration_config_has_default_row(db):
    runner = MigrationRunner(db)
    runner.run_pending()
    row = db.fetchone("SELECT * FROM orchestration_config WHERE id = 1")
    assert row is not None
    assert row["enabled"] == 1


def test_editor_settings_have_defaults(db):
    runner = MigrationRunner(db)
    runner.run_pending()
    rows = db.fetchall("SELECT key, value FROM editor_settings ORDER BY key")
    keys = {r["key"] for r in rows}
    expected = {"fontSize", "tabSize", "wordWrap", "theme", "minimap", "lineNumbers", "autoSave", "autoSaveDelay"}
    assert keys == expected


def test_notes_fts_table_exists(db):
    runner = MigrationRunner(db)
    runner.run_pending()
    row = db.fetchone(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='notes_fts'"
    )
    assert row is not None, "notes_fts table not found in schema"


def test_partial_migration(db):
    runner = MigrationRunner(db)
    for m in MIGRATIONS[:3]:
        db.exec(m.sql)
        db.execute(
            "INSERT INTO schema_version (version, name) VALUES (?, ?)",
            (m.version, m.name),
        )
    remaining = runner.pending()
    assert len(remaining) == len(MIGRATIONS) - 3
    assert remaining[0].version == 4


def test_migration_names_match(db):
    runner = MigrationRunner(db)
    runner.run_pending()
    rows = db.fetchall("SELECT version, name FROM schema_version ORDER BY version")
    assert len(rows) == len(MIGRATIONS)
    for row, expected in zip(rows, MIGRATIONS):
        assert row["name"] == expected.name


def test_fts5_tokenizer_works(db):
    runner = MigrationRunner(db)
    runner.run_pending()

    db.execute(
        "INSERT INTO notes (id, title, content) VALUES (?, ?, ?)",
        ("abc123", "Test Note", "This is a searchable document about AI agents"),
    )

    db.exec("INSERT INTO notes_fts (rowid, title, content, tags) SELECT rowid, title, content, tags FROM notes")

    results = db.fetchall(
        "SELECT rowid, snippet(notes_fts, 1, '<mark>', '</mark>', '...', 32) AS snippet "
        "FROM notes_fts WHERE notes_fts MATCH ? ORDER BY rank",
        ("searchable",),
    )
    assert len(results) == 1
    assert "searchable" in results[0]["snippet"].lower()
