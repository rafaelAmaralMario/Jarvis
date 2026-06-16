# AnimateDiff — Vídeos Curtos

## Descrição
Integrar AnimateDiff para geração de vídeos curtos (2-5s) animados a partir de texto ou imagem inicial. Qualidade razoável para movimentos simples. Tool `generate_video`. Limitado a clips curtos — vídeos longos (>30s) são inviáveis localmente.

## Critérios de Aceitação
- [x] Instalar AnimateDiff + dependências (diffusers built-in MotionAdapter)
- [x] Tool `generate_video`: prompt → vídeo MP4 (2-5s)
- [ ] Suporte a video a partir de imagem inicial (img2vid) — *postergado*
- [x] Parâmetros: seed, steps, fps, num_frames, guidance_scale
- [x] Preview via base64 e download via output_dir

## Dependências
- [x] 006_StableDiffusion (diffusers + torch + imageio[ffmpeg])

## Fase
Fase 3 — Visão & Imagem

## Prioridade
Baixa

## Esforço Estimado
Grande
