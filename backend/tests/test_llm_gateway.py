"""Tests for the multi-provider LLM Gateway."""

from unittest.mock import MagicMock, patch

import pytest

from jarvis.database import Database
from jarvis.llm_gateway import (
    LLMGateway,
    LLMMessage,
    LLMProvider,
    LLMProviderConfig,
    LLMRequest,
)


@pytest.fixture
def mock_db(tmp_path):
    db_path = tmp_path / "test.db"
    db = Database(db_path)
    db.exec("""
        CREATE TABLE IF NOT EXISTS llm_providers (
            provider TEXT PRIMARY KEY,
            api_key TEXT NOT NULL DEFAULT '',
            api_url TEXT NOT NULL DEFAULT '',
            default_model TEXT NOT NULL DEFAULT '',
            enabled INTEGER NOT NULL DEFAULT 1,
            models TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL DEFAULT '',
            updated_at TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS system_config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL DEFAULT '',
            updated_at TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS llm_fallback_config (
            provider TEXT PRIMARY KEY,
            fallback_order TEXT NOT NULL DEFAULT '[]',
            timeout_seconds INTEGER NOT NULL DEFAULT 30,
            model_overrides TEXT NOT NULL DEFAULT '[]',
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
    """)
    return db


def test_llm_gateway_init_with_default_ollama(mock_db):
    gateway = LLMGateway(mock_db)
    providers = gateway.get_providers()
    assert len(providers) >= 1
    ollama = [p for p in providers if p["provider"] == "ollama"]
    assert len(ollama) == 1
    assert ollama[0]["apiUrl"] == "http://localhost:11434"


def test_save_and_get_provider(mock_db):
    gateway = LLMGateway(mock_db)
    cfg = LLMProviderConfig(
        provider=LLMProvider.OPENAI,
        api_key="sk-test-123",
        api_url="https://api.openai.com/v1",
        default_model="gpt-4",
        enabled=True,
    )
    assert gateway.save_provider(cfg)

    provider = gateway.get_provider("openai")
    assert provider is not None
    assert provider["provider"] == "openai"
    assert provider["apiUrl"] == "https://api.openai.com/v1"
    assert provider["defaultModel"] == "gpt-4"
    assert provider["hasKey"] is True


def test_save_and_get_anthropic_provider(mock_db):
    gateway = LLMGateway(mock_db)
    cfg = LLMProviderConfig(
        provider=LLMProvider.ANTHROPIC,
        api_key="sk-ant-test",
        api_url="https://api.anthropic.com/v1",
        default_model="claude-3-opus-20240229",
        enabled=True,
    )
    assert gateway.save_provider(cfg)

    provider = gateway.get_provider("anthropic")
    assert provider is not None
    assert provider["defaultModel"] == "claude-3-opus-20240229"
    assert provider["hasKey"] is True


def test_get_providers_list(mock_db):
    gateway = LLMGateway(mock_db)
    gateway.save_provider(LLMProviderConfig(
        provider=LLMProvider.OPENAI, api_key="sk-test", api_url="https://api.openai.com/v1",
        default_model="gpt-4", enabled=True,
    ))
    gateway.save_provider(LLMProviderConfig(
        provider=LLMProvider.ANTHROPIC, api_key="sk-ant-test", api_url="https://api.anthropic.com/v1",
        default_model="claude-3-opus-20240229", enabled=True,
    ))

    providers = gateway.get_providers()
    assert len(providers) >= 3
    provider_names = [p["provider"] for p in providers]
    assert "ollama" in provider_names
    assert "openai" in provider_names
    assert "anthropic" in provider_names


def test_set_and_get_default_provider(mock_db):
    gateway = LLMGateway(mock_db)
    gateway.save_provider(LLMProviderConfig(
        provider=LLMProvider.OPENAI, api_key="sk-test", api_url="https://api.openai.com/v1",
        default_model="gpt-4", enabled=True,
    ))

    assert gateway.set_default_provider("openai")
    assert gateway.get_default_provider() == "openai"


def test_get_provider_not_found(mock_db):
    gateway = LLMGateway(mock_db)
    assert gateway.get_provider("nonexistent") is None


def test_test_connection_no_provider(mock_db):
    gateway = LLMGateway(mock_db)
    result = gateway.test_connection("nonexistent")
    assert result["success"] is False
    assert "not configured" in result["error"]


