# Coqui XTTS — Clonagem de Voz

## Descrição
Integrar Coqui XTTS v2 para síntese de voz natural com clonagem de voz. Tool `clone_voice`: recebe 3-10s de áudio de amostra, clona a voz, permite sintetizar novo texto com a voz clonada. Requer GPU para tempo real.

## Critérios de Aceitação
- [ ] Instalar TTS (Coqui) com suporte a XTTS v2
- [ ] Tool `clone_voice`: amostra de áudio → modelo de voz
- [ ] Tool `synthesize_speech` com voz clonada
- [ ] Fine-tuning opcional para melhor qualidade
- [ ] Fallback para Piper TTS se GPU não disponível

## Dependências
- [ ] 003_PiperTTS

## Fase
Fase 2 — Áudio

## Prioridade
Baixa

## Esforço Estimado
Grande
