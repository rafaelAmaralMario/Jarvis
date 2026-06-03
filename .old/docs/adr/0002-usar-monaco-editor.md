# ADR 0002 - Usar Monaco Editor

Status: proposto  
Data: 2026-06-02

## Contexto

O JARVIS precisa de um editor de codigo robusto, familiar e com recursos maduros para uma IDE moderna.

## Decisao

Usar Monaco Editor como editor central do MVP.

## Consequencias Positivas

- Experiencia familiar para usuarios de VS Code.
- Bom suporte a linguagens.
- Suporte a temas.
- Base madura para diff e edicao de codigo.

## Consequencias Negativas

- Pode ser mais pesado que alternativas como CodeMirror.
- Exige cuidado de integracao com layout e performance.

## Alternativas Consideradas

- CodeMirror.
- Editor proprio.

