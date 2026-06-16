"""Video generation service — AnimateDiff via diffusers."""

import base64
import io
import logging
import os
import random
import time
from typing import Any

logger = logging.getLogger(__name__)


class VideoGenerator:
    def __init__(self, model_id: str = "emilianJR/epiCRealism", motion_adapter_id: str = ""):
        self._model_id = model_id
        self._motion_adapter_id = motion_adapter_id or "guoyww/animatediff-motion-adapter-v1-5-2"
        self._pipeline = None
        self._device = "cpu"
        self._dtype = None

    def _load_pipeline(self):
        if self._pipeline is not None:
            return
        try:
            import diffusers
            import torch
        except ImportError:
            raise ImportError("diffusers and torch required for video generation. Install with: pip install jarvis-backend[image]")

        if torch.cuda.is_available():
            self._device = "cuda"
            self._dtype = torch.float16
        else:
            self._device = "cpu"
            self._dtype = torch.float32

        logger.info("Loading AnimateDiff pipeline %s on %s", self._model_id, self._device)

        from diffusers import AnimateDiffPipeline, DDIMScheduler, MotionAdapter

        motion_adapter = MotionAdapter.from_pretrained(self._motion_adapter_id)
        self._pipeline = AnimateDiffPipeline.from_pretrained(
            self._model_id,
            motion_adapter=motion_adapter,
            torch_dtype=self._dtype,
        )
        self._pipeline.scheduler = DDIMScheduler.from_config(
            self._pipeline.scheduler.config,
            beta_start=0.00085,
            beta_end=0.012,
            beta_schedule="linear",
            clip_sample=False,
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

        try:
            self._pipeline.enable_vae_slicing()
        except Exception:
            pass

    def generate_video(
        self,
        prompt: str,
        negative_prompt: str = "",
        steps: int = 25,
        seed: int = 0,
        num_frames: int = 16,
        fps: int = 8,
        guidance_scale: float = 7.5,
        output_dir: str = "",
    ) -> dict[str, Any]:
        self._load_pipeline()

        if seed == 0:
            seed = random.randint(0, 2**32 - 1)
        if num_frames < 8 or num_frames > 64:
            return {"success": False, "error": "num_frames must be between 8 and 64"}
        if steps < 1 or steps > 100:
            return {"success": False, "error": "Steps must be between 1 and 100"}

        try:
            import torch
            generator = torch.manual_seed(seed)
        except ImportError:
            generator = None

        try:
            logger.info("Generating video: prompt='%s' frames=%d steps=%d seed=%d", prompt[:60], num_frames, steps, seed)
            result = self._pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt if negative_prompt else None,
                num_frames=num_frames,
                guidance_scale=guidance_scale,
                num_inference_steps=steps,
                generator=generator,
            )
            frames = result.frames[0]
        except Exception as e:
            logger.exception("Video generation failed")
            if "out of memory" in str(e).lower():
                try:
                    import torch
                    torch.cuda.empty_cache()
                except Exception:
                    pass
                return {"success": False, "error": "GPU out of memory. Try fewer frames or CPU fallback."}
            return {"success": False, "error": f"Video generation failed: {e}"}

        video_bytes = self._frames_to_mp4(frames, fps=fps)
        b64 = base64.b64encode(video_bytes).decode()

        output_path = ""
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
            ts = int(time.time())
            filename = f"jarvis_video_{ts}.mp4"
            output_path = os.path.join(output_dir, filename)
            with open(output_path, "wb") as f:
                f.write(video_bytes)

        duration = num_frames / fps
        return {
            "success": True,
            "videoBase64": b64,
            "path": output_path,
            "format": "mp4",
            "frames": num_frames,
            "fps": fps,
            "duration": duration,
            "seed": seed,
        }

    def _frames_to_mp4(self, frames: list, fps: int = 8) -> bytes:
        try:
            import imageio
        except ImportError:
            raise ImportError("imageio required for video writing. Install with: pip install imageio[ffmpeg]")

        buf = io.BytesIO()
        with imageio.get_writer(buf, format="mp4", mode="I", fps=fps, codec="libx264", quality=8) as writer:
            for frame in frames:
                writer.append_data(frame)
        return buf.getvalue()
