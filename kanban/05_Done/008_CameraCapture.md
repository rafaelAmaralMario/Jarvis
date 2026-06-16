# Câmera ao Vivo + Análise

## Descrição
Integrar OpenCV para capturar frames da câmera. Tool `capture_camera`: captura frame atual e retorna como imagem. Tool `analyze_camera`: captura + análise com LLM Vision (descrever cena, responder perguntas sobre o que vê). Captura periódica opcional.

## Critérios de Aceitação
- [x] Instalar OpenCV (opencv-python 4.13.0)
- [x] Tool `capture_camera`: frame da câmera → imagem (`CameraService`, `_handle_capture_camera`)
- [x] Integração com LLM Vision para descrever a cena (`cameraAnalyze` bridge + `images` field em LLMRequest + Ollama)
- [x] Botão de captura no frontend (`CameraPanel.tsx` com captura via canvas + botão "📸 Capturar")
- [x] Preview da câmera ao vivo (`getUserMedia` → `<video>` → preview em tempo real)

## Dependências
- [ ] — (independente, precisa de LLM com suporte a vision)

## Fase
Fase 3 — Visão & Imagem

## Prioridade
Baixa

## Esforço Estimado
Médio
