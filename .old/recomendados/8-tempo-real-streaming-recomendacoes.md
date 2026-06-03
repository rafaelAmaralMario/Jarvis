# Recomendacoes de Tempo Real (Streaming) — JARVIS

## 1. Arquitetura de Comunicacao em Tempo Real

```
┌─────────────────────────────────────────────────────────────────────┐
│                       FRONTEND (React 19)                            │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    WebSocket Client                            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │  │
│  │  │ Chat     │ │ Voice    │ │ Terminal  │ │ Automation       │ │  │
│  │  │ Stream   │ │ STT/TTS  │ │ Output    │ │ Status Updates   │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│              ┌───────────────┼───────────────┐                      │
│              ▼               ▼               ▼                      │
│         ┌─────────┐   ┌──────────┐   ┌──────────────┐               │
│         │ Zustand │   │ React    │   │ Toast/       │               │
│         │ Store   │   │ State    │   │ Notification │               │
│         └─────────┘   └──────────┘   └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. WebSocket vs SSE vs Fetch

| Protocolo | Uso | Vantagens | Desvantagens |
|-----------|-----|-----------|-------------|
| **WebSocket** | Chat, voz, automacao | Bidirecional, baixa latencia | Mais complexo |
| **SSE** (Server-Sent Events) | Streaming de tokens unidirecional | Simples, nativo HTTP | So servidor->cliente |
| **Fetch + ReadableStream** | Streaming de resposta LLM | Ja implementado | So resposta |

### Recomendacao: WebSocket para Tudo

Usar WebSocket como protocolo unico para todas as comunicacoes em tempo real:

```typescript
// infrastructure/realtime/websocket-client.ts
class RealtimeClient {
  private ws: WebSocket;
  private reconnectAttempts = 0;
  private handlers = new Map<string, (data: any) => void>();

  connect() {
    this.ws = new WebSocket('ws://127.0.0.1:8653/ws');
    
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const handler = this.handlers.get(msg.channel);
      if (handler) handler(msg.payload);
    };

    this.ws.onclose = () => {
      if (this.reconnectAttempts < 5) {
        setTimeout(() => this.connect(), 1000 * Math.pow(2, this.reconnectAttempts++));
      }
    };
  }

  on(channel: string, handler: (data: any) => void) {
    this.handlers.set(channel, handler);
  }

  send(channel: string, payload: any) {
    this.ws.send(JSON.stringify({ channel, payload }));
  }
}

// Canais disponiveis
type Channel =
  | 'chat:token'           // Token de texto do chat
  | 'chat:tool-call'       // Agente vai usar ferramenta
  | 'chat:tool-result'     // Resultado da ferramenta
  | 'chat:done'            // Resposta completa
  | 'chat:error'           // Erro na geracao
  | 'chat:permission'      // Solicitacao de permissao
  | 'voice:transcription'  // Texto transcrito do audio
  | 'voice:status'         // Status do STT (listening/processing/done)
  | 'terminal:output'      // Saida do terminal
  | 'terminal:exit'        // Processo terminou
  | 'automation:step'      // Passo de automacao executado
  | 'automation:status'    // Status da automacao
  | 'system:notification'  // Notificacao do sistema
;
```

## 3. Chat com Streaming (WebSocket)

### Cliente Frontend

```typescript
// infrastructure/realtime/chat-stream.ts
export class ChatStream {
  private client: RealtimeClient;
  
  async sendMessage(text: string, context: ContextFile[]) {
    // Criar promise que resolve quando a resposta completa chegar
    return new Promise<ChatResult>((resolve, reject) => {
      let fullResponse = '';
      let toolCalls: ToolCall[] = [];
      
      this.client.on('chat:token', (token: string) => {
        fullResponse += token;
        this.onToken(token);  // Callback para UI
      });
      
      this.client.on('chat:tool-call', (call: ToolCall) => {
        toolCalls.push(call);
        this.onToolCall(call);
      });
      
      this.client.on('chat:done', () => {
        resolve({ text: fullResponse, toolCalls });
      });
      
      this.client.on('chat:error', (error: string) => {
        reject(new Error(error));
      });
      
      this.client.send('chat:message', { text, context });
    });
  }

  cancel() {
    this.client.send('chat:cancel', {});
  }
}
```

### Backend Python

```python
# sidecar/core/chat_stream.py
from fastapi import WebSocket
from langgraph.graph import Graph
import asyncio

class ChatStreamHandler:
    def __init__(self, websocket: WebSocket):
        self.ws = websocket
        self.agent = create_agent()
    
    async def handle_message(self, data: dict):
        text = data["text"]
        context = data.get("context", [])
        
        config = {
            "configurable": {
                "thread_id": str(uuid.uuid4()),
                "model": data.get("model", "qwen2.5-coder"),
            }
        }
        
        # Usar astream_events do LangGraph para streaming completo
        async for event in self.agent.astream_events(
            {"messages": [HumanMessage(content=text)], "context": context},
            config=config,
            version="v2",
        ):
            if event["event"] == "on_chat_model_stream":
                token = event["data"]["chunk"].content
                await self.ws.send_json({
                    "channel": "chat:token",
                    "payload": token,
                })
            
            elif event["event"] == "on_tool_start":
                await self.ws.send_json({
                    "channel": "chat:tool-call",
                    "payload": {
                        "tool": event["data"]["name"],
                        "args": event["data"]["input"],
                        "id": event["data"]["id"],
                    },
                })
            
            elif event["event"] == "on_tool_end":
                await self.ws.send_json({
                    "channel": "chat:tool-result",
                    "payload": {
                        "tool": event["data"]["name"],
                        "result": str(event["data"]["output"])[:500],
                    },
                })
        
        await self.ws.send_json({"channel": "chat:done", "payload": {}})
    
    async def handle_cancel(self):
        # Cancelar geracao atual
        self.agent.interrupt()
