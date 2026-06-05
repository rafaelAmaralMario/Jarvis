# Proposta: Automação de Desktop e Screenpipe

## Visão Geral
Adicionar capacidade de automação de desktop no JARVIS — captura de tela (screenpipe), OCR, reconhecimento de UI, e automação RPA (Robotic Process Automation) para interagir com qualquer aplicativo do sistema.

## Cenários de Uso
- Extrair texto de imagens e documentos com OCR
- Automatizar preenchimento de formulários em apps desktop
- Monitorar métricas em dashboards e alertar
- "Mostre-me como fazer X" — gravação de workflow
- RPA: "Extraia os dados desta planilha e preencha no sistema Y"

## Componentes

### Screen Capture (Screenpipe)
- Captura contínua de tela (configurável: N frames/segundo)
- Captura de janela específica ou área selecionada
- Detecção de mudanças significativas (diff de tela)
- Buffer circular de screenshots (últimos N segundos)
- Compressão otimizada (webp, skip de frames idênticos)

### OCR Engine
- **Local**: Tesseract OCR 5.x (C++ library)
- Idiomas: português, inglês, espanhol (treinável)
- Detecção automática de idioma
- Extração de bounding boxes (posição do texto)
- Pós-processamento: correção ortográfica com IA

### UI Element Detection
- Detecção de botões, campos de texto, menus
- Baseado em visão computacional (OpenCV) ou modelos (YOLO)
- Mapeamento de coordenadas → ações (clique, tecla)
- Suporte a acessibilidade (Win32 API, MSAA, UI Automation)

### RPA Engine
- Sequência de ações gravadas ou programadas
- Tipos de ação: click, type, keypress, wait, scroll, screenshot
- Seleção de alvo: coordenada, imagem (template matching), texto (OCR)
- Condições: wait for element, if text appears
- Loops e variáveis

### Gravação de Macros
- "Gravar" — captura ações do usuário (cliques, teclas)
- Reprodução com velocidade ajustável
- Edição da macro (remover passos, adicionar condições)
- Exportar macro como workflow

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    JARVIS Desktop                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ ScreenCapture │  │  OCR Engine │  │ UI Detection │   │
│  │ (D3D/DXGI)   │  │ (Tesseract) │  │  (OpenCV)    │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                  │           │
│         └─────────────────┼──────────────────┘           │
│                           ▼                              │
│  ┌────────────────────────────────────────────────┐      │
│  │              RPA Engine                         │      │
│  │  Sequencer │ Condition │ Loop │ Variable Store  │      │
│  └────────────────────────────────────────────────┘      │
│                           │                              │
│                           ▼                              │
│  ┌────────────────────────────────────────────────┐      │
│  │              Input Simulation                   │      │
│  │  SendInput (Win32) │ AppleScript │ xdotool     │      │
│  └────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

## Interface

### Screenpipe Panel
- Preview ao vivo da captura de tela
- Seletor de área/janela para captura
- Histórico de screenshots
- Busca textual no histórico (OCR indexado)

### Macro Recorder
- Barra flutuante: ⏺ Gravar ⏹ Parar ▶ Reproduzir
- Timeline da gravação (passos com timestamp)
- Editor de passos (reordenar, remover, modificar)
- Preview da reprodução (velocidade 1x/2x/4x)

### Automation Workflows
- Integração com Workflow Engine (06)
- Steps de automação: ScreenCapture, OCR, Click, Type, Wait
- "Execute workflow automaticamente toda segunda 9h" (cron)

## Extensões Bridge
```typescript
screenpipe.startCapture({ area?, fps? })        → { success }
screenpipe.stopCapture()                         → { success }
screenpipe.getScreenshot()                        → ImageData
screenpipe.ocr(imageData)                         → { text, regions[] }
screenpipe.searchOCR(query)                       → OCRResult[]
screenpipe.detectUI(imageData)                    → UIElement[]

automation.click({ x, y })                        → { success }
automation.type({ text })                         → { success }
automation.keypress({ key, modifiers })           → { success }
automation.wait({ ms })                           → { success }
automation.screenshot()                           → ImageData
automation.findElement({ text?, image? })         → UIElement?

macro.record({ name })                            → Macro
macro.play(macroId)                               → { success }
macro.list()                                      → Macro[]
macro.edit(macroId, steps)                        → Macro
```

## Tabelas SQLite
```sql
CREATE TABLE screenpipe_index (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    screenshot_path TEXT NOT NULL,
    ocr_text TEXT,
    ocr_regions JSON,
    app_name TEXT,
    window_title TEXT,
    checksum TEXT UNIQUE  -- para evitar duplicatas
);

CREATE TABLE macros (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    steps JSON NOT NULL,
    hotkey TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

## Dependências
- Tesseract OCR (C++ library, ~20MB)
- OpenCV (C++ library, ~30MB)
- Windows: DXGI/Direct3D para captura de tela
- QtGui (já incluso) para manipulação de imagem
- Task 019 (Automação) — workflow engine base

## Prioridade: Baixa
## Esforço Estimado: 6-8 semanas
## Impacto: Muito Alto — transforma JARVIS em assistente de desktop completo