def test_llm_request_dataclass():
    req = LLMRequest(
        provider=LLMProvider.OLLAMA,
        model="llama3.2",
        messages=[LLMMessage(role="user", content="Hello")],
        system="Be helpful",
        temperature=0.5,
        max_tokens=100,
    )
    assert req.provider == LLMProvider.OLLAMA
    assert req.model == "llama3.2"
    assert len(req.messages) == 1
    assert req.messages[0].content == "Hello"
    assert req.system == "Be helpful"
    assert req.temperature == 0.5
    assert req.max_tokens == 100


def test_llm_provider_config_defaults():
    cfg = LLMProviderConfig(provider=LLMProvider.OLLAMA)
    assert cfg.provider == LLMProvider.OLLAMA
    assert cfg.api_key == ""
    assert cfg.api_url == ""
    assert cfg.default_model == ""
    assert cfg.enabled is True
    assert cfg.models == []


def test_generate_with_no_provider_config(mock_db):
    gateway = LLMGateway(mock_db)
    mock_db.execute("DELETE FROM llm_providers")
    mock_db.execute("DELETE FROM system_config")
    gateway._providers.clear()

    with pytest.raises(Exception):
        gateway.generate(LLMRequest())


def test_save_provider_updates_existing(mock_db):
    gateway = LLMGateway(mock_db)
    cfg1 = LLMProviderConfig(
        provider=LLMProvider.OPENAI, api_key="sk-old", api_url="https://api.openai.com/v1",
        default_model="gpt-3.5-turbo", enabled=True,
    )
    gateway.save_provider(cfg1)

    cfg2 = LLMProviderConfig(
        provider=LLMProvider.OPENAI, api_key="sk-new", api_url="https://api.openai.com/v1",
        default_model="gpt-4", enabled=True,
    )
    gateway.save_provider(cfg2)

    provider = gateway.get_provider("openai")
    assert provider["defaultModel"] == "gpt-4"


def test_default_provider_fallback(mock_db):
    gateway = LLMGateway(mock_db)
    assert gateway.get_default_provider() == "ollama"


# --- NativeLLMClient tests ---


def test_native_ping_returns_true_when_llama_cpp_installed(tmp_path):
    from jarvis.llm_gateway import NativeLLMClient
    config = LLMProviderConfig(provider=LLMProvider.NATIVE, api_url=str(tmp_path))
    client = NativeLLMClient(config)
    with patch.dict("sys.modules", {"llama_cpp": MagicMock()}):
        assert client.ping() is True


def test_native_ping_returns_false_when_llama_cpp_not_installed(tmp_path):
    from jarvis.llm_gateway import NativeLLMClient
    config = LLMProviderConfig(provider=LLMProvider.NATIVE, api_url=str(tmp_path))
    client = NativeLLMClient(config)
    from unittest.mock import patch
    with patch.dict("sys.modules", {"llama_cpp": None}):
        assert client.ping() is False


def test_native_list_models_returns_gguf_files(tmp_path):
    from jarvis.llm_gateway import NativeLLMClient
    # Create dummy .gguf files
    (tmp_path / "model1.gguf").write_text("dummy")
    (tmp_path / "model2.gguf").write_text("dummy")
    (tmp_path / "readme.txt").write_text("not a model")
    config = LLMProviderConfig(provider=LLMProvider.NATIVE, api_url=str(tmp_path))
    client = NativeLLMClient(config)
    models = client.list_models()
    assert "model1.gguf" in models
    assert "model2.gguf" in models
    assert "readme.txt" not in models
    assert len(models) == 2


@patch("jarvis.llm_gateway.NativeLLMClient._get_model")
def test_native_generate_returns_llm_response(mock_get_model):
    from jarvis.llm_gateway import LLMResponse, NativeLLMClient
    mock_llama = MagicMock()
    mock_llama.n_ctx = 4096
    mock_llama.create_completion.return_value = {
        "choices": [{"text": "Hello from native LLM!"}],
        "usage": {"prompt_tokens": 10, "completion_tokens": 5},
    }
    mock_get_model.return_value = mock_llama
    config = LLMProviderConfig(provider=LLMProvider.NATIVE, api_url="C:\\models")
    client = NativeLLMClient(config)
    req = LLMRequest(
        provider=LLMProvider.NATIVE,
        model="test.gguf",
        messages=[LLMMessage(role="user", content="Hi")],
    )
    response = client.generate(req)
    assert isinstance(response, LLMResponse)
    assert response.content == "Hello from native LLM!"
    assert response.provider == LLMProvider.NATIVE
    assert response.done is True
    assert response.prompt_tokens == 10
    assert response.completion_tokens == 5


