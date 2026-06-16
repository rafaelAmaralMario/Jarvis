# Integração Home Assistant (IoT)

## Descrição
Integrar com Home Assistant via API REST para controle de dispositivos inteligentes. Tools: `list_devices` (listar dispositivos), `control_device` (ligar/desligar/configurar), `get_sensor` (ler sensores). Automação local sem cloud.

## Critérios de Aceitação
- [x] Conexão com Home Assistant (API token)
- [x] Tool `list_devices`: lista dispositivos e estados
- [x] Tool `control_device`: liga/desliga/configura dispositivo
- [x] Tool `get_sensor`: lê valor de sensor (temperatura, etc.)
- [x] Automação: "se sensor X > Y, então ação Z"

## Dependências
- [ ] — (independente, requer Home Assistant instalado)

## Fase
Fase 7 — Avançado

## Prioridade
Baixa

## Esforço Estimado
Pequeno

