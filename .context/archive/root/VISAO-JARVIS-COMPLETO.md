# JARVIS — Visão Completa: Assistente Pessoal Local

> Baseado na arquitetura atual + análise de migração llama-cpp.md
> Data: 10/06/2026

---

## 1. Filosofia

**Tudo local, gratuito, sem assinatura, sem cloud.**

O JARVIS deve evoluir de um editor de código com IA para um assistente pessoal completo — como o JARVIS do Homem de Ferro — capaz de:
- Conversar por texto e **voz**
- **Ver** (câmera, imagens, vídeos)
- **Ouvir** (áudio, música, comandos de voz)
- **Criar** (imagens, vídeos, música, documentos)
- **Agir** (email, WhatsApp, Instagram, GitHub, APIs)
- **Aprender** (memória persistente, RAG, embeddings)
- **Melhorar a si mesmo** (self-improvement)

Tudo rodando 100% local, sem depender de serviços externos.

---

## 2. Arquitetura Proposta: Híbrida / Modular

### 2.1 Princípio: Provedor Duplo para LLM

Não substituir o Ollama — **adicionar llama-cpp-python como alternativa**.

```
LLMGateway (abstração)
  ├── OllamaProvider   → ollama serve (HTTP)
  └── NativeProvider   → llama-cpp-python (in-process)
```

O usuário **escolhe por modelo ou por tarefa**:
- `ollama pull llama3.2` → usa via Ollama (simples, gerenciado)
- `model.gguf` local → usa via NativeProvider (rápido, controle total)
- Ou configura: "para tool calling use Native, para chat use Ollama"

Isso **mantém ambos** — zero perda, ganho de flexibilidade.

### 2.2 Arquitetura de Micro-Serviços (Futuro)

Para escalar sem travar o editor, cada capacidade pesada vira um **serviço independente**:

```
┌──────────────────────────────────────────────────────┐
│                   JARVIS Core                         │
│  (Orquestrador + Bridge + Plugins + RAG + Memória)    │
├──────────────────────────────────────────────────────┤
│                    Serviços (workers)                  │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  LLM     │  │  Vision  │  │  Audio (Whisper)  │   │
│  │  (LLM    │  │  (SD,    │  │  + TTS (Piper/    │   │
│  │  Gateway)│  │  Flux)   │  │  Coqui/Bark)      │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  Video   │  │  Music   │  │  Integration Hub  │   │
│  │  (SVD/   │  │  (Music- │  │  (Email/WhatsApp/ │   │
│  │  Animate-│  │  Gen/    │  │  Instagram/GitHub)│   │
│  │  Diff)   │  │  Bark)   │  │                   │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
│                                                       │
│  Cada serviço: processo separado, comunicação via IPC │
│  (ZeroMQ, gRPC, ou REST local)                        │
│  Ativa/desativa individualmente                       │
│  GPU compartilhada ou dedicada por serviço            │
└──────────────────────────────────────────────────────┘
```

---

## 3. Catálogo de Capacidades

### 3.1 🤖 Core (Já implementado)

| Capacidade | Status | Tecnologia |
|---|---|---|
| Chat com LLM | ✅ | Ollama / Native |
| Tool calling (ferramentas) | ✅ | ToolAgent + ToolManager |
| Task Planner (decomposição) | ✅ | TaskPlanner |
| Self-Improvement | ✅ | SelfImprovement |
| Knowledge Base (notas) | ✅ | KnowledgeManager |
| Editor de código | ✅ | Monaco Editor |
| Git integration | ✅ | git CLI |
| Terminal embutido | ✅ | xterm.js |
| Web search | ✅ | DuckDuckGo |
| Download de arquivos | ✅ | Tool `download_file` |
| Instalação de pacotes | ✅ | Tool `install_package` |

### 3.2 🧠 LLM Providers (Ambos)

| Provedor | Prós | Contras | Quando usar |
|---|---|---|---|
| **Ollama** | Gerenciamento fácil (`pull`/`list`/`delete`), concorrência built-in, API REST para debug, GPU automática | Overhead ~200-300MB, +latência HTTP | Testar modelos novos, produção servida, debug |
| **Native (llama-cpp-python)** | +10-22% performance, grammar-constrained JSON (tool calling perfeito), embeddings in-process, controle GPU/memória total | Sem gerenciamento de modelos, sem concorrência built-in | Uso diário, tool calling, embeddings, máximo desempenho |

