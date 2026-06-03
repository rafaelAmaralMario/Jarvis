# ADR 0001 - Usar Tauri como base desktop

Status: aceito  
Data: 2026-06-02

## Contexto

O JARVIS precisa ser uma IDE desktop com boa integracao local, acesso controlado ao sistema, leitura/escrita de arquivos, Git, terminal, plugins e agentes.

## Decisao

Usar Tauri como base desktop do projeto.

## Consequencias Positivas

- Aplicacao mais leve que alternativas baseadas em Chromium completo.
- Backend Rust para operacoes sensiveis.
- Melhor controle de capacidades nativas.
- Boa base para seguranca e permissoes.

## Consequencias Negativas

- Exige conhecimento de Rust.
- Algumas integracoes podem exigir mais trabalho que em Electron.
- Ecossistema menor que Electron.

## Alternativas Consideradas

- Electron.
- Web app local.

