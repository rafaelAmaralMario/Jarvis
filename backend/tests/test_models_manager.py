import pytest
from unittest.mock import MagicMock, PropertyMock

from jarvis.database import Database
from jarvis.models_manager import (
    ModelsManager,
    ModelSpecialty,
    ModelStatus,
    ModelMetadata,
    _infer_specialty,
    _format_size,
    SPECIALTY_COLORS,
)
from jarvis.ollama_client import OllamaModel, OllamaClient


@pytest.fixture
def db(tmp_path):
    d = Database(tmp_path / "test.db")
    d.exec("""
        CREATE TABLE IF NOT EXISTS model_metadata (
            model_name TEXT PRIMARY KEY,
            specialty TEXT NOT NULL DEFAULT 'general',
            notes TEXT NOT NULL DEFAULT '',
            color TEXT NOT NULL DEFAULT '#6b7280',
            icon TEXT NOT NULL DEFAULT '🤖',
            created_at TEXT,
            updated_at TEXT
        )
    """)
    yield d
    d.close()


@pytest.fixture
def mock_ollama():
    client = MagicMock(spec=OllamaClient)
    client.ping.return_value = True
    client.list_models.return_value = [
        OllamaModel(name="llama3.2:3b", size_bytes=2_000_000_000, details="llama"),
        OllamaModel(name="codellama:7b", size_bytes=7_000_000_000, details="llama"),
    ]
    return client


@pytest.fixture
def manager(db, mock_ollama):
    return ModelsManager(db, ollama=mock_ollama)


def test_infer_specialty_code():
    assert _infer_specialty("codellama:7b") == ModelSpecialty.CODE
    assert _infer_specialty("deepseek-coder:6.7b") == ModelSpecialty.CODE


def test_infer_specialty_chat():
    assert _infer_specialty("llama3.2:3b") == ModelSpecialty.CHAT
    assert _infer_specialty("mistral:7b") == ModelSpecialty.CHAT
    assert _infer_specialty("gemma:2b") == ModelSpecialty.CHAT


def test_infer_specialty_reasoning():
    assert _infer_specialty("deepseek-r1:7b") == ModelSpecialty.REASONING
    assert _infer_specialty("qw:14b") == ModelSpecialty.REASONING


def test_infer_specialty_embedding():
    assert _infer_specialty("mxbai-embed-large") == ModelSpecialty.EMBEDDING


def test_infer_specialty_vision():
    assert _infer_specialty("llava:7b") == ModelSpecialty.VISION
    assert _infer_specialty("moondream:latest") == ModelSpecialty.VISION


def test_infer_specialty_general():
    assert _infer_specialty("some-random-model") == ModelSpecialty.GENERAL


def test_format_size_bytes():
    assert _format_size(500) == "0 KB"


def test_format_size_kb():
    assert _format_size(2048) == "2 KB"


def test_format_size_mb():
    assert _format_size(5 * 1024 * 1024) == "5 MB"


def test_format_size_gb():
    assert _format_size(3 * 1024 * 1024 * 1024) == "3.0 GB"


def test_format_size_float_gb():
    size = int(2.5 * 1024 * 1024 * 1024)
    assert "2.5 GB" in _format_size(size)


def test_list_models_returns_from_ollama(manager):
    models = manager.list_models()
    assert len(models) == 2
    assert models[0].name == "llama3.2:3b"
    assert models[1].name == "codellama:7b"


def test_list_models_with_metadata(db, mock_ollama):
    db.execute(
        "INSERT INTO model_metadata (model_name, specialty, notes, color, icon) "
        "VALUES (?, ?, ?, ?, ?)",
        ("llama3.2:3b", "code", "custom note", "#ff0000", "⚡"),
    )
    manager = ModelsManager(db, ollama=mock_ollama)
    models = manager.list_models()
    llama = [m for m in models if m.name == "llama3.2:3b"][0]
    assert llama.specialty == ModelSpecialty.CODE
    assert llama.color == "#ff0000"
    assert llama.icon == "⚡"


def test_get_model_from_list(manager):
    model = manager.get_model("llama3.2:3b")
    assert model.name == "llama3.2:3b"
    assert model.description == "llama"


def test_get_model_returns_default_when_not_found(manager):
    model = manager.get_model("nonexistent")
    assert model.name == "nonexistent"
    assert model.status == ModelStatus.NOT_DOWNLOADED


def test_update_metadata(manager):
    meta = ModelMetadata(
        specialty=ModelSpecialty.CODE,
        notes="Great for coding",
        color="#3fb950",
        icon="💻",
    )
    assert manager.update_model_metadata("codellama:7b", meta) is True

    row = manager._db.fetchone(
        "SELECT * FROM model_metadata WHERE model_name = ?",
        ("codellama:7b",),
    )
    assert row is not None
    assert row["specialty"] == "code"
    assert row["notes"] == "Great for coding"
    assert row["color"] == "#3fb950"


def test_update_metadata_overwrites(manager):
    meta1 = ModelMetadata(specialty=ModelSpecialty.CHAT, color="#fff", icon="A")
    meta2 = ModelMetadata(specialty=ModelSpecialty.CODE, color="#000", icon="B")
    manager.update_model_metadata("test-model", meta1)
    manager.update_model_metadata("test-model", meta2)

    row = manager._db.fetchone(
        "SELECT specialty, color, icon FROM model_metadata WHERE model_name = ?",
        ("test-model",),
    )
    assert row["specialty"] == "code"
    assert row["color"] == "#000"


def test_get_model_by_specialty_finds_matching(manager):
    result = manager.get_model_by_specialty(ModelSpecialty.CHAT)
    assert result.name == "llama3.2:3b"


def test_get_model_by_specialty_returns_empty_when_no_match(manager):
    result = manager.get_model_by_specialty(ModelSpecialty.VISION)
    assert result.name == ""


def test_get_model_status(manager):
    status = manager.get_model_status("llama3.2:3b")
    assert status == ModelStatus.RUNNING


def test_specialty_colors_all_defined():
    for s in ModelSpecialty:
        assert s in SPECIALTY_COLORS
        assert SPECIALTY_COLORS[s].startswith("#")


def test_pull_model_calls_ollama_and_updates_metadata(manager, mock_ollama):
    mock_ollama.pull_model.return_value = True
    assert manager.pull_model("llama3.2:3b") is True
    mock_ollama.pull_model.assert_called_once_with("llama3.2:3b")

    row = manager._db.fetchone(
        "SELECT specialty FROM model_metadata WHERE model_name = ?",
        ("llama3.2:3b",),
    )
    assert row is not None
    assert row["specialty"] == "chat"


def test_delete_model_calls_ollama(manager, mock_ollama):
    mock_ollama.delete_model.return_value = True
    assert manager.delete_model("llama3.2:3b") is True
    mock_ollama.delete_model.assert_called_once_with("llama3.2:3b")


def test_start_model_calls_ollama_generate(manager, mock_ollama):
    from jarvis.ollama_client import OllamaGenerateResponse
    mock_ollama.generate.return_value = OllamaGenerateResponse(done=True)
    assert manager.start_model("llama3.2:3b") is True


def test_stop_model_calls_ollama_generate(manager, mock_ollama):
    assert manager.stop_model("llama3.2:3b") is True