**Decisão**: Manter ambos. LLMGateway roteia dinamicamente.

### 3.3 🗣️ Voz & Áudio

| Funcionalidade | Tecnologia | Local? | Viabilidade |
|---|---|---|---|
| **Speech-to-Text** (voz → texto) | Whisper (openai-whisper / faster-whisper) | ✅ Sim | **Excelente**. Modelos tiny→large, ~1-5x real-time. tiny cabe em CPU. |
| **Text-to-Speech** (texto → voz) | Piper TTS | ✅ Sim | **Excelente**. Levíssimo (CPU), centenas de vozes, ~0.1s por frase. |
| **Text-to-Speech avançado** | Coqui XTTS v2 | ✅ Sim | **Bom**. Voz natural, controle de emoção, requer GPU para tempo real. |
| **Clonagem de Voz** | Coqui XTTS v2 (fine-tune) / OpenVoice | ✅ Sim | **Bom**. 3-10s de áudio para clonar. Qualidade decente, não perfeita. |
| **Música (texto → áudio)** | MusicGen (Meta) / AudioCraft | ✅ Sim | **Limitado**. Gera ~5-30s de música, qualidade okay. Não faz música com letra coerente. |
| **Música (com letra)** | Bark (Suno) | ✅ Sim | **Limitado**. Gera áudio + música, mas qualidade mediana. Não substitui produção musical. |
| **Efeitos sonoros** | AudioCraft (AudioGen) | ✅ Sim | **Bom**. Gera efeitos sonoros (passos, chuva, motor, etc.). |

**Resumo Áudio**: STT e TTS são **maduros e usáveis** hoje. Música gerada localmente **ainda é limitada** — serve para protótipos, não para produção musical.

### 3.4 👁️ Visão & Imagem

| Funcionalidade | Tecnologia | Local? | Viabilidade |
|---|---|---|---|
| **Análise de imagem** | LLM Vision (LLaVA, Qwen-VL, Gemma 3) | ✅ Sim | **Excelente**. Descreve imagens, responde perguntas, extrai texto. |
| **Câmera ao vivo** | OpenCV → frames → LLM Vision | ✅ Sim | **Bom**. Captura frames periódicos, analisa. Não é tempo real video, mas frames. |
| **Geração de imagem** | Stable Diffusion (A1111 / ComfyUI API) | ✅ Sim | **Excelente**. SDXL, Flux, SD3. Qualidade comparável a serviços cloud. |
| **Geração de imagem (rápida)** | Flux schnell / SDXL Turbo | ✅ Sim | **Excelente**. 1-4 passos, segundos. |
| **Edição de imagem** | Stable Diffusion + ControlNet / Inpaint | ✅ Sim | **Bom**. Inpainting, outpainting, pose controlada. |
| **Vídeo curto (2-5s)** | Stable Video Diffusion / AnimateDiff | ✅ Sim | **Limitado**. Qualidade razoável, movimentos simples, 2-5 segundos. |
| **Vídeo longo (>30s)** | ModelScope Text2Video | ⚠️ Parcial | **Ruim**. Muito limitado, baixa resolução, artefatos. |
| **Vídeo animado longo** | — | ❌ Não | **Inviável localmente**. Sora, Runway Gen-3, Pika são cloud-only. |
| **OCR (texto em imagem)** | Tesseract / docling | ✅ Sim | **Excelente**. Extrai texto de imagens, PDFs escaneados. |

**Resumo Visão**: Geração de imagem é **excelente localmente**. Vídeo **longo** ainda é inviável — modelos locais produzem apenas clips de 2-5s com qualidade limitada.

### 3.5 📄 Documentos

| Funcionalidade | Tecnologia | Local? | Viabilidade |
|---|---|---|---|
| **PDF** (leitura) | pdfplumber / PyMuPDF / docling | ✅ Sim | **Excelente** |
| **DOCX** (Word) | python-docx | ✅ Sim | **Excelente** |
| **XLSX** (Excel) | openpyxl | ✅ Sim | **Excelente** |
| **Criação de documentos** | python-docx / ReportLab / openpyxl | ✅ Sim | **Excelente**. Cria relatórios, planilhas, PDFs formatados. |
| **OCR** | Tesseract / EasyOCR / Surya | ✅ Sim | **Excelente** |

