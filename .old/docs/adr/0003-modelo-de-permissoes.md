# ADR 0003 - Modelo explicito de permissoes

Status: proposto  
Data: 2026-06-02

## Contexto

O JARVIS podera executar acoes sensiveis como escrever arquivos, executar comandos, acessar rede e usar credenciais. Agentes e plugins precisam operar com limites claros.

## Decisao

Adotar um modelo explicito de permissoes por workspace, agente, plugin e ferramenta.

## Consequencias Positivas

- Mais seguranca.
- Mais confianca do usuario.
- Auditoria clara.
- Melhor separacao de responsabilidades.

## Consequencias Negativas

- Mais trabalho no MVP.
- UX precisa evitar excesso de confirmacoes.

## Regras Iniciais

- Acoes destrutivas sempre exigem confirmacao.
- Acoes de agente devem ser registradas.
- Secrets nao devem ser enviados a modelos por padrao.
- Alteracoes devem ser revisaveis antes da aplicacao.

