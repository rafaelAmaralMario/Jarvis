# Distribuicao - JARVIS

Status: preparacao operacional

## Builds

- Web build: `npm run build`
- Desktop dev: `npm run tauri:dev`
- Desktop release: `npm run tauri:build`
- Diagnostico Tauri: `npm run tauri:info`

## Canais

- `stable`: releases aprovadas para uso diario.
- `beta`: validacao de novas features com rollback simples.
- `nightly`: builds locais ou internos, sem promessa de estabilidade.

## Assinatura

- Windows: preparar certificado Authenticode.
- macOS: preparar Apple Developer ID e notarizacao.
- Linux: publicar checksums e artefatos assinados.

## Auto-update

- Definir servidor ou GitHub Releases como fonte.
- Publicar manifesto por canal.
- Assinar updates antes de habilitar atualizacao automatica.
- Mostrar changelog antes de instalar.
- Manter opcao de desabilitar auto-update.

## Checklist de Release

- `npm run build`
- `npm run tauri:build`
- Teste manual de abrir workspace, salvar arquivo, Git, chat, plugins e contexto.
- Gerar changelog.
- Publicar artefatos por plataforma.
- Atualizar issue/roadmap da versao.