### 3.6 🔌 Integrações

| Serviço | Tecnologia | Local? | Viabilidade |
|---|---|---|---|
| **Email (IMAP/SMTP)** | imaplib + smtplib (stdlib) | ✅ Sim | **Excelente**. Ler, enviar, responder emails. Sem depender de API. |
| **WhatsApp** | whatsapp-web.js (browser autom.) | ✅ Sim | **Bom**. Enviar/ler mensagens via browser. Precisa de QR code inicial. Pode quebrar com atualizações. |
| **Instagram** | API oficial (Instagram Basic Display) | ❌ Limitado | **Limitado**. API oficial requer app aprovado. Unofficial scraping pode levar a ban. |
| **GitHub** | GitHub CLI (`gh`) + REST API | ✅ Sim | **Excelente**. Issues, PRs, commits, releases. API gratuita para público. |
| **GitLab / Bitbucket** | API REST | ✅ Sim | **Excelente**. |
| **Discord** | discord.py (self-bot) | ✅ Sim | **Bom**. Bot local, requer token. |
| **Telegram** | python-telegram-bot | ✅ Sim | **Excelente**. Bot local, API aberta. |
| **Twitter/X** | API v2 (gratuita limitada) | ⚠️ Parcial | **Limitado**. API gratuita muito restritiva (1500 tweets/mês). |
| **Calendário (CalDAV)** | caldav lib | ✅ Sim | **Bom**. iCloud, Google (via app password), Nextcloud. |
| **Contatos (CardDAV)** | carddav lib | ✅ Sim | **Bom**. Mesmo ecossistema CalDAV. |
| **Notion** | Notion API (oficial) | ✅ Sim | **Bom**. API gratuita, bem documentada. |
| **Google Drive / OneDrive** | API REST | ✅ Sim | **Bom**. APIs gratuitas com limites razoáveis. |
| **Smart Home (IoT)** | MQTT + Home Assistant API | ✅ Sim | **Excelente**. Controle total de dispositivos locais. |

### 3.7 🧠 Memória & RAG

| Funcionalidade | Tecnologia | Local? | Viabilidade |
|---|---|---|---|
| **Memória de curto prazo** | Context window (já temos) | ✅ Sim | **Já implementado**. Histórico da conversa. |
| **Memória de longo prazo** | Vector store (ChromaDB / SQLite + embeddings) | ✅ Sim | **Bom**. Embeddings gerados localmente, busca semântica. |
| **RAG (Retrieval-Augmented Gen.)** | ChromaDB + LLM | ✅ Sim | **Excelente**. Documentos → chunks → embeddings → busca → contexto. |
| **Memória procedural** | SQLite (já temos) | ✅ Sim | **Já implementado**. Configurações, agentes, preferências. |
| **Graph memory** | Knowledge Graph (NetworkX + LLM) | ✅ Sim | **Bom**. Extrair entidades e relações do histórico. |

---

## 4. Ferramentas (ToolManager) — Expansão Completa

### Existentes
```
read_file, write_file, create_file, delete_file, list_directory
execute_command, grep_search, glob_files
git_status, git_diff, git_commit
ask_user, web_search, web_fetch
download_file, install_package
create_note, list_notes, search_notes
```

### A Adicionar (cada uma = plugin)

| Nova Ferramenta | Descrição | Dependência |
|---|---|---|
| `transcribe_audio` | Áudio → texto (Whisper) | openai-whisper |
| `synthesize_speech` | Texto → áudio (Piper/Coqui) | piper-tts / TTS |
| `clone_voice` | Clonar voz de amostra | Coqui XTTS |
| `generate_music` | Texto → música (MusicGen) | audiocraft |
| `generate_image` | Texto → imagem (Stable Diffusion) | diffusers + torch |
| `edit_image` | Editar imagem (inpaint/outpaint) | diffusers |
| `analyze_image` | Descrever imagem (LLM Vision) | LLM Vision |
| `capture_camera` | Capturar frame da câmera | OpenCV |
| `extract_text` | Extrair texto de PDF/DOCX/XLSX | docling / python-docx / openpyxl |
| `create_document` | Criar DOCX/PDF/XLSX formatado | python-docx + ReportLab |
| `send_email` | Enviar email (SMTP) | stdlib |
| `read_email` | Ler emails (IMAP) | stdlib |
| `send_whatsapp` | Enviar mensagem WhatsApp | whatsapp-web.js |
| `github_create_issue` | Criar issue no GitHub | gh CLI |
| `github_create_pr` | Criar PR no GitHub | gh CLI |
| `search_web` | ✅ já existe | — |
| `download_media` | ✅ já existe | — |
| `schedule_task` | Agendar tarefa no calendário | caldav lib |

