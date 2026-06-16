"""Voice cloning service — Coqui XTTS v2."""

import logging
import os
import tempfile
import uuid
from typing import Any

logger = logging.getLogger(__name__)


class VoiceCloneService:
    def __init__(self, models_dir: str = ""):
        self._models_dir = models_dir or os.path.expanduser("~/.jarvis/voices")
        os.makedirs(self._models_dir, exist_ok=True)
        self._tts = None
        self._device = "cpu"

    def _load_model(self):
        if self._tts is not None:
            return
        try:
            import torch
            from TTS.api import TTS
        except ImportError:
            raise ImportError(
                "TTS (Coqui) is required for voice cloning. "
                "Install with: pip install TTS"
            )
        self._device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info("Loading Coqui XTTS v2 on %s...", self._device)
        self._tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=self._device == "cuda")

    def clone_voice(self, audio_bytes: bytes, language: str = "pt") -> dict[str, Any]:
        speaker_id = uuid.uuid4().hex[:12]
        speaker_dir = os.path.join(self._models_dir, speaker_id)
        os.makedirs(speaker_dir, exist_ok=True)

        tmp_path = os.path.join(speaker_dir, "sample.wav")
        with open(tmp_path, "wb") as f:
            f.write(audio_bytes)

        return {
            "success": True,
            "speaker_id": speaker_id,
            "speaker_dir": speaker_dir,
            "language": language,
            "message": "Voice sample saved. Ready for synthesis.",
        }

    def synthesize(self, text: str, speaker_id: str, language: str = "pt") -> bytes:
        self._load_model()
        speaker_dir = os.path.join(self._models_dir, speaker_id)
        sample_path = os.path.join(speaker_dir, "sample.wav")
        if not os.path.exists(sample_path):
            raise FileNotFoundError(f"Voice sample not found for speaker {speaker_id}")

        out_path = os.path.join(speaker_dir, f"output_{uuid.uuid4().hex[:8]}.wav")
        self._tts.tts_to_file(
            text=text,
            file_path=out_path,
            speaker_wav=sample_path,
            language=language,
        )
        with open(out_path, "rb") as f:
            audio_bytes = f.read()
        os.unlink(out_path)
        return audio_bytes

    def list_voices(self) -> list[dict]:
        voices = []
        if not os.path.isdir(self._models_dir):
            return voices
        for entry in os.listdir(self._models_dir):
            speaker_dir = os.path.join(self._models_dir, entry)
            sample_path = os.path.join(speaker_dir, "sample.wav")
            if os.path.isdir(speaker_dir) and os.path.exists(sample_path):
                voices.append({
                    "speaker_id": entry,
                    "language": "pt",
                })
        return voices

    def delete_voice(self, speaker_id: str) -> bool:
        speaker_dir = os.path.join(self._models_dir, speaker_id)
        if os.path.isdir(speaker_dir):
            import shutil
            shutil.rmtree(speaker_dir)
            return True
        return False
