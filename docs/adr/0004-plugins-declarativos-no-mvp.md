# ADR 0004 - Plugins declarativos no MVP

Status: proposto  
Data: 2026-06-02

## Contexto

O JARVIS deve nascer preparado para plugins, mas permitir execucao de codigo local por plugins desde o inicio aumentaria risco e complexidade.

## Decisao

No MVP, plugins devem ser declarativos. Eles podem declarar capacidades, permissoes e configuracoes, mas nao devem executar codigo arbitrario.

## Consequencias Positivas

- Reduz risco de seguranca.
- Mantem o MVP mais simples.
- Permite desenhar a tela e o manifesto de plugins desde cedo.
- Facilita evolucao futura.

## Consequencias Negativas

- Plugins terao capacidades limitadas no inicio.
- Algumas integracoes reais ficarao para fases futuras.

## Evolucao Futura

- Sandbox de execucao.
- Assinatura de plugins.
- Marketplace.
- Plugins por workspace.

