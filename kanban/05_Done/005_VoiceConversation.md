# Modo de Conversa por Voz

## Descrição
Implementar modo de conversa por voz completo: microfone → Whisper STT → LLM → TTS → áudio reproduzido. Interface com botão de gravar no AiPanel. Detecção de fim de fala (VAD) para gravação contínua. Latência total < 5s.

## Análise Técnica

### Arquitetura

**Pipeline completo**:
```
[Microfone] → VAD (silêncio detectado) → MediaRecorder para blob → base64
    → Transcribe (faster-whisper) → texto → LLM (ToolAgent) → resposta texto
    → TTS (piper-tts) → WAV → base64 → play na UI
```

**Duas modalidades de entrada**:
1. **Pressione-para-falar** (Push-to-Talk): Usuário segura botão, grava, solta → processa. Mais simples, sem VAD.
2. **Gravação contínua com VAD** (Mãos-livres): Usuário clica "Ouvir", microfone fica ativo. VAD detecta quando usuário para de falar, automaticamente processa. Ideal para conversa fluida.

**Recomendação**: Implementar push-to-talk primeiro (simples, sem dependência extra de VAD), depois VAD como melhoria. Push-to-talk já atinge latência < 5s.

**Fluxo completo no backend** (via streaming bridge):
```
voiceConversationStream(audioBase64, convId, history) → thread:
  1. faster-whisper: audioBase64 → texto
  2. ToolAgent.execute(texto, history) → resposta
  3. piper-tts: resposta → audioBase64
  4. stream["text"] = texto transcrito
  5. stream["response"] = resposta LLM
  6. stream["audioBase64"] = áudio TTS
```

**Arquivos a modificar/criar**:
| Arquivo | Ação |
|---|---|
| `backend/jarvis/voice_conversation.py` | **Novo**: Orquestrador do pipeline completo |
| `backend/jarvis/bridge.py` | Add `voiceConversationStream`, `voiceConversationGetStream` |
| `ui/src/types/index.ts` | Add `VoiceConversationState` type |
| `ui/src/components/AiPanel.tsx` | Add voice mode toggle, VAD recording, status indicators |
| `ui/src/hooks/use-jarvis.ts` | Add `voiceConversationStream`, `voiceConversationGetStream` |

### Implementação Detalhada

1. **Backend — Orquestrador `voice_conversation.py`**:
   ```python
   import base64, io, logging, wave, time
   from faster_whisper import WhisperModel
   from jarvis.audio_tts import synthesize as tts_synthesize
   from jarvis.tool_agent import ToolAgent

   logger = logging.getLogger(__name__)

   _whisper_model: WhisperModel | None = None

   def _get_whisper(model_size="tiny"):
       global _whisper_model
       if _whisper_model is None:
           _whisper_model = WhisperModel(model_size, device="cpu", compute_type="int8")
       return _whisper_model

   def run_pipeline(audio_base64: str, agent: ToolAgent, model_size="tiny", tts_voice="pt_BR-faber-medium") -> dict:
       start = time.time()
       result = {"text": "", "response": "", "audioBase64": "", "timings": {}}

       # Step 1: Decode audio
       audio_bytes = base64.b64decode(audio_base64)
       tmp_path = f"/tmp/voice_input_{int(time.time())}.wav"
       with open(tmp_path, "wb") as f:
           f.write(audio_bytes)

       # Step 2: Transcribe (STT)
       t0 = time.time()
       model = _get_whisper(model_size)
       segments, info = model.transcribe(tmp_path, language="pt")
       text = " ".join(s.text for s in segments)
       result["text"] = text
       result["timings"]["stt"] = time.time() - t0
       os.unlink(tmp_path)

       if not text.strip():
           result["error"] = "Nenhum áudio detectado"
           return result

       # Step 3: LLM (ToolAgent)
       t0 = time.time()
       response = agent.execute(text)
       result["response"] = response.get("content", "")
       result["timings"]["llm"] = time.time() - t0

       # Step 4: TTS
       t0 = time.time()
       audio_bytes = tts_synthesize(result["response"], voice=tts_voice)
       result["audioBase64"] = base64.b64encode(audio_bytes).decode()
       result["timings"]["tts"] = time.time() - t0

       result["timings"]["total"] = time.time() - start
       logger.info(f"Voice pipeline: STT={result['timings']['stt']:.2f}s LLM={result['timings']['llm']:.2f}s TTS={result['timings']['tts']:.2f}s total={result['timings']['total']:.2f}s")
       return result
   ```

