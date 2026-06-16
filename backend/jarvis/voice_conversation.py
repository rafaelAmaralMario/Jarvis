"""Voice conversation pipeline: STT → LLM → TTS."""

import base64
import logging
import os
import tempfile
import time

logger = logging.getLogger(__name__)

_whisper_model = None


def _get_whisper(model_size: str = "tiny"):
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel
        _whisper_model = WhisperModel(model_size, device="cpu", compute_type="int8")
    return _whisper_model


def run_pipeline(
    audio_base64: str,
    llm_gateway,
    tools,
    model: str = "",
    provider: str = "ollama",
    system: str = "",
    history: list | None = None,
    model_size: str = "tiny",
    tts_voice: str = "pt_BR-faber-medium",
    on_progress=None,
) -> dict:
    from jarvis.audio_tts import synthesize as tts_synthesize
    from jarvis.tool_agent import ToolAgent

    start = time.time()
    result = {"text": "", "response": "", "audioBase64": "", "timings": {}}

    def progress(status: str, **kwargs):
        if on_progress:
            on_progress(status=status, **kwargs)

    # Step 1: Decode audio
    try:
        audio_bytes = base64.b64decode(audio_base64)
    except Exception as e:
        result["error"] = f"Invalid audio data: {e}"
        return result

    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    tmp.write(audio_bytes)
    tmp.close()

    try:
        # Step 2: Transcribe (STT)
        t0 = time.time()
        progress("transcribing")
        model_whisper = _get_whisper(model_size)
        segments, info = model_whisper.transcribe(tmp.name, language="pt")
        text = " ".join(s.text for s in segments)
        result["text"] = text
        result["timings"]["stt"] = time.time() - t0
        result["language"] = info.language if info else ""

        if not text.strip():
            result["error"] = "Nenhum áudio detectado"
            result["timings"]["total"] = time.time() - start
            return result

        # Step 3: LLM (ToolAgent)
        t0 = time.time()
        progress("thinking")
        agent = ToolAgent(
            llm=llm_gateway,
            tools=tools,
            model=model,
            provider=provider,
        )
        response = agent.execute(text, history=history, system_override=system or None)
        resp_text = response.get("content", "") or response.get("output", "")
        result["response"] = resp_text
        result["timings"]["llm"] = time.time() - t0

        if not resp_text.strip():
            result["error"] = "LLM não gerou resposta"
            result["timings"]["total"] = time.time() - start
            return result

        # Step 4: TTS
        t0 = time.time()
        progress("speaking")
        audio_bytes = tts_synthesize(resp_text, voice=tts_voice)
        result["audioBase64"] = base64.b64encode(audio_bytes).decode()
        result["timings"]["tts"] = time.time() - t0

    except Exception as e:
        logger.exception("Voice pipeline failed")
        result["error"] = str(e)
    finally:
        try:
            os.unlink(tmp.name)
        except Exception:
            pass

    result["timings"]["total"] = time.time() - start
    logger.info(
        "Voice pipeline: STT=%.2fs LLM=%.2fs TTS=%.2fs total=%.2fs",
        result["timings"].get("stt", 0),
        result["timings"].get("llm", 0),
        result["timings"].get("tts", 0),
        result["timings"]["total"],
    )
    return result
