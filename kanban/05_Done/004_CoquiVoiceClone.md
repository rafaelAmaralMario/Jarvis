# Coqui XTTS — Clonagem de Voz

## Descrição
Integrar Coqui XTTS v2 para síntese de voz natural com clonagem de voz. Tool `clone_voice`: recebe 3-10s de áudio de amostra, clona a voz, permite sintetizar novo texto com a voz clonada. Requer GPU para tempo real.

## Critérios de Aceitação
- [x] Instalar TTS (Coqui) com suporte a XTTS v2 (optional dep: `pip install TTS`)
- [x] Tool `clone_voice`: amostra de áudio → speaker_id
- [x] Tool `synthesize_speech_with_voice`: texto + speaker_id → áudio com voz clonada
- [x] Tool `list_voices`: lista vozes clonadas disponíveis
- [x] Fallback para Piper TTS se GPU não disponível (auto-detect cuda/cpu)

## Dependências
- [ ] 003_PiperTTS

## Fase
Fase 2 — Áudio

## Prioridade
Baixa

## Esforço Estimado
Grande
