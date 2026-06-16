# MusicGen / Audio Generation

## Descrição
Integrar MusicGen (Meta) e/ou Bark (Suno) para geração de áudio a partir de texto. Tool `generate_music`: descrição → áudio (~5-30s). Tool `generate_sound_effect`: descrição → efeito sonoro. Qualidade limitada para música com letra, mas útil para prototipagem, trilhas instrumentais e efeitos.

## Critérios de Aceitação
- [x] Instalar transformers (MusicGen) em vez de audiocraft (deprecado)
- [x] Tool `generate_music`: texto descritivo → áudio .wav
- [x] Tool `generate_sound_effect`: descrição → efeito sonoro
- [x] Parâmetros: duração 1-60s, seed, temperature
- [x] Preview via base64 e download via output_dir
- [ ] Suporte a continuação (extender áudio existente) — *postergado*

## Dependências
- [x] torch + transformers + scipy

## Fase
Fase 2 — Áudio

## Prioridade
Baixa

## Esforço Estimado
Médio

## Notas
Qualidade não comparável a serviços como Suno ou Udio. Música com letra tem qualidade limitada. Efeitos sonoros (AudioGen) têm qualidade melhor.
