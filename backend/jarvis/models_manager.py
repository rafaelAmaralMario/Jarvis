import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Callable

from jarvis.database import Database
from jarvis.ollama_client import OllamaClient


class ModelStatus(Enum):
    NOT_DOWNLOADED = "not_downloaded"
    DOWNLOADED = "downloaded"
    RUNNING = "running"
    STOPPED = "stopped"
    ERROR = "error"


class ModelSpecialty(Enum):
    CHAT = "chat"
    CODE = "code"
    REASONING = "reasoning"
    EMBEDDING = "embedding"
    VISION = "vision"
    GENERAL = "general"


@dataclass
class ModelInfo:
    name: str = ""
    specialty: ModelSpecialty = ModelSpecialty.GENERAL
    status: ModelStatus = ModelStatus.NOT_DOWNLOADED
    size: str = ""
    modified: str = ""
    description: str = ""
    color: str = "#8b949e"
    icon: str = "🤖"
    error_message: str = ""


@dataclass
class ModelMetadata:
    specialty: ModelSpecialty = ModelSpecialty.GENERAL
    notes: str = ""
    color: str = "#8b949e"
    icon: str = "🤖"


ProgressCallback = Callable[[str, int], None]


SPECIALTY_COLORS = {
    ModelSpecialty.CHAT: "#58a6ff",
    ModelSpecialty.CODE: "#3fb950",
    ModelSpecialty.REASONING: "#a371f7",
    ModelSpecialty.EMBEDDING: "#d29922",
    ModelSpecialty.VISION: "#f778ba",
    ModelSpecialty.GENERAL: "#8b949e",
}

SPECIALTY_ICONS = {
    ModelSpecialty.CHAT: "💬",
    ModelSpecialty.CODE: "💻",
    ModelSpecialty.REASONING: "🧠",
    ModelSpecialty.EMBEDDING: "📐",
    ModelSpecialty.VISION: "👁",
    ModelSpecialty.GENERAL: "🤖",
}


def _infer_specialty(name: str) -> ModelSpecialty:
    lower = name.lower()
    if any(kw in lower for kw in ("code", "coder", "deepseek-coder")):
        return ModelSpecialty.CODE
    if any(kw in lower for kw in ("embed", "mxbai")):
        return ModelSpecialty.EMBEDDING
    if any(kw in lower for kw in ("reason", "deepseek-r1", "qw")):
        return ModelSpecialty.REASONING
    if any(kw in lower for kw in ("llava", "vision", "moondream")):
        return ModelSpecialty.VISION
    if any(kw in lower for kw in ("llama", "mistral", "gemma")):
        return ModelSpecialty.CHAT
    return ModelSpecialty.GENERAL


def _format_size(bytes_val: int) -> str:
    if bytes_val < 1024 * 1024:
        return f"{bytes_val // 1024} KB"
    elif bytes_val < 1024 * 1024 * 1024:
        return f"{bytes_val // (1024 * 1024)} MB"
    else:
        gb = bytes_val / (1024.0 * 1024.0 * 1024.0)
        return f"{gb:.1f} GB"


class ModelsManager:
    def __init__(self, db: Database, ollama: OllamaClient | None = None):
        self._db = db
        self._ollama = ollama or OllamaClient()
        self._progress_cb: ProgressCallback | None = None

    def set_pull_progress_callback(self, cb: ProgressCallback) -> None:
        self._progress_cb = cb

    def list_models(self) -> list[ModelInfo]:
        ollama_models = self._ollama.list_models()
        result: list[ModelInfo] = []
        for om in ollama_models:
            info = ModelInfo(
                name=om.name,
                size=_format_size(om.size_bytes),
                modified=om.modified_at,
                description=om.details,
            )
            self._load_metadata(info)
            info.status = self._estimate_status(info.name)
            result.append(info)
        return result

    def get_model(self, name: str) -> ModelInfo:
        models = self.list_models()
        for m in models:
            if m.name == name:
                return m
        specialty = _infer_specialty(name)
        return ModelInfo(
            name=name,
            status=ModelStatus.NOT_DOWNLOADED,
            specialty=specialty,
            color=SPECIALTY_COLORS[specialty],
            icon=SPECIALTY_ICONS[specialty],
        )

    def pull_model(self, name: str) -> bool:
        if self._progress_cb:
            self._progress_cb(name, 0)
        ok = self._ollama.pull_model(name)
        if ok:
            specialty = _infer_specialty(name)
            meta = ModelMetadata(
                specialty=specialty,
                color=SPECIALTY_COLORS[specialty],
                icon=SPECIALTY_ICONS[specialty],
            )
            self.update_model_metadata(name, meta)
        if self._progress_cb:
            self._progress_cb(name, 100)
        return ok

    def delete_model(self, name: str) -> bool:
        return self._ollama.delete_model(name)

    def start_model(self, name: str) -> bool:
        from jarvis.ollama_client import OllamaGenerateRequest

        req = OllamaGenerateRequest(
            model=name,
            prompt=".",
            max_tokens=1,
            stream=False,
        )
        result = self._ollama.generate(req)
        return result.done

    def stop_model(self, name: str) -> bool:
        from jarvis.ollama_client import OllamaGenerateRequest

        req = OllamaGenerateRequest(
            model=name,
            prompt=".",
            max_tokens=1,
            stream=False,
        )
        self._ollama.generate(req)
        return True

    def get_model_status(self, name: str) -> ModelStatus:
        return self._estimate_status(name)

    def update_model_metadata(self, name: str, meta: ModelMetadata) -> bool:
        import datetime
        now = datetime.datetime.now(datetime.timezone.utc).strftime(
            "%Y-%m-%dT%H:%M:%S.%fZ"
        )
        self._db.execute(
            """
            INSERT INTO model_metadata (model_name, specialty, notes, color, icon, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(model_name) DO UPDATE SET
                specialty = excluded.specialty,
                notes = excluded.notes,
                color = excluded.color,
                icon = excluded.icon,
                updated_at = excluded.updated_at
            """,
            (name, meta.specialty.value, meta.notes, meta.color, meta.icon, now),
        )
        return True

    def get_model_by_specialty(self, specialty: ModelSpecialty) -> ModelInfo:
        models = self.list_models()
        for m in models:
            if m.specialty == specialty and m.status == ModelStatus.RUNNING:
                return m
        for m in models:
            if m.specialty == specialty and m.status != ModelStatus.NOT_DOWNLOADED:
                return m
        for m in models:
            if m.specialty == specialty:
                return m
        return ModelInfo()

    def _load_metadata(self, info: ModelInfo) -> None:
        row = self._db.fetchone(
            "SELECT specialty, notes, color, icon FROM model_metadata WHERE model_name = ?",
            (info.name,),
        )
        if row:
            info.specialty = ModelSpecialty(row["specialty"])
            info.color = row["color"]
            info.icon = row["icon"]
        else:
            info.specialty = _infer_specialty(info.name)
            info.color = SPECIALTY_COLORS[info.specialty]
            info.icon = SPECIALTY_ICONS[info.specialty]

    def _estimate_status(self, name: str) -> ModelStatus:
        if not self._ollama.ping():
            return ModelStatus.ERROR
        return ModelStatus.RUNNING