2. **Backend — Bridge: `voiceConversationStream`** (`bridge.py`):
   - Similar a `toolAgentExecuteStream`: cria thread, armazena estado em `_voice_streams[task_id]`
   - Estado inclui: `text` (transcrito), `response` (LLM), `audioBase64`, `status`, `timings`, `done`
   ```python
   _voice_streams: dict[str, dict] = {}

   def voiceConversationStream(self, audio_base64: str, conv_id: str = "", history: list | None = None, agent_id: str = "") -> dict:
       task_id = str(uuid.uuid4())
       stream = {
           "text": "", "response": "", "audioBase64": "",
           "status": "transcribing", "timings": {},
           "done": False, "error": None,
       }
       JARVISBridge._voice_streams[task_id] = stream

       def _run():
           try:
               agent_model = ""
               agent_provider = "ollama"
               if agent_id and self._agents:
                   agent = self._agents.get_agent(agent_id)
                   if agent:
                       agent_model = agent.model or ""
                       agent_provider = getattr(agent, "provider", "ollama")

               agent_instance = ToolAgent(
                   llm=self._llm, tools=self._tools,
                   model=agent_model, provider=agent_provider,
               )
               stream["status"] = "transcribing"
               result = run_pipeline(audio_base64, agent_instance)
               stream.update(result)
               stream["status"] = "done" if not result.get("error") else "error"
           except Exception as e:
               logger.exception("voiceConversationStream failed")
               stream["error"] = str(e)
               stream["status"] = "error"
           finally:
               stream["done"] = True

       thread = threading.Thread(target=_run, daemon=True)
       thread.start()
       return {"taskId": task_id}

   def voiceConversationGetStream(self, task_id: str) -> dict:
       stream = JARVISBridge._voice_streams.get(task_id)
       if not stream:
           return {"done": True, "error": "Task not found"}
       return dict(stream)
   ```

3. **Frontend — Types** (`types/index.ts`):
   ```typescript
   export interface VoiceConversationState {
     text: string;
     response: string;
     audioBase64?: string;
     status: 'idle' | 'recording' | 'transcribing' | 'thinking' | 'speaking' | 'done' | 'error';
     timings?: { stt: number; llm: number; tts: number; total: number };
     done: boolean;
     error?: string | null;
   }
   ```

4. **Frontend — AiPanel: Voice mode integration**:
   - Add voice mode toggle button (🎤) next to input, activates voice mode
   - States: `voiceStatus: 'idle' | 'recording' | 'transcribing' | 'thinking' | 'speaking'`
   - VAD: Use `webrtcvad` no frontend via simple silence detection on `AnalyserNode` frequency data, OR timer-based (stop recording after 1.5s of silence)
   - Simpler approach: Timer-based VAD. `setInterval` checks `audioLevel` from `AnalyserNode`. If below threshold >1.5s, auto-stop.
   - Status indicator:
     - 🔴 "Ouvindo..." (recording)
     - ⏳ "Transcrevendo..." (STT running)
     - 🤔 "Processando..." (LLM thinking)
     - 🔊 "Falando..." (TTS playing)
   - After audio is played, automatically start listening again (loop mode for conversation)

5. **Frontend — Recording with VAD** (timer-based):
   ```typescript
   async function startVoiceRecording() {
     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
     mediaRecorder = new MediaRecorder(stream);
     const chunks: Blob[] = [];
     mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
     mediaRecorder.onstop = async () => {
       const blob = new Blob(chunks, { type: 'audio/wav' });
       const reader = new FileReader();
       reader.onloadend = () => {
         const base64 = (reader.result as string).split(',')[1];
         sendVoiceToBackend(base64);
       };
       reader.readAsDataURL(blob);
       stream.getTracks().forEach(t => t.stop());
     };
     mediaRecorder.start();
     setVoiceStatus('recording');

     // Simple VAD: AnalyserNode for volume detection
     const audioCtx = new AudioContext();
     const source = audioCtx.createMediaStreamSource(stream);
     const analyser = audioCtx.createAnalyser();
     source.connect(analyser);
     const bufferLength = analyser.frequencyBinCount;
     const dataArray = new Uint8Array(bufferLength);
     let silenceStart = Date.now();
     const vadInterval = setInterval(() => {
       analyser.getByteFrequencyData(dataArray);
       const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
       if (avg < 10) { // silence threshold
         if (Date.now() - silenceStart > 1500) { // 1.5s silence → stop
           clearInterval(vadInterval);
           mediaRecorder.stop();
         }
       } else {
         silenceStart = Date.now();
       }
     }, 200);
   }
   ```

