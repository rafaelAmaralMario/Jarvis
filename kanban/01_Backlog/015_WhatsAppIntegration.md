# Integração WhatsApp

## Descrição
Integrar WhatsApp via whatsapp-web.js (browser automation). Tools: `send_whatsapp` (enviar mensagem), `read_whatsapp` (ler últimas mensagens). Requer escaneamento de QR code na primeira vez. Pode quebrar com atualizações do WhatsApp Web.

## Critérios de Aceitação
- [ ] Instalar whatsapp-web.js (Node.js)
- [ ] Tool `send_whatsapp`: número + mensagem → enviado
- [ ] Tool `read_whatsapp`: lista mensagens recentes
- [ ] Gerenciamento de sessão (QR code, persistência)
- [ ] Suporte a mídia (imagens, áudio)

## Dependências
- [ ] — (independente, requer Node.js)

## Fase
Fase 5 — Integrações

## Prioridade
Baixa

## Esforço Estimado
Médio
