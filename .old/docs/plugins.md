# Sistema de Plugins - JARVIS

Status: inicial  
Objetivo: preparar o JARVIS para extensoes futuras sem comprometer seguranca, manutencao ou simplicidade do MVP.

## Visao

Plugins devem permitir adicionar capacidades ao JARVIS sem modificar o core da IDE. No inicio, plugins devem ser declarativos e controlados. Execucao de codigo local por plugins deve ser uma evolucao futura, nao uma premissa do MVP.

## Tipos de Plugin

Tipos previstos:

- Provider de LLM.
- Provider de imagem.
- Provider de embeddings.
- Ferramenta de contexto.
- Integracao externa.
- Agente especializado.
- Tema.
- Comando de command palette.
- Painel visual.
- Automacao local.

## Manifesto Inicial

Exemplo:

```json
{
  "id": "jarvis.obsidian",
  "name": "Obsidian",
  "version": "0.1.0",
  "author": "Jarvis",
  "description": "Integra vaults do Obsidian como fonte de contexto.",
  "capabilities": ["context.source", "markdown.read"],
  "permissions": ["filesystem.read"],
  "settings": [
    {
      "key": "vaultPath",
      "type": "path",
      "label": "Vault path",
      "required": true
    }
  ]
}
```

## Campos Obrigatorios

- `id`
- `name`
- `version`
- `author`
- `capabilities`
- `permissions`

## Permissoes

Permissoes possiveis:

- `filesystem.read`
- `filesystem.write`
- `network.request`
- `git.read`
- `git.write`
- `models.use`
- `secrets.read`
- `commands.execute`

Permissoes devem ser exibidas antes de ativar o plugin.

## Ciclo de Vida

Estados:

- Descoberto.
- Instalado.
- Ativo.
- Desativado.
- Com erro.
- Removido.

Fluxo:

1. Descobrir plugin.
2. Ler manifesto.
3. Validar manifesto.
4. Mostrar permissoes.
5. Ativar se autorizado.
6. Registrar capacidades.

## MVP

No MVP, plugins devem:

- Ter manifesto local.
- Ser listados na tela de plugins.
- Exibir status e permissoes.
- Nao executar codigo arbitrario.
- Servir como base para providers e integracoes futuras.

## Futuro

Evolucoes possiveis:

- Marketplace.
- Assinatura de plugins.
- Sandbox de execucao.
- Plugins privados.
- Plugins por workspace.
- Atualizacao automatica.