---

## 5. Roadmap de Implementação

### Fase 0 — Estabilização (1-2 semanas)
- [x] ModelServerStatus, chat timeout, models list
- [x] Context menu com AI actions
- [x] Task Planner UI
- [x] Self-improvement module
- [x] Unattended mode
- [x] Knowledge tools (create_note, search_notes)
- [ ] Provider selection UI (Ollama vs Native)

### Fase 1 — LLM Dual Provider (1-2 semanas)
- [ ] Adicionar `NativeProvider` (llama-cpp-python) no LLMGateway
- [ ] Model cache (manter instância em memória)
- [ ] Seletor de provedor por modelo/tarefa
- [ ] Grammar-constrained tool calling
- [ ] Fallback automático entre provedores

### Fase 2 — Áudio (2-3 semanas)
- [ ] Whisper integration (STT) — tool `transcribe_audio`
- [ ] Piper TTS integration (TTS rápido) — tool `synthesize_speech`
- [ ] Coqui XTTS (voz natural + clonagem)
- [ ] Modo de conversa por voz (microfone → STT → LLM → TTS → áudio)

### Fase 3 — Visão & Imagem (3-4 semanas)
- [ ] Stable Diffusion / Flux integration — tool `generate_image`
- [ ] Inpainting/editing — tool `edit_image`
- [ ] Câmera ao vivo — tool `capture_camera` + análise com LLM Vision
- [ ] OCR via docling/Tesseract
- [ ] AnimateDiff (vídeos curtos)

### Fase 4 — Documentos (1-2 semanas)
- [ ] Leitura de PDF/DOCX/XLSX — tool `extract_text`
- [ ] Criação de documentos formatados
- [ ] Pipeline RAG (chunk → embed → vector store → search)

### Fase 5 — Integrações (4-6 semanas)
- [ ] Email (IMAP/SMTP) — ler, enviar, responder
- [ ] WhatsApp (whatsapp-web.js)
- [ ] GitHub (gh CLI)
- [ ] Calendário (CalDAV)
- [ ] Telegram / Discord
- [ ] Plugin system — API para o usuário adicionar serviços

### Fase 6 — Arquitetura Micro-Serviços (contínuo)
- [ ] Desacoplar serviços pesados em processos separados
- [ ] IPC entre core e workers (ZeroMQ / gRPC)
- [ ] Gerenciador de workers (start/stop/monitor)
- [ ] GPU scheduling entre serviços

### Fase 7 — Avançado (longo prazo)
- [ ] Memória de longo prazo (Graph + Vector)
- [ ] Agentes autônomos executando em background
- [ ] Self-improvement contínuo (análise noturna)
- [ ] Perfil de usuário (preferências, histórico, personalidade)
- [ ] Integração com Home Assistant (IoT)

---

## 6. Limitações Reais (O que NÃO é possível localmente)

| Funcionalidade | Por que não é possível | Alternativa local |
|---|---|---|
| **Vídeo longo animado (>30s)** | Sora, Runway, Pika requerem GPUs massivas (centenas de H100). Modelos abertos (Modelscope, AnimateDiff) só fazem 2-5s. | Gerar frames individuais + composição manual. Qualidade muito inferior. |
| **Música com letra coerente** | Bark/MusicGen geram áudio mas não controlam fonemas para cantar letra. | Gerar instrumental + usar TTS para vocal. Não soa natural. |
| **Clonagem de voz perfeita** | ElevenLabs (cloud) usa modelo proprietário. XTTS v2 é bom mas não idêntico. | XTTS v2 + fine-tuning. 90% de相似idade. Suficiente para uso pessoal. |
| **Instagram automatizado** | API oficial exige app aprovado pela Meta. Scraping viola ToS e causa ban. | Apenas leitura via browser automation. Sem postar. |
| **Reconhecimento facial em tempo real** | Possível tecnicamente (DeepFace, InsightFace) mas tem implicações éticas e legais. | Implementar com consentimento explícito do usuário. |
| **Tradução simultânea** | Latência local é alta para tempo real. | Whisper + LLM + TTS: latência de 2-5s. Funciona para conversação. |

