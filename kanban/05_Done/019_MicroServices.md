# Arquitetura de Micro-Serviços

## Descrição
Desacoplar serviços pesados (Stable Diffusion, Whisper, MusicGen) em processos separados. Comunicação via REST local ou ZeroMQ. Core decide qual worker chamar. GPU compartilhada ou dedicada por serviço. Isolamento de falhas — se um worker crasha, core continua.

## Critérios de Aceitação
- [x] Definir protocolo de comunicação (HTTP REST)
- [x] Worker manager: start/stop/monitor workers (WorkerManager + WorkerProcess)
- [x] Health check periódico dos workers (thread a cada 15s)
- [ ] Desacoplar Stable Diffusion como worker — *postergado (infra para iniciar workers pronta)*
- [ ] Desacoplar Whisper como worker — *postergado*
- [ ] GPU scheduling: round-robin ou dedicada — *postergado*
- [ ] Fallback para in-process se worker não disponível — *postergado*
- [ ] Logs centralizados dos workers — *postergado*

## Dependências
- [x] 006_StableDiffusion, 003_WhisperSTT — existentes

## Fase
Fase 6 — Micro-Serviços (contínuo)

## Prioridade
Baixa

## Esforço Estimado
Grande
