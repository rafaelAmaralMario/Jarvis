# MusicGen / Audio Generation

## Descrição
Integrar MusicGen (Meta) e/ou Bark (Suno) para geração de áudio a partir de texto. Tool `generate_music`: descrição → áudio (~5-30s). Tool `generate_sound_effect`: descrição → efeito sonoro. Qualidade limitada para música com letra, mas útil para prototipagem, trilhas instrumentais e efeitos.

## Critérios de Aceitação
- [ ] Instalar audiocraft (MusicGen + AudioGen)
- [ ] Tool `generate_music`: texto descritivo → áudio .wav
- [ ] Tool `generate_sound_effect`: descrição → efeito sonoro
- [ ] Parâmetros: duração, seed, temperature
- [ ] Preview e download do áudio
- [ ] Suporte a continuação (extender áudio existente)

## Dependências
- [ ] torch + CUDA (GPU recomendada)

## Fase
Fase 2 — Áudio

## Prioridade
Baixa

## Esforço Estimado
Médio

## Notas
Qualidade não comparável a serviços como Suno ou Udio. Música com letra tem qualidade limitada. Efeitos sonoros (AudioGen) têm qualidade melhor.