---

## 7. Decisões Arquiteturais

### 7.1 Monólito vs Micro-Serviços

**Agora**: Monólito (mais simples, desenvolvimento rápido)
**Futuro**: Micro-serviços (escalabilidade, isolamento de falhas)

Cada serviço pesado (Stable Diffusion, Whisper, MusicGen) vira um worker separado:
- Comunicação via **REST local** ou **ZeroMQ**
- Core decide qual worker chamar
- Workers podem usar GPU compartilhada ou dedicada
- Se um worker crasha, core continua rodando

### 7.2 Plugin System

Para o usuário poder adicionar seus próprios serviços:
- `~/.jarvis/plugins/*.py` — carregados automaticamente
- Interface: `class JarvisPlugin: name, tools[], on_load(), on_unload()`
- Cada plugin adiciona ferramentas ao ToolManager
- Restrito ao workspace do usuário (sandbox)

### 7.3 Segurança

- Tudo local: **zero dados enviados para cloud**
- Permissões granulares por ferramenta (já implementado)
- Modo não assistido + assistido (já implementado)
- Sandbox para execução de código (subprocess com timeout)
- Criptografia para secrets locais (já implementado)

---

## 8. Resumo: Dependências necessárias

### Essenciais (já temos)
```
Python 3.11+, Node.js 18+
Ollama (ou llama-cpp-python)
pywebview, FastAPI, SQLite
React + Vite, Monaco Editor, xterm.js
```

### Fase 1 — LLM Dual
```
llama-cpp-python (pip)
```

### Fase 2 — Áudio
```
openai-whisper ou faster-whisper
piper-tts (sistema) + python bindings
TTS (Coqui) - opcional para voz natural
```

### Fase 3 — Visão & Imagem
```
torch + diffusers (Stable Diffusion / Flux)
OpenCV (camera)
Tesseract (OCR)
docling (PDF/DOCX parsing)
```

### Fase 4 — Documentos
```
python-docx
openpyxl
ReportLab
pdfplumber ou PyMuPDF
```

### Fase 5 — Integrações
```
whatsapp-web.js (Node.js)
gh (CLI)
caldav (pip)
discord.py (pip)
python-telegram-bot
```

### Hardware Recomendado
| Uso | GPU | RAM | VRAM |
|---|---|---|---|
| Mínimo (chat + tools) | CPU only | 16GB | — |
| Básico (+ STT + TTS) | Qualquer GPU | 16GB | 4GB |
| Intermediário (+ imagem) | NVIDIA RTX 3060+ | 32GB | 12GB |
| Avançado (+ vídeo + música) | NVIDIA RTX 4090 | 64GB | 24GB |
| Profissional (+ tudo) | 2× RTX 4090 / A6000 | 64GB+ | 48GB+ |

---

## 9. Conclusão

**O JARVIS pode se tornar um assistente pessoal completo, local e gratuito.**

O que já temos é uma base sólida: LLM com tool calling, conhecimento, planner e self-improvement. Para chegar no nível "JARVIS do Homem de Ferro", precisamos adicionar:

1. **Voz** → Whisper + Piper/Coqui (2-3 semanas)
2. **Visão** → Câmera + SD/Flux (3-4 semanas)
3. **Documentos** → PDF, DOCX, XLSX (1-2 semanas)
4. **Integrações** → Email, WhatsApp, GitHub, Telegram (4-6 semanas)
5. **Arquitetura** → Micro-serviços + plugins (contínuo)

**Tudo é possível local e gratuitamente**, com exceção de:
- ❌ Vídeo longo animado (>30s) — inviável localmente
- ❌ Música com letra — qualidade limitada
- ❌ Instagram automatizado — risco de ban

A arquitetura de **duplo provedor (Ollama + llama-cpp-python)** garante que nunca perdemos funcionalidade — apenas ganhamos.
