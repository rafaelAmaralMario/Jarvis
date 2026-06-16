# Piper TTS (Text-to-Speech Rápido)

## Descrição
Integrar Piper TTS para síntese de voz rápida e leve (roda em CPU). Criar tool `synthesize_speech` no ToolManager. Centenas de vozes disponíveis, latência ~0.1s por frase. Ideal para resposta de voz em tempo real.

## Análise Técnica

### Arquitetura

**Estratégia**: Backend roda Piper TTS localmente (CPU, latência ~100ms por frase). Bridge expõe método `ttsSynthesize(text, voice)`. Frontend recebe áudio codificado como base64 no campo `audioBase64` do StreamState e reproduz via Web Audio API.

**Fluxo de dados**:
```
[Agente gera resposta texto] → bridge.ttsSynthesize() → piper-tts → WAV → base64 → stream["audioBase64"] → UI poll → AudioContext.play()
```

**Duas abordagens para integração com o agente**:
1. **Tool-driven**: Agente chama tool `synthesize_speech` explicitamente. Resultado da tool contém path do WAV.
2. **Pipeline automático**: Bridge method `ttsSynthesize` é chamada automaticamente após cada resposta do agente. Melhor UX.

**Recomendação**: Combinar ambas. Tool `synthesize_speech` para uso explícito pelo agente. Bridge `ttsSynthesize` para o frontend converter qualquer texto em voz automaticamente quando em modo de conversa por voz.

**Gerenciamento de vozes**: Vozes são arquivos `.onnx` + `.json` (config) baixados de https://huggingface.co/rhasspy/piper-voices. Armazenar em `~/.jarvis/voices/<voice_name>/`. Baixar sob demanda.

**Arquivos a modificar/criar**:
| Arquivo | Ação |
|---|---|
| `backend/jarvis/audio_tts.py` | **Novo**: Módulo PiperTTS (download, cache, síntese) |
| `backend/jarvis/tool_manager.py` | Add tool `synthesize_speech` + handler |
| `backend/jarvis/bridge.py` | Add method `ttsSynthesize(text, voice)` |
| `ui/src/types/index.ts` | Add `audioBase64` to StreamState |
| `ui/src/components/AiPanel.tsx` | Add auto-playback when StreamState has audioBase64 |

### Implementação Detalhada

1. **Backend — Instalar Piper**:
   ```bash
   pip install piper-tts
   ```
   Piper-tts é um binding Python para o motor Piper TTS C++. Compilado para Windows, Linux, macOS. Depende de `onnxruntime`.

2. **Backend — Módulo `audio_tts.py`**:
   ```python
   import os, json, requests, logging
   from pathlib import Path
   from piper import PiperVoice

   logger = logging.getLogger(__name__)

   PIPER_VOICES_DIR = Path.home() / ".jarvis" / "voices"
   VOICE_INDEX_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/main/voices.json"

   _VOICE_CACHE: dict[str, PiperVoice] = {}

   def _get_voice_dir(name: str) -> Path:
       return PIPER_VOICES_DIR / name

   def _get_voice_path(name: str) -> Path:
       return _get_voice_dir(name) / f"{name}.onnx"

   def _get_config_path(name: str) -> Path:
       return _get_voice_dir(name) / f"{name}.json"

   def list_available_voices() -> list[dict]:
       # Retorna lista de vozes disponíveis do index do HuggingFace
       resp = requests.get(VOICE_INDEX_URL, timeout=10)
       return resp.json().get("voices", [])

   def download_voice(name: str) -> bool:
       # Baixa .onnx + .json para ~/.jarvis/voices/<name>/
       base_url = f"https://huggingface.co/rhasspy/piper-voices/resolve/main/{name}/"
       ...
       return True

   def synthesize(text: str, voice: str = "pt_BR-faber-medium", output_path: str | None = None) -> bytes:
       voice_path = _get_voice_path(voice)
       config_path = _get_config_path(voice)

       if voice not in _VOICE_CACHE:
           if not voice_path.exists():
               download_voice(voice)
           with open(config_path) as f:
               config = json.load(f)
           _VOICE_CACHE[voice] = PiperVoice(str(voice_path), config)

       piper_voice = _VOICE_CACHE[voice]

       if output_path:
           with open(output_path, "wb") as f:
               piper_voice.synthesize(text, f)
           return open(output_path, "rb").read()
       else:
           import io
           buf = io.BytesIO()
           piper_voice.synthesize(text, buf)
           return buf.getvalue()
   ```

