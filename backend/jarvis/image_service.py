"""Image generation service — Stable Diffusion / Flux via diffusers."""

import base64
import io
import logging
import os
import random
import time
from typing import Any

logger = logging.getLogger(__name__)

MODEL_MAP = {
    "sdxl": "stabilityai/stable-diffusion-xl-base-1.0",
    "sd3": "stabilityai/stable-diffusion-3.5-medium",
    "flux-schnell": "black-forest-labs/FLUX.1-schnell",
    "flux-dev": "black-forest-labs/FLUX.1-dev",
}


class ImageGenerator:
    def __init__(self, model_id: str = "stabilityai/stable-diffusion-xl-base-1.0"):
        self._model_id = model_id
        self._pipeline = None
        self._device = "cpu"
        self._dtype = None

    def _load_pipeline(self):
        if self._pipeline is not None:
            return
        try:
            import torch
            import diffusers
        except ImportError:
            raise ImportError(
                "diffusers and torch are required for image generation. "
                "Install with: pip install jarvis-backend[image]"
            )

        if torch.cuda.is_available():
            self._device = "cuda"
            self._dtype = torch.float16
        else:
            self._device = "cpu"
            self._dtype = torch.float32

        logger.info("Loading pipeline %s on %s (dtype=%s)", self._model_id, self._device, self._dtype)

        if "flux" in self._model_id.lower():
            try:
                from diffusers import FluxPipeline
                self._pipeline = FluxPipeline.from_pretrained(
                    self._model_id, torch_dtype=self._dtype
                )
            except Exception:
                from diffusers import DiffusionPipeline
                self._pipeline = DiffusionPipeline.from_pretrained(
                    self._model_id, torch_dtype=self._dtype
                )
        elif "sd3" in self._model_id.lower():
            from diffusers import StableDiffusion3Pipeline
            self._pipeline = StableDiffusion3Pipeline.from_pretrained(
                self._model_id, torch_dtype=self._dtype
            )
        else:
            from diffusers import StableDiffusionXLPipeline
            self._pipeline = StableDiffusionXLPipeline.from_pretrained(
                self._model_id, torch_dtype=self._dtype
            )

        if self._device == "cuda":
            self._pipeline = self._pipeline.to("cuda")
            try:
                self._pipeline.enable_model_cpu_offload()
            except Exception:
                pass
        else:
            self._pipeline = self._pipeline.to("cpu")
            try:
                self._pipeline.enable_attention_slicing()
            except Exception:
                pass

    def generate(
        self,
        prompt: str,
        negative_prompt: str = "",
        steps: int = 30,
        seed: int = 0,
        width: int = 1024,
        height: int = 1024,
        guidance_scale: float = 7.5,
        output_dir: str = "",
    ) -> dict[str, Any]:
        self._load_pipeline()

        if seed == 0:
            seed = random.randint(0, 2**32 - 1)

        if width < 64 or height < 64:
            return {"success": False, "error": "Width and height must be at least 64"}
        if steps < 1 or steps > 200:
            return {"success": False, "error": "Steps must be between 1 and 200"}

        generator = None
        try:
            import torch
            generator = torch.manual_seed(seed)
        except ImportError:
            pass

        try:
            kwargs = {
                "prompt": prompt,
                "num_inference_steps": steps,
                "guidance_scale": guidance_scale,
                "width": width,
                "height": height,
                "generator": generator,
            }
            if negative_prompt:
                kwargs["negative_prompt"] = negative_prompt

            logger.info("Generating image: prompt='%s' steps=%d seed=%d", prompt[:80], steps, seed)

            if "flux" in self._model_id.lower():
                kwargs.pop("guidance_scale", None)
                kwargs.pop("negative_prompt", None)

            result = self._pipeline(**kwargs)
            image = result.images[0]

        except Exception as e:
            logger.exception("Image generation failed")
            if "out of memory" in str(e).lower():
                try:
                    import torch
                    torch.cuda.empty_cache()
                except Exception:
                    pass
                return {"success": False, "error": "GPU out of memory. Try CPU fallback or reduce image size."}
            return {"success": False, "error": f"Generation failed: {e}"}

        buf = io.BytesIO()
        image.save(buf, format="PNG")
        img_bytes = buf.getvalue()
        b64 = base64.b64encode(img_bytes).decode()

        output_path = ""
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
            ts = int(time.time())
            filename = f"jarvis_gen_{ts}.png"
            output_path = os.path.join(output_dir, filename)
            image.save(output_path)

        return {
            "success": True,
            "base64": b64,
            "path": output_path,
            "format": "png",
            "width": image.width,
            "height": image.height,
            "seed": seed,
            "model": self._model_id,
        }

    @staticmethod
    def resolve_model_id(model_key: str) -> str:
        return MODEL_MAP.get(model_key, model_key)
