# Recomendacoes de IA e Modelos — JARVIS

## 1. Estrategia de Modelos

### Gratuito em Primeiro Lugar
O JARVIS deve priorizar modelos **gratuitos e locais**. API keys sao opcionais para quem quer mais poder.

```
Modelos Gratuitos/Locais (padrao)
    ├── Codigo:      Qwen 2.5 Coder (Ollama local) - ~4.5GB RAM
    ├── Texto geral: Llama 3.2 (Ollama local) - ~2GB RAM
    ├── Embeddings:  nomic-embed-text (Ollama local) - ~274MB RAM
    ├── Imagem:      Llama 3.2 Vision (Ollama local) - ~7GB RAM
    └── STT:         whisper (local via sidecar Python)

Modelos Gratuitos via API (upgrade, se disponivel)
    ├── Gemini 1.5 Flash (Google, 60rpm gratis)
    ├── GPT-4o Mini (OpenAI, 3rpm gratis)
    └── DeepSeek V2 (DeepSeek, 50rpm gratis)
```

---

## 2. Sistema de Roteamento de Modelos

Cada tarefa deve usar o modelo mais adequado automaticamente:

```typescript
interface ModelRouter {
  selectModel(task: TaskType, context: TaskContext): ModelSelection;
}

const taskModelMap: Record<TaskType, ModelCriteria> = {
  // Edicao de codigo: melhor modelo de codigo
  'code-generation': {
    preferred: ['qwen2.5-coder', 'deepseek-coder'],
    fallback: ['llama3.2', 'gpt-4o-mini'],
  },
  
  // Explicacao de codigo: modelo balanceado
  'code-explanation': {
    preferred: ['llama3.2', 'gpt-4o-mini'],
    fallback: ['qwen2.5-coder'],
  },
  
  // Conversa geral: modelo leve e rapido
  'general-chat': {
    preferred: ['llama3.2', 'gemini-1.5-flash'],
    fallback: ['phi3', 'mistral'],
  },
  
  // Automacao web/tarefas: precisa seguir instrucoes
  'task-automation': {
    preferred: ['qwen2.5-coder', 'gpt-4o-mini'],
    fallback: ['llama3.2'],
  },
  
  // Analise de documentos: contexto longo
  'document-analysis': {
    preferred: ['gemini-1.5-flash', 'gpt-4o-mini'],
    fallback: ['llama3.2'],
  },
  
  // Busca semantica: embeddings locais
  'semantic-search': {
    preferred: ['nomic-embed-text'],
    fallback: [],
  },
  
  // Visao/imagem: modelo multimodal
  'image-analysis': {
    preferred: ['llama3.2-vision', 'gpt-4o-mini'],
    fallback: [],
  },
  
  // Voz: processamento local
  'speech-to-text': {
    preferred: ['whisper-local'],
    fallback: [],
  },
};
```

---

## 3. Orquestracao de Agentes com LangGraph

### Arquitetura do Agente

```python
# sidecar/core/agent_engine.py
from langgraph.graph import StateGraph, END
from typing import TypedDict, Literal

class AgentState(TypedDict):
    messages: list
    next_action: str
    tools_used: list
    permissions_requested: list
    context_files: list

# No atual
def should_continue(state: AgentState) -> Literal["tools", "__end__"]:
    if state["next_action"] == "use_tool":
        return "tools"
    return "__end__"

# Grafo do agente
graph = StateGraph(AgentState)
graph.add_node("agent", call_model)
graph.add_node("tools", execute_tool)
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", should_continue)
graph.add_edge("tools", "agent")

app = graph.compile()
```

### Ferramentas do Agente

```python
# sidecar/core/tools/browser_tools.py
@tool
async def navigate_to(url: str) -> str:
    """Navega para uma URL no navegador."""
    check_permission("browser-control")
    page = await browser.new_page()
    await page.goto(url)
    return f"Navegou para {url}"

@tool
async def fill_form_field(selector: str, value: str) -> str:
    """Preenche um campo de formulario."""
    check_permission("browser-control")
    await page.fill(selector, value)
    return f"Preencheu {selector}"

@tool
async def click_element(selector: str) -> str:
    """Clica em um elemento na pagina."""
    check_permission("browser-control")
    await page.click(selector)
    return f"Clicou em {selector}"

@tool
async def execute_code(code: str, language: str) -> str:
    """Executa codigo em Python ou shell."""
    check_permission("system-command")
    result = subprocess.run(code, shell=True, capture_output=True, text=True, timeout=30)
    return result.stdout

@tool
async def read_file(path: str) -> str:
    """Le conteudo de um arquivo."""
    check_permission("read-workspace")
    return Path(path).read_text()

@tool
async def write_file(path: str, content: str) -> str:
    """Escreve conteudo em um arquivo."""
    check_permission("write-workspace")
    Path(path).write_text(content)
    return f"Arquivo {path} escrito com sucesso"

@tool
async def search_web(query: str) -> str:
    """Pesquisa na web."""
    check_permission("network")
    # Implementar busca via duckduckgo ou similar
    return search_results

@tool
async def take_screenshot() -> str:
    """Captura a tela atual."""
    check_permission("screen-capture")
    screenshot = pyautogui.screenshot()
    path = f"/tmp/screenshot_{int(time.time())}.png"
    screenshot.save(path)
    return path
```

---

## 4. Chat em Tempo Real com Streaming

