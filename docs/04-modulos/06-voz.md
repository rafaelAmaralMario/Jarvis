# Modulo Voz

**ID:** `jarvis.voice`
**Prioridade:** 🟢 Baixa
**Depende de:** Kernel, AI Engine
**Status:** Nao iniciado

## Funcionalidades
- Speech-to-Text via whisper.cpp (local, off-line)
- Text-to-Speech via Qt TextToSpeech ou edge-tts
- Comando de voz para acoes rapidas
- Conversa por voz com a IA

## Componentes
- `whisper.cpp` para STT (modelo base pequeno ~80MB)
- `Qt TextToSpeech` ou miniaudio para TTS
- Deteccao de wake word (futuro)
