# Whisper Speech-to-Text

## Descrição
Integrar Whisper (openai-whisper ou faster-whisper) para transcrição de áudio em texto. Criar tool `transcribe_audio` no ToolManager. Suporte a microfone ao vivo para comando de voz. Modelos tiny→large, tiny cabe em CPU.

## Análise Técnica

### Arquitetura

**Estratégia de captura**: Frontend captura áudio via MediaRecorder API (navegador), envia blob WAV ao backend como base64 via nova bridge method `audioTranscribe`. Backend decodifica, roda `faster-whisper`, retorna texto. O texto é injetado no input do chat (ou enviado direto como mensagem).

**Por que frontend captura?**: Evita thread de áudio no Python (simplifica deploy), aproveita APIs nativas do navegador (Web Audio API), elimina dependência de pyaudio/sounddevice no backend, funciona em qualquer plataforma sem drivers de áudio extras.

**Fluxo de dados**:
```
[Microfone] → MediaRecorder (UI) → blob WAV → base64 → bridge.audioTranscribe() → faster-whisper → texto → preenche input do chat
```

**Arquivos a modificar/criar**:
| Arquivo | Ação |
|---|---|
| `backend/jarvis/tool_manager.py` | Add tool `transcribe_audio` + handler |
| `backend/jarvis/bridge.py` | Add method `audioTranscribe(audioBase64)` |
| `ui/src/types/index.ts` | Add `AudioTranscribeResult` type |
| `ui/src/components/AiPanel.tsx` | Add microphone button, recording UI |
| `ui/src/hooks/use-jarvis.ts` | Add `audioTranscribe` bridge method |

### Implementação Detalhada

1. **Backend — Instalar faster-whisper**:
   ```bash
   pip install faster-whisper
   ```
   faster-whisper é ~4x mais rápido que openai-whisper em CPU, suporta int8 quantization, consome ~1GB RAM com modelo tiny.

2. **Backend — ToolManager: tool `transcribe_audio`** (`tool_manager.py`):
   - ToolDefinition:
     ```python
     "transcribe_audio": ToolDefinition(
         name="transcribe_audio",
         description="Transcreve um arquivo de áudio (.wav/.mp3/.ogg) para texto usando Whisper.",
         parameters={
             "type": "object",
             "properties": {
                 "path": {"type": "string", "description": "Caminho para o arquivo de áudio"},
                 "model": {"type": "string", "description": "Modelo: tiny, base, small, medium, large", "default": "tiny"},
                 "language": {"type": "string", "description": "Código do idioma (auto detectado se omitido)", "default": ""},
             },
             "required": ["path"],
         },
         risk=RiskLevel.SAFE,
         examples=["transcribe_audio path='audio.wav'", "transcribe_audio path='gravacao.mp3' model='base' language='pt'"],
     )
     ```
   - Handler `_handle_transcribe_audio`:
     ```python
     def _handle_transcribe_audio(self, args: dict) -> ToolResult:
         import faster_whisper
         path = self._resolve_path(args["path"])
         model_size = args.get("model", "tiny")
         language = args.get("language", None)
         model = faster_whisper.WhisperModel(model_size, device="cpu", compute_type="int8")
         segments, info = model.transcribe(path, language=language)
         text = " ".join(seg.text for seg in segments)
         return ToolResult(success=True, output=text, data={"language": info.language, "duration": info.duration})
     ```

3. **Backend — Bridge: `audioTranscribe`** (`bridge.py`):
   ```python
   def audioTranscribe(self, audio_base64: str, model: str = "tiny") -> dict:
       import base64, tempfile
       audio_bytes = base64.b64decode(audio_base64)
       tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
       tmp.write(audio_bytes)
       tmp.close()
       result = self._tools.execute("transcribe_audio", {"path": tmp.name, "model": model})
       os.unlink(tmp.name)
       return {"success": result.success, "text": result.output, "error": result.error}
   ```

4. **Frontend — Types** (`types/index.ts`):
   ```typescript
   export interface AudioTranscribeResult {
     success: boolean;
     text: string;
     error?: string;
   }
   ```

5. **Frontend — Bridge hook** (`use-jarvis.ts`):
   ```typescript
   audioTranscribe: (audioBase64: string, model?: string) =>
     send('audioTranscribe', audioBase64, model) as Promise<AudioTranscribeResult>,
   ```

6. **Frontend — AiPanel: Microphone button**:
   - Add state: `isRecording`, `mediaRecorder`, `audioChunks`
   - Add `startRecording()`: request `navigator.mediaDevices.getUserMedia({ audio: true })`, create `MediaRecorder`, collect chunks
   - Add `stopRecording()`: stop recorder, assemble blob, convert to base64, call `bridge.audioTranscribe()`, set input text
   - Add mic button next to the text input (before the send button)
   - Style: red pulsing dot when recording, mic icon when idle

7. **Frontend — Audio playback** (for TTS integration later):
   - Add `playAudio(base64OrUrl)` utility using `AudioContext` or `<audio>` element

### Dependências

| Pacote | Tam. | Por quê |
|---|---|---|
| `faster-whisper` | ~300MB (modelos opcionais: tiny=150MB, base=280MB) | 4x mais rápido que openai-whisper em CPU, int8 quantization, menor memória |
| Modelo `tiny` | 150MB download | Cabe em CPU, latência ~1-2s por frase |

Não precisa de `pyaudio` ou `sounddevice` — captura é feita no frontend via MediaRecorder API.

### Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Modelo tiny tem precisão menor (~70% WER pt-BR) | Oferecer seleção de modelo (tiny/base/small). tiny para comandos, base para ditado |
| Latência de transcrição em CPU fraca | tiny leva ~1s/10s de áudio em CPU moderna. Para <5s total, manter áudio <30s |
| MediaRecorder não suportado em pywebview antigo | Fallback: backend captura com sounddevice se Web API falhar |
| Arquivos temporários acumulados | Usar tempfile + cleanup no finally |

## Use Cases

1. **Comando de voz rápido**: Usuário clica microfone, diz "abrir arquivo main.ts", solta. Áudio transcrito → texto aparece no input. Usuário revisa e envia.
2. **Dictação de mensagem longa**: Usuário grava mensagem de 30s explicando um bug. Whisper transcreve com modelo `base` para melhor precisão. Texto colado no chat.
3. **Transcrição de arquivo**: Tool `transcribe_audio` usada pelo agente para transcrever reuniões gravadas ou áudios no workspace.

## Test Cases

1. [ ] Gravar 5s de áudio limpo ("Olá JARVIS") → transcrição retorna "Olá JARVIS" com confidence > 0.8
2. [ ] Tool `transcribe_audio` com path inválido → erro "File not found"
3. [ ] Enviar base64 inválido → bridge retorna `{success: false, error: "Invalid audio data"}`
4. [ ] Modelo `tiny` transcreve áudio de 10s em < 3s em CPU (sem GPU)
5. [ ] Botão de microfone alterna entre estado idle (🎤) e recording (🔴) corretamente

## Critérios de Aceitação
- [x] Instalar openai-whisper ou faster-whisper
- [x] Tool `transcribe_audio`: áudio → texto
- [x] Suporte a captura de microfone ao vivo
- [x] Integração com AiPanel (botão de microfone para gravar)
- [x] Streaming de transcrição parcial (opcional)
- [x] Seleção de modelo (tiny/base/small/medium/large)

## Fase
Fase 2 — Áudio

## Prioridade
Média

## Esforço Estimado
Médio

