"""Audio generation service — MusicGen (Meta) for music/sound effects."""

import base64
import io
import logging
import os
import random
import uuid
from typing import Any

logger = logging.getLogger(__name__)


class AudioGenService:
    def __init__(self, model_id: str = "facebook/musicgen-small"):
        self._model_id = model_id
        self._processor = None
        self._model = None
        self._device = "cpu"

    def _load_model(self):
        if self._model is not None:
            return
        try:
            import torch
            from transformers import AutoProcessor, MusicgenForConditionalGeneration
        except ImportError:
            raise ImportError(
                "transformers and torch are required for audio generation. "
                "Install with: pip install transformers torch"
            )
        self._device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info("Loading MusicGen model %s on %s...", self._model_id, self._device)
        self._processor = AutoProcessor.from_pretrained(self._model_id)
        self._model = MusicgenForConditionalGeneration.from_pretrained(self._model_id)

        if self._device == "cuda":
            self._model = self._model.to("cuda")

    def generate_music(
        self,
        description: str,
        duration: float = 8.0,
        seed: int = 0,
        temperature: float = 1.0,
        output_dir: str = "",
    ) -> dict[str, Any]:
        self._load_model()

        if seed == 0:
            seed = random.randint(0, 2**32 - 1)
        if duration < 1 or duration > 60:
            return {"success": False, "error": "Duration must be between 1 and 60 seconds"}
        if temperature <= 0 or temperature > 2:
            return {"success": False, "error": "Temperature must be between 0 and 2"}

        try:
            import torch
            inputs = self._processor(
                text=[description],
                padding=True,
                return_tensors="pt",
            )

            if self._device == "cuda":
                inputs = {k: v.to("cuda") for k, v in inputs.items()}

            max_length = int(256 * duration)

            generator = torch.manual_seed(seed)
            audio_values = self._model.generate(
                **inputs,
                do_sample=True,
                guidance_scale=3.0,
                max_new_tokens=max_length,
                temperature=temperature,
                generator=generator,
            )

            audio = audio_values[0, 0].cpu().numpy()
        except Exception as e:
            logger.exception("Music generation failed")
            return {"success": False, "error": f"Generation failed: {e}"}

        import scipy.io.wavfile as wavfile
        buf = io.BytesIO()
        sampling_rate = self._model.config.audio_encoder.sampling_rate if hasattr(self._model.config, "audio_encoder") else 32000
        wavfile.write(buf, sampling_rate, audio)
        audio_bytes = buf.getvalue()
        b64 = base64.b64encode(audio_bytes).decode()

        output_path = ""
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
            filename = f"jarvis_music_{uuid.uuid4().hex[:8]}.wav"
            output_path = os.path.join(output_dir, filename)
            with open(output_path, "wb") as f:
                f.write(audio_bytes)

        return {
            "success": True,
            "audioBase64": b64,
            "path": output_path,
            "format": "wav",
            "duration": duration,
            "seed": seed,
            "sampling_rate": sampling_rate,
        }

    def generate_sound_effect(
        self,
        description: str,
        duration: float = 5.0,
        seed: int = 0,
        temperature: float = 0.8,
        output_dir: str = "",
    ) -> dict[str, Any]:
        return self.generate_music(
            description=description,
            duration=duration,
            seed=seed,
            temperature=temperature,
            output_dir=output_dir,
        )