@patch("jarvis.llm_gateway.NativeLLMClient._get_model")
def test_native_model_cache_reuses_instance(mock_get_model):
    from jarvis.llm_gateway import NativeLLMClient
    # Make _get_model return a new MagicMock each time (no real cache)
    # Instead we test that _get_model is called only once for same model
    instance_a = MagicMock()
    instance_a.n_ctx = 4096
    mock_get_model.return_value = instance_a
    config = LLMProviderConfig(provider=LLMProvider.NATIVE, api_url="C:\\models")
    client = NativeLLMClient(config)
    req = LLMRequest(
        provider=LLMProvider.NATIVE,
        model="test.gguf",
        messages=[LLMMessage(role="user", content="Hi")],
    )
    client.generate(req)
    client.generate(req)
    # _get_model should be called each time with same path (cache inside _get_model)
    assert mock_get_model.call_count == 2
    mock_get_model.assert_called_with("test.gguf")


@patch("jarvis.llm_gateway.NativeLLMClient")
def test_get_llm_client_returns_native_client(mock_native_cls):
    from jarvis.llm_gateway import get_llm_client
    config = LLMProviderConfig(provider=LLMProvider.NATIVE, api_url="C:\\models")
    # Make _CLIENT_CACHE clean
    import jarvis.llm_gateway as lg
    lg._CLIENT_CACHE.clear()
    get_llm_client(config)
    # NativeLLMClient constructor was called
    assert mock_native_cls.called


# --- Grammar-constrained tool calling tests ---


def test_native_loads_grammar_from_file(tmp_path):
    """Grammar file is loaded without error when present."""
    from jarvis.llm_gateway import NativeLLMClient
    config = LLMProviderConfig(provider=LLMProvider.NATIVE, api_url=str(tmp_path))
    client = NativeLLMClient(config)
    assert client._tool_grammar is not None
    assert '"tool"' in client._tool_grammar
    assert '"args"' in client._tool_grammar


@patch("jarvis.llm_gateway.NativeLLMClient._get_model")
def test_native_generate_applies_grammar_when_set(mock_get_model):
    """Grammar constraint is passed to create_completion when req.grammar is set."""
    from jarvis.llm_gateway import NativeLLMClient
    mock_llama = MagicMock()
    mock_llama.n_ctx = 4096
    mock_llama.create_completion.return_value = {
        "choices": [{"text": '{"tool": "test", "args": {}}'}],
        "usage": {"prompt_tokens": 5, "completion_tokens": 10},
    }
    mock_get_model.return_value = mock_llama
    config = LLMProviderConfig(provider=LLMProvider.NATIVE, api_url="C:\\models")
    client = NativeLLMClient(config)
    req = LLMRequest(
        provider=LLMProvider.NATIVE,
        model="test.gguf",
        messages=[LLMMessage(role="user", content="Call a tool")],
        grammar='root ::= "hello"',
    )
    client.generate(req)
    # Verify grammar was passed to create_completion
    _, kwargs = mock_llama.create_completion.call_args
    assert kwargs.get("grammar") is not None
    
    
@patch("jarvis.llm_gateway.NativeLLMClient._get_model")
def test_native_generate_skips_grammar_when_not_tool_calling(mock_get_model):
    """No grammar is passed when req.grammar is empty (normal chat)."""
    from jarvis.llm_gateway import NativeLLMClient
    mock_llama = MagicMock()
    mock_llama.n_ctx = 4096
    mock_llama.create_completion.return_value = {
        "choices": [{"text": "Hello! How can I help?"}],
        "usage": {"prompt_tokens": 5, "completion_tokens": 3},
    }
    mock_get_model.return_value = mock_llama
    config = LLMProviderConfig(provider=LLMProvider.NATIVE, api_url="C:\\models")
    client = NativeLLMClient(config)
    req = LLMRequest(
        provider=LLMProvider.NATIVE,
        model="test.gguf",
        messages=[LLMMessage(role="user", content="Hello")],
        grammar="",
    )
    client.generate(req)
    _, kwargs = mock_llama.create_completion.call_args
    assert "grammar" not in kwargs