```

## 4. Terminal em Tempo Real

### Fluxo

```
[Usuario digita comando no terminal]
    → xterm.js captura onData
    → Frontend: invoke('terminal_write', { data: "npm run test\n" })
    → Rust: portable-pty escreve no PTY
    → Rust: processo executa comando
    → Rust: stdout/stderr sai do PTY
    → Rust: emite evento Tauri "terminal-output"
    → Frontend: escuta evento e chama term.write()
    → xterm.js exibe saida em tempo real
```

### Backend Rust

```rust
// src-tauri/src/terminal/mod.rs
use portable_pty::{CommandBuilder, NativePtySystem, PtySize};
use tauri::{AppHandle, Emitter};

pub fn spawn_terminal(app: &AppHandle, workspace_path: &str) -> Result<String, String> {
    let pty_system = NativePtySystem::default();
    let pair = pty_system.openpty(PtySize { rows: 24, cols: 80, ..Default::default() })
        .map_err(|e| e.to_string())?;

    let shell = if cfg!(target_os = "windows") { "powershell.exe" } else { "bash" };
    let cmd = CommandBuilder::new(shell).cwd(workspace_path);
    let _child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;

    let reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

    let session_id = uuid::Uuid::new_v4().to_string();
    
    // Thread de leitura - emite eventos Tauri
    let app_handle = app.clone();
    let sid = session_id.clone();
    std::thread::spawn(move || {
        let mut buf = [0u8; 4096];
        let mut reader = reader;
        loop {
            match reader.read(&mut buf) {
                Ok(0) | Err(_) => break,
                Ok(n) => {
                    let _ = app_handle.emit("terminal-output", TerminalOutput {
                        session_id: sid.clone(),
                        data: buf[..n].to_vec(),
                    });
                }
            }
        }
        let _ = app_handle.emit("terminal-exit", TerminalExit { session_id: sid });
    });

    // Armazenar writer para escrita futura
    TERMINAL_SESSIONS.lock().unwrap().insert(session_id.clone(), writer);
    
    Ok(session_id)
}
```

## 5. Voz em Tempo Real (Duplex)

### Arquitetura

```
[Microfone] → [Audio chunks] → [Python Whisper] → [Texto]
                                                       ↓
[Alto-falante] ← [Audio MP3] ← [Python edge-tts] ← [Resposta IA]
```

### Implementacao

```python
# sidecar/core/voice_duplex.py
import asyncio
import whisper
import edge_tts
from fastapi import WebSocket

class VoiceDuplexHandler:
    def __init__(self):
        self.stt_model = whisper.load_model("base")
        self.vad = VoiceActivityDetector()
        self.audio_buffer = bytearray()
    
    async def handle_duplex(self, websocket: WebSocket):
        await websocket.accept()
        
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "audio-chunk":
                # Adicionar ao buffer
                self.audio_buffer.extend(data["payload"])
                
                # Detectar fim de fala (VAD)
                vad_result = self.vad.process_frame(data["payload"])
                
                if vad_result == "end":
                    # Transcrever buffer completo
                    text = self.transcribe(self.audio_buffer)
                    self.audio_buffer.clear()
                    
                    await websocket.send_json({
                        "type": "transcription",
                        "text": text,
                    })
                    
                    # Processar com agente (em background)
                    asyncio.create_task(self.process_and_respond(text, websocket))
            
            elif data["type"] == "cancel":
                break
    
    def transcribe(self, audio: bytearray) -> str:
        # Salvar temporario e transcrever
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(audio)
            path = f.name
        
        result = self.stt_model.transcribe(path, language="pt")
        os.unlink(path)
        return result["text"]
    
    async def process_and_respond(self, text: str, websocket: WebSocket):
        # Processar com agente
        response = await agent.ainvoke({"messages": [HumanMessage(content=text)]})
        
        # Converter para voz
        tts = edge_tts.Communicate(response["messages"][-1].content, "pt-BR-AntonioNeural")
        
        # Stream de audio de volta
        async for chunk in tts.stream():
            if chunk["type"] == "audio":
                await websocket.send_json({
                    "type": "audio-chunk",
                    "payload": list(chunk["data"]),
                })
        
        await websocket.send_json({"type": "audio-done"})
```

## 6. Performance e Latencia

### Metas de Performance

| Operacao | Meta | Atual |
|----------|------|-------|
| Primeiro token do chat | < 500ms | ~2-3s (com modelos locais) |
| Streaming de tokens | < 50ms entre tokens | ~90ms (mock) |
| STT (whisper) | < 2s para 10s de audio | ~3s (base model) |
| TTS (edge-tts) | < 1s para 100 caracteres | ~500ms |
| Terminal output | Tempo real (sub-100ms) | N/A (placeholder) |
| Automacao web | < 5s por acao simples | N/A |
| Reconexao WebSocket | < 2s | N/A |

### Otimizacoes

1. **Cache de modelo**: manter whisper carregado em memoria
2. **Streaming de audio**: enviar chunks enquanto transcreve (nao esperar audio completo)
3. **Prefetch de TTS**: comecar TTS antes da frase completa
4. **WebSocket Keepalive**: ping/pong a cada 30s
5. **Reconexao automatica**: exponential backoff, max 5 tentativas
6. **Buffer de terminal**: 4096 bytes, enviar a cada 100ms ou quando buffer encher
