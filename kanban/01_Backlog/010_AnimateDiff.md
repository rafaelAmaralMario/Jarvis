# AnimateDiff — Vídeos Curtos

## Descrição
Integrar AnimateDiff para geração de vídeos curtos (2-5s) animados a partir de texto ou imagem inicial. Qualidade razoável para movimentos simples. Tool `generate_video`. Limitado a clips curtos — vídeos longos (>30s) são inviáveis localmente.

## Critérios de Aceitação
- [ ] Instalar AnimateDiff + dependências
- [ ] Tool `generate_video`: prompt → vídeo MP4 (2-5s)
- [ ] Suporte a video a partir de imagem inicial (img2vid)
- [ ] Parâmetros: seed, steps, fps, duração
- [ ] Preview e download do vídeo

## Dependências
- [ ] 006_StableDiffusion (diffusers + torch base)

## Fase
Fase 3 — Visão & Imagem

## Prioridade
Baixa

## Esforço Estimado
Grande