### Frontend (SSE/WebSocket)

```typescript
// infrastructure/chat-stream.ts
class ChatStreamClient {
  private ws: WebSocket;
  private abortController: AbortController;

  connect(workspaceId: string) {
    this.ws = new WebSocket(`ws://localhost:8653/ws/chat?workspace=${workspaceId}`);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'token':       this.onToken(data.text); break;
        case 'tool-call':   this.onToolCall(data.tool); break;
        case 'tool-result': this.onToolResult(data.result); break;
        case 'done':        this.onDone(data.final); break;
        case 'error':       this.onError(data.error); break;
        case 'permission':  this.requestPermission(data.permission); break;
      }
    };
  }

  sendMessage(text: string, context: ContextFile[]) {
    this.ws.send(JSON.stringify({
      type: 'message',
      text,
      context,
      model: activeModel,
    }));
  }

  cancel() {
    this.ws.send(JSON.stringify({ type: 'cancel' }));
  }

  respondPermission(id: string, granted: boolean) {
    this.ws.send(JSON.stringify({ type: 'permission-response', id, granted }));
  }
}
```

### Backend Python (WebSocket)

```python
# sidecar/api/chat.py
@router.websocket("/ws/chat")
async def chat_websocket(websocket: WebSocket):
    await websocket.accept()
    
    while True:
        data = await websocket.receive_json()
        
        if data["type"] == "message":
            # Iniciar geracao com LangGraph
            async for event in agent.astream_events({
                "messages": [{"role": "user", "content": data["text"]}],
                "context_files": data.get("context", []),
            }, version="v2"):
                
                if event["event"] == "on_chat_model_stream":
                    # Token de texto
                    await websocket.send_json({
                        "type": "token",
                        "text": event["data"]["chunk"].content,
                    })
                
                elif event["event"] == "on_tool_start":
                    # Agente vai usar ferramenta
                    await websocket.send_json({
                        "type": "tool-call",
                        "tool": event["data"]["name"],
                        "args": event["data"]["input"],
                    })
                
                elif event["event"] == "on_tool_end":
                    await websocket.send_json({
                        "type": "tool-result",
                        "tool": event["data"]["name"],
                        "result": event["data"]["output"][:500],
                    })
            
            # Finalizou
            await websocket.send_json({"type": "done"})
        
        elif data["type"] == "cancel":
            # Cancelar geracao
            break
        
        elif data["type"] == "permission-response":
            # Usuario respondeu a uma solicitacao de permissao
            permission_responses[data["id"]] = data["granted"]
```

---

## 5. Voz: STT e TTS

### Entrada de Voz (Speech-to-Text)

```python
# sidecar/api/voice.py
import whisper

model = whisper.load_model("base")  # ~1GB RAM, bom equilibrio

@router.post("/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    # Salvar audio temporario
    audio_bytes = await audio.read()
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(audio_bytes)
        temp_path = f.name
    
    # Transcrever
    result = model.transcribe(temp_path, language="pt")
    
    # Limpar
    os.unlink(temp_path)
    
    return {"text": result["text"], "segments": result["segments"]}
```

### Saida de Voz (Text-to-Speech)

```python
# edge-tts (gratuito, vozes naturais, suporta PT-BR)
import edge_tts

@router.post("/tts")
async def text_to_speech(text: str, voice: str = "pt-BR-AntonioNeural"):
    communicate = edge_tts.Communicate(text, voice)
    audio_stream = BytesIO()
    
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_stream.write(chunk["data"])
    
    audio_stream.seek(0)
    return StreamingResponse(audio_stream, media_type="audio/mp3")
```

### Vozes Disponiveis (edge-tts, gratis)

| Idioma | Voz | Genero |
|--------|-----|--------|
| PT-BR | Antônio | Masculino |
| PT-BR | Francisca | Feminino |
| EN-US | Jenny | Feminino |
| EN-US | Guy | Masculino |
| EN-GB | Sonia | Feminino |
| ES-ES | Alvaro | Masculino |

---

## 6. Modelos Financeiros / Especializados (Futuro)

Conforme o JARVIS evolua para automacao financeira, considere:

| Tarefa | Modelo Recomendado | Tipo |
|--------|-------------------|------|
| Analise de acoes | Llama 3.2 + dados Yahoo Finance | Local + API |
| Deteccao de fraudes | Modelo treinado especifico | Especializado |
| Sentimento de mercado | Fine-tune de LLM local | Local |
| Extracao de dados financeiros | Qwen 2.5 Coder | Local |

---

## 7. Tabela de Custo (Modelos Gratuitos vs Pagos)

| Modelo | Custo | Qualidade | Velocidade | Privacidade |
|--------|-------|-----------|-----------|-------------|
| Qwen 2.5 Coder (local) | **Gratis** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ Total |
| Llama 3.2 (local) | **Gratis** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Total |
| nomic-embed-text (local) | **Gratis** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Total |
| whisper (local) | **Gratis** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ Total |
| Gemini 1.5 Flash | **Gratis** (60rpm) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⚠️ Google |
| GPT-4o Mini | **Gratis** (3rpm) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⚠️ OpenAI |
| DeepSeek V2 | **Gratis** (50rpm) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⚠️ China |

> **Nota:** Modelos locais sao sempre preferiveis por privacidade. Use APIs externas apenas quando precisar de mais qualidade/velocidade.
