"""Piper TTS — fast local text-to-speech synthesis."""

import base64
import io
import json
import logging
import os
from pathlib import Path

import httpx

logger = logging.getLogger(__name__)

PIPER_VOICES_DIR = Path.home() / ".jarvis" / "voices"
VOICE_INDEX_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/main/voices.json"
HF_BASE = "https://huggingface.co/rhasspy/piper-voices/resolve/main"

_VOICE_CACHE: dict[str, object] = {}


def _voice_dir(name: str) -> Path:
    return PIPER_VOICES_DIR / name


def _onnx_path(name: str) -> Path:
    return _voice_dir(name) / f"{name}.onnx"


def _config_path(name: str) -> Path:
    return _voice_dir(name) / f"{name}.json"


def list_available_voices() -> dict:
    try:
        resp = httpx.get(VOICE_INDEX_URL, timeout=15)
        resp.raise_for_status()
        return {"success": True, "voices": resp.json().get("voices", [])}
    except Exception as e:
        return {"success": False, "error": str(e)}


def _download_file(url: str, dest: Path) -> bool:
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        with httpx.stream("GET", url, follow_redirects=True, timeout=120) as r:
            r.raise_for_status()
            total = int(r.headers.get("content-length", 0))
            downloaded = 0
            with open(dest, "wb") as f:
                for chunk in r.iter_bytes(8192):
                    f.write(chunk)
                    downloaded += len(chunk)
        logger.info("Downloaded %s (%d bytes)", dest.name, downloaded)
        return True
    except Exception as e:
        logger.error("Failed to download %s: %s", url, e)
        return False


def download_voice(name: str) -> dict:
    if _onnx_path(name).exists() and _config_path(name).exists():
        return {"success": True, "message": f"Voice '{name}' already downloaded"}
    base_url = f"{HF_BASE}/{name}"
    onnx_ok = _download_file(f"{base_url}/{name}.onnx", _onnx_path(name))
    config_ok = _download_file(f"{base_url}/{name}.json", _config_path(name))
    if onnx_ok and config_ok:
        return {"success": True, "message": f"Voice '{name}' downloaded"}
    return {"success": False, "error": f"Failed to download voice '{name}'"}


def synthesize(text: str, voice: str = "pt_BR-faber-medium", output_path: str | None = None) -> bytes:
    if not text:
        raise ValueError("Text cannot be empty")
    try:
        from piper import PiperVoice
    except ImportError:
        raise RuntimeError("piper-tts not installed")

    if voice not in _VOICE_CACHE:
        if not _onnx_path(voice).exists():
            result = download_voice(voice)
            if not result["success"]:
                raise RuntimeError(result.get("error", "Failed to download voice"))
        with open(_config_path(voice)) as f:
            config = json.load(f)
        _VOICE_CACHE[voice] = PiperVoice(str(_onnx_path(voice)), config)

    piper_voice = _VOICE_CACHE[voice]

    if output_path:
        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
        with open(output_path, "wb") as f:
            piper_voice.synthesize(text, f)
        with open(output_path, "rb") as f:
            return f.read()
    else:
        buf = io.BytesIO()
        piper_voice.synthesize(text, buf)
        return buf.getvalue()