3. **Backend — ToolManager: tool `synthesize_speech`** (`tool_manager.py`):
   ```python
   "synthesize_speech": ToolDefinition(
       name="synthesize_speech",
       description="Converte texto em fala usando Piper TTS. Gera arquivo .wav.",
       parameters={
           "type": "object",
           "properties": {
               "text": {"type": "string", "description": "Texto a ser sintetizado"},
               "voice": {"type": "string", "description": "Nome da voz (ex: pt_BR-faber-medium)", "default": "pt_BR-faber-medium"},
               "output": {"type": "string", "description": "Caminho do arquivo .wav de saída", "default": ""},
           },
           "required": ["text"],
       },
       risk=RiskLevel.SAFE,
       examples=["synthesize_speech text='Olá mundo'", "synthesize_speech text='Bom dia' voice='pt_BR-faber-medium'"],
   ),
   ```
   Handler `_handle_synthesize_speech`:
   ```python
   def _handle_synthesize_speech(self, args: dict) -> ToolResult:
       from jarvis.audio_tts import synthesize
       text = args["text"]
       voice = args.get("voice", "pt_BR-faber-medium")
       output = args.get("output", "")
       if output:
           output_path = self._resolve_path(output)
           os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
           synthesize(text, voice, output_path)
           return ToolResult(success=True, output=f"Áudio gerado: {output_path}", data={"path": output_path})
       else:
           audio_bytes = synthesize(text, voice)
           import base64
           b64 = base64.b64encode(audio_bytes).decode()
           return ToolResult(success=True, output="Áudio gerado (base64 inline)", data={"audioBase64": b64, "format": "wav"})
   ```

4. **Backend — Bridge: `ttsSynthesize`** (`bridge.py`):
   ```python
   def ttsSynthesize(self, text: str, voice: str = "pt_BR-faber-medium") -> dict:
       try:
           from jarvis.audio_tts import synthesize
           audio_bytes = synthesize(text, voice)
           import base64
           return {
               "success": True,
               "audioBase64": base64.b64encode(audio_bytes).decode(),
               "format": "wav",
           }
       except Exception as e:
           logger.exception("ttsSynthesize failed")
           return {"success": False, "error": str(e)}
   ```

5. **Frontend — StreamState**: Add `audioBase64` field:
   ```typescript
   export interface StreamState {
     ...
     audioBase64?: string;
   }
   ```

6. **Frontend — AiPanel: Auto-playback**:
   - Watch for `state.audioBase64` in polling loop
   - On new audioBase64, decode and play via `AudioContext`:
   ```typescript
   function playAudioBase64(b64: string) {
     const binary = atob(b64);
     const bytes = new Uint8Array(binary.length);
     for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
     const ctx = new AudioContext();
     ctx.decodeAudioData(bytes.buffer, (buffer) => {
       const src = ctx.createBufferSource();
       src.buffer = buffer;
       src.connect(ctx.destination);
       src.start();
     });
   }
   ```
   **Alternativa**: Converter base64 para blob URL e usar `<audio>` element:
   ```typescript
   const blob = new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type: 'audio/wav' });
   const url = URL.createObjectURL(blob);
   new Audio(url).play();
   ```

7. **Voz pt-BR padrão**: `pt_BR-faber-medium` (voz masculina, naturalidade média, ~30MB). Baixada automaticamente no primeiro uso.

### Dependências

| Pacote | Tam. | Por quê |
|---|---|---|
| `piper-tts` | ~5MB (wheel) | Bindings Python para Piper TTS C++. Roda 100% em CPU |
| `onnxruntime` | ~30MB | Runtime ONNX para execução do modelo de voz |
| Voz `pt_BR-faber-medium` | ~30MB download | Modelo ONNX + config JSON |

Total: ~35MB de bibliotecas + ~30MB por voz baixada sob demanda.

### Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| piper-tts pode ter bindings instáveis no Windows | Testar em Windows primeiro. Fallback: subprocess chamando piper.exe standalone |
| Download de vozes falha sem internet | Cache local com fallback para voz offline. Baixar vozes populares durante setup |
| Latência de primeira chamada (carregar modelo) | Cache em `_VOICE_CACHE` global. Primeira chamada leva ~500ms para carregar ONNX, subsequentes ~100ms por frase |
| Qualidade de voz média (menos natural que Tacotron2) | Piper é escolhido por velocidade. Se precisar de qualidade, card 004_CoquiVoiceClone para voz mais natural |

## Use Cases

1. **Resposta falada do agente**: LLM responde "Claro, vou criar o arquivo agora". Bridge automaticamente chama `ttsSynthesize` com a resposta. Frontend reproduz áudio. Usuário ouve a resposta.
2. **Geração de narração**: Tool `synthesize_speech` usada pelo agente para criar arquivos de narração para vídeos ou apresentações. Salva `.wav` no workspace.
3. **Seleção de voz**: Usuário muda voz no settings para `en_US-amy-medium`. Todas as respostas passam a usar voz americana feminina.

## Test Cases

1. [ ] `synthesize_speech(text="Olá mundo")` → retorna `success=True` com `data.audioBase64` contendo WAV válido (>100 bytes)
2. [ ] `synthesize_speech(text="Teste", output="output.wav")` → arquivo `output.wav` criado, válido, .wav header
3. [ ] Voz `pt_BR-faber-medium` não baixada → `synthesize` baixa automaticamente antes de sintetizar
4. [ ] Frontend recebe `audioBase64` → `AudioContext.decodeAudioData` sucede sem erro
5. [ ] `ttsSynthesize` com texto vazio → retorna erro "Text cannot be empty"

## Critérios de Aceitação
- [x] Instalar Piper TTS (sistema + python bindings)
- [x] Tool `synthesize_speech`: texto → arquivo de áudio (.wav)
- [x] Download e seleção de vozes
- [x] Reprodução automática no frontend
- [x] Suporte a português brasileiro

## Fase
Fase 2 — Áudio

## Prioridade
Média

## Esforço Estimado
Médio