6. **Frontend — Status display**: Add a status bar above input showing current voice state with animations.

### VAD (Voice Activity Detection) — Timer-based vs webrtcvad

| Abordagem | Prós | Contras |
|---|---|---|
| Timer-based (AnalyserNode) | 0 dependências, roda no browser | Menos preciso em ruído |
| `webrtcvad` (via Python) | Preciso, usado no Chrome | Dependência extra, processamento no backend |
| `silero-vad` (PyTorch) | Muito preciso | 300MB de dependências, GPU opcional |

**Recomendação**: Timer-based com AnalyserNode (sem dep. extra, suficiente para ambiente silencioso). Se precisar de precisão em ambientes ruidosos, migrar para `webrtcvad` no backend (recebe o áudio e detecta silêncio antes de transcrever).

### Dependências

| Pacote | Tam. | Por quê |
|---|---|---|
| `faster-whisper` (já em 003_STT) | ~300MB | Transcrição |
| `piper-tts` (já em 003_TTS) | ~5MB | Síntese de voz |
| `onnxruntime` (já em 003_TTS) | ~30MB | Runtime ONNX |

Nenhuma nova dependência — este card depende de 003_WhisperSTT e 003_PiperTTS já implementados.

### Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Latência total > 5s | Meta: STT 1s + LLM 2s + TTS 0.5s = 3.5s. Usar modelo tiny, LLM pequeno (phi4, gemma3:1b), TTS cacheado |
| VAD timer-based falso-positivo (corta fala no meio) | Threshold ajustável, usar média móvel do volume |
| Microfone não disponível / permissão negada | Fallback: mostrar input de texto. Tratar `NotAllowedError` |
| Múltiplos áudios simultâneos | Fila de processamento: +1 áudio é enfileirado, não paralelo |
| TTS bloqueia UI (áudio grande) | Reprodução async, não bloquear polling do stream |

### Latência Estimada

| Etapa | tiny | base |
|---|---|---|
| STT (5s áudio) | 0.8s | 1.5s |
| LLM (phi4:14b) | 1.5s | 1.5s |
| TTS (30 chars) | 0.3s | 0.3s |
| **Total** | **~2.6s** | **~3.3s** |

Dentro do limite de 5s com modelo tiny.

## Use Cases

1. **Conversa mãos-livres**: Usuário ativa modo voz, pergunta "Qual o tempo hoje?" — grava, solta, VAD detecta silêncio, STT transcreve, LLM responde, TTS lê em voz alta. Loop continua para próxima pergunta.
2. **Comando rápido com push-to-talk**: Usuário segura botão, diz "Criar arquivo test.ts", solta. Áudio transcrito → comando executado → resposta em áudio.
3. **Dictaçāo com confirmação visual**: Usuário dita mensagem longa. Texto transcrito aparece no chat. Usuário vê o que foi entendido antes da resposta ser gerada. Pode editar antes de enviar.

## Test Cases

1. [ ] Pipeline completo: gravar 3s "Olá JARVIS" → transcrição correta → LLM responde → TTS gera áudio → reproduz sem erro. Latência total < 5s
2. [ ] VAD timer-based: gravar 1s de fala + 2s de silêncio → gravação para automaticamente após 1.5s de silêncio
3. [ ] Push-to-talk: segurar botão por 2s, soltar → áudio processado (sem VAD). Soltar sem falar → erro "Nenhum áudio detectado"
4. [ ] Indicadores visuais: status muda de idle → recording → transcribing → thinking → speaking → idle. Cada transição visível
5. [ ] Cancelamento: durante "thinking", usuário clica cancelar → pipeline interrompe, TTS não é gerado

## Critérios de Aceitação
- [x] Botão de gravar no AiPanel (microfone)
- [x] Gravação de áudio do microfone
- [x] Detecção de silêncio (VAD) para parar gravação
- [x] Pipeline completa: STT → LLM → TTS → reprodução
- [x] Indicador visual de "ouvindo..." / "processando..." / "falando..."
- [x] Latência total < 5s (modelo tiny, esperado ~2-3s) (depende do hardware, modelo tiny ~2-3s esperado)

## Fase
Fase 2 — Áudio

## Prioridade
Média

## Esforço Estimado
Grande

