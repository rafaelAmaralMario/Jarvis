"""GGUFManager — download, list, and manage GGUF models from Hugging Face Hub."""

import logging
import os
from typing import Callable

logger = logging.getLogger(__name__)

CATALOG = [
    {
        "name": "Qwen 2.5 1.5B Instruct",
        "repo_id": "Qwen/Qwen2.5-1.5B-Instruct-GGUF",
        "filename": "qwen2.5-1.5b-instruct-q4_k_m.gguf",
        "description": "Lightweight 1.5B model, great for simple tasks",
        "size": "~1 GB",
    },
    {
        "name": "Qwen 2.5 7B Instruct",
        "repo_id": "Qwen/Qwen2.5-7B-Instruct-GGUF",
        "filename": "qwen2.5-7b-instruct-q4_k_m.gguf",
        "description": "Strong 7B model for complex reasoning",
        "size": "~4.5 GB",
    },
    {
        "name": "Llama 3.2 3B Instruct",
        "repo_id": "bartowski/Llama-3.2-3B-Instruct-GGUF",
        "filename": "Llama-3.2-3B-Instruct-Q4_K_M.gguf",
        "description": "Good balance of speed and quality",
        "size": "~2 GB",
    },
    {
        "name": "Llama 3.1 8B Instruct",
        "repo_id": "hugging-quants/Llama-3.1-8B-Instruct-GGUF",
        "filename": "Llama-3.1-8B-Instruct-Q4_K_M.gguf",
        "description": "Popular 8B general-purpose model",
        "size": "~4.5 GB",
    },
    {
        "name": "DeepSeek R1 Distill Qwen 7B",
        "repo_id": "MaziyarPanahi/DeepSeek-R1-Distill-Qwen-7B-GGUF",
        "filename": "DeepSeek-R1-Distill-Qwen-7B-Q4_K_M.gguf",
        "description": "Reasoning-focused distilled model",
        "size": "~4.5 GB",
    },
    {
        "name": "Mistral 7B Instruct v0.3",
        "repo_id": "MaziyarPanahi/Mistral-7B-Instruct-v0.3-GGUF",
        "filename": "Mistral-7B-Instruct-v0.3-Q4_K_M.gguf",
        "description": "Efficient 7B from Mistral AI",
        "size": "~4 GB",
    },
    {
        "name": "Gemma 2 2B Instruct",
        "repo_id": "hugging-quants/gemma-2-2b-it-GGUF",
        "filename": "gemma-2-2b-it-Q4_K_M.gguf",
        "description": "Google's lightweight 2B model",
        "size": "~1.5 GB",
    },
    {
        "name": "Phi-3 Mini 3.8B Instruct",
        "repo_id": "microsoft/Phi-3-mini-4k-instruct-gguf",
        "filename": "Phi-3-mini-4k-instruct-q4.gguf",
        "description": "Microsoft's capable small model",
        "size": "~2.5 GB",
    },
    {
        "name": "DeepSeek Coder 6.7B Instruct",
        "repo_id": "TheBloke/deepseek-coder-6.7b-instruct-GGUF",
        "filename": "deepseek-coder-6.7b-instruct.Q4_K_M.gguf",
        "description": "Excellent for code generation tasks",
        "size": "~4 GB",
    },
    {
        "name": "Nous Hermes 2 Mixtral 8x7B",
        "repo_id": "NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO-GGUF",
        "filename": "Nous-Hermes-2-Mixtral-8x7B-DPO-Q4_K_M.gguf",
        "description": "High-quality MoE model, ~47B active",
        "size": "~25 GB",
    },
]


class GGUFManager:
    def __init__(self, models_dir: str | None = None):
        self._models_dir = models_dir or os.path.expanduser("~/.jarvis/models")
        os.makedirs(self._models_dir, exist_ok=True)

    @property
    def models_dir(self) -> str:
        return self._models_dir

    def list_models(self) -> list[dict]:
        import glob
        results = []
        for p in sorted(glob.glob(os.path.join(self._models_dir, "*.gguf"))):
            st = os.stat(p)
            results.append({
                "name": os.path.basename(p),
                "sizeBytes": st.st_size,
                "path": p,
                "modifiedAt": st.st_mtime,
            })
        return results

    def delete_model(self, name: str) -> bool:
        path = os.path.join(self._models_dir, name)
        if not os.path.exists(path):
            logger.warning("Model not found: %s", path)
            return False
        os.remove(path)
        logger.info("Deleted model: %s", path)
        return True

    def get_catalog(self) -> list[dict]:
        return CATALOG

    def get_disk_usage(self) -> dict:
        total = 0
        count = 0
        for p in self.list_models():
            total += p["sizeBytes"]
            count += 1
        return {"totalBytes": total, "count": count, "modelsDir": self._models_dir}

    def validate_remote_file(self, repo_id: str, filename: str) -> bool:
        import httpx
        url = f"https://huggingface.co/{repo_id}/resolve/main/{filename}"
        try:
            resp = httpx.head(url, follow_redirects=True, timeout=10)
            return resp.is_success
        except Exception as e:
            logger.warning("Failed to validate remote file %s: %s", url, e)
            return False

    def download_model(
        self,
        repo_id: str,
        filename: str,
        on_progress: Callable[[int, int], None] | None = None,
    ) -> str:
        from huggingface_hub import hf_hub_download
        path = hf_hub_download(
            repo_id=repo_id,
            filename=filename,
            local_dir=self._models_dir,
            local_dir_use_symlinks=False,
            resume=True,
        )
        os.makedirs(self._models_dir, exist_ok=True)
        if path:
            import shutil
            dst = os.path.join(self._models_dir, filename)
            if path != dst:
                shutil.move(path, dst)
            logger.info("Downloaded model %s/%s -> %s", repo_id, filename, dst)
        return path or ""
