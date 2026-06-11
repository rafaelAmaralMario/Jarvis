# Integração Home Assistant (IoT)

## Descrição
Integrar com Home Assistant via API REST para controle de dispositivos inteligentes. Tools: `list_devices` (listar dispositivos), `control_device` (ligar/desligar/configurar), `get_sensor` (ler sensores). Automação local sem cloud.

## Critérios de Aceitação
- [ ] Conexão com Home Assistant (API token)
- [ ] Tool `list_devices`: lista dispositivos e estados
- [ ] Tool `control_device`: liga/desliga/configura dispositivo
- [ ] Tool `get_sensor`: lê valor de sensor (temperatura, etc.)
- [ ] Automação: "se sensor X > Y, então ação Z"

## Dependências
- [ ] — (independente, requer Home Assistant instalado)

## Fase
Fase 7 — Avançado

## Prioridade
Baixa

## Esforço Estimado
Pequeno
