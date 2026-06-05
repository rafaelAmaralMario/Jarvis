import pytest
import httpx

from jarvis.ollama_client import (
    OllamaClient,
    OllamaModel,
    OllamaGenerateRequest,
)


@pytest.fixture
def client():
    c = OllamaClient(base_url="http://localhost:11434")
    yield c
    c.close()


def test_ping_when_ollama_offline(client):
    assert client.ping() is False


def test_list_models_empty_when_offline(client):
    with pytest.raises((httpx.ConnectError, httpx.RemoteProtocolError)):
        client.list_models()


def test_ollama_model_defaults():
    m = OllamaModel()
    assert m.name == ""
    assert m.size_bytes == 0


def test_generate_request_defaults():
    req = OllamaGenerateRequest(model="llama3", prompt="hello")
    assert req.temperature == 0.7
    assert req.max_tokens == 2048
    assert req.stream is False
    assert req.system == ""


def test_generate_request_custom():
    req = OllamaGenerateRequest(
        model="codellama",
        prompt="write code",
        system="be concise",
        temperature=0.1,
        max_tokens=500,
        stream=True,
    )
    assert req.model == "codellama"
    assert req.temperature == 0.1


def test_generate_fails_when_offline(client):
    req = OllamaGenerateRequest(model="llama3", prompt="hello")
    with pytest.raises((httpx.ConnectError, httpx.RemoteProtocolError)):
        client.generate(req)


def test_pull_model_fails_when_offline(client):
    with pytest.raises((httpx.ConnectError, httpx.RemoteProtocolError)):
        client.pull_model("llama3")


def test_delete_model_raises_when_offline(client):
    with pytest.raises((httpx.ConnectError, httpx.RemoteProtocolError)):
        client.delete_model("llama3")


def test_client_trailing_slash_stripped():
    c = OllamaClient(base_url="http://localhost:11434/")
    assert c._base_url == "http://localhost:11434"
    c.close()


def test_client_default_url():
    c = OllamaClient()
    assert c._base_url == "http://localhost:11434"
    c.close()


def test_client_empty_url_defaults():
    c = OllamaClient(base_url="")
    assert c._base_url == "http://localhost:11434"
    c.close()
