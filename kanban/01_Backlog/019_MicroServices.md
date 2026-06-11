# Arquitetura de Micro-Serviços

## Descrição
Desacoplar serviços pesados (Stable Diffusion, Whisper, MusicGen) em processos separados. Comunicação via REST local ou ZeroMQ. Core decide qual worker chamar. GPU compartilhada ou dedicada por serviço. Isolamento de falhas — se um worker crasha, core continua.

## Critérios de Aceitação
- [ ] Definir protocolo de comunicação (REST/ZeroMQ/gRPC)
- [ ] Worker manager: start/stop/monitor workers
- [ ] Health check periódico dos workers
- [ ] Desacoplar Stable Diffusion como worker
- [ ] Desacoplar Whisper como worker
- [ ] GPU scheduling: round-robin ou dedicada
- [ ] Fallback para in-process se worker não disponível
- [ ] Logs centralizados dos workers

## Dependências
- [ ] 006_StableDiffusion
- [ ] 003_WhisperSTT
- [ ] Múltiplos serviços pesados implementados

## Fase
Fase 6 — Micro-Serviços (contínuo)

## Prioridade
Baixa

## Esforço Estimado
Grande
