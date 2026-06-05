# Proposta: Interface de Voz

## Visão Geral
Adicionar suporte a entrada e saída de voz no JARVIS, permitindo interação por fala com o assistente de IA.

## Componentes

### Speech-to-Text (STT)
- **Engine**: whisper.cpp (execução local, privacidade total)
- Idiomas: português, inglês, espanhol (modelos multilíngues)
- Modelos: tiny (~1GB) para rápida, base/small para precisão
- Detecção de fim de fala (VAD)
- Push-to-talk: `Ctrl+Shift+M`
- Transcrição em tempo real (streaming)

### Text-to-Speech (TTS)
- **Engine 1**: piper-tts (local, leve, ~2GB modelos)
- **Engine 2**: OpenAI TTS / ElevenLabs API (cloud, qualidade superior)
- Vozes: selecionáveis (masculino/feminino, velocidade, tom)
- Leitura de texto selecionado no editor
- Respostas da IA narradas (toggle)
- Controle de volume

### Integração com AI Engine
- Comando de voz dispara agente ativo
- Resposta do agente pode ser narrada
- Suporte a comandos de voz para ações (abrir arquivo, buscar, etc)

### Microfone
- Seleção de dispositivo de entrada
- Indicador de volume (VU meter)
- Botão de mute/unmute global
- Teste de microfone

## Interface
- Botão de microfone no AiPanel (toggle recording)
- Onda sonora animada durante gravação
- Indicador de "ouvindo..." no StatusBar
- Atalho global `Ctrl+Shift+M` para push-to-talk
- Painel de configuração de voz (voz, velocidade, STT model)

## Tabelas SQLite
```sql
CREATE TABLE voice_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    stt_model TEXT DEFAULT 'base',
    tts_engine TEXT DEFAULT 'piper',
    tts_voice TEXT DEFAULT 'default',
    tts_speed REAL DEFAULT 1.0,
    input_device TEXT,
    push_to_talk_key TEXT DEFAULT 'Ctrl+Shift+M',
    auto_narrate INTEGER DEFAULT 0,
    updated_at TEXT NOT NULL
);
```

## Arquitetura

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Microfone   │────▶│  VAD + STT   │────▶│  AI Engine   │
│  (QAudio)    │     │ (whisper.cpp)│     │ (agentes)    │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                 │
                                         ┌──────▼───────┐
                                         │  TTS Engine   │
                                         │ (piper/cloud) │
                                         └──────┬───────┘
                                                │
                                         ┌──────▼───────┐
                                         │   Alto-falante│
                                         │  (QAudioOut)  │
                                         └──────────────┘
```

## Dependências
- whisper.cpp (C++ library, ~10MB binary)
- piper-tts (C++ library)
- Qt Multimedia (QAudioSource, QAudioSink)
- Task 021 (Voz) — task já planejada no roadmap

## Prioridade: Média
## Esforço Estimado: 3-4 semanas
## Impacto: Alto — interação natural com mãos livres
