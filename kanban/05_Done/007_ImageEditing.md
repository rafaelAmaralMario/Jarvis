# Edição de Imagem (Inpainting/Outpainting)

## Descrição
Implementar edição de imagem com Stable Diffusion + ControlNet. Tool `edit_image`: inpainting (preencher área selecionada), outpainting (expandir além das bordas), edição guiada por prompt. Máscara pode ser desenhada pelo usuário ou gerada automaticamente.

## Critérios de Aceitação
- [x] Tool `edit_image` com suporte a inpainting (SDXL + SD inpainting pipelines)
- [ ] Tool `edit_image` com suporte a outpainting — *postergado (requer padding + geração de máscara)*
- [ ] Interface de máscara (selecionar área na imagem) — *frontend*
- [x] Parâmetros: prompt, mask, strength, steps, negative_prompt
- [x] Preview via base64

## Dependências
- [x] 006_StableDiffusion + diffusers

## Fase
Fase 3 — Visão & Imagem

## Prioridade
Baixa

## Esforço Estimado
Grande
