# Padroes de Codigo - JARVIS

Status: inicial  
Objetivo: manter o projeto simples de evoluir, bem separado e preparado para IA, agentes, plugins e integracoes locais.

## Principios Gerais

- Priorizar clareza sobre esperteza.
- Separar regras de negocio, infraestrutura, interface e integracoes.
- Evitar dependencias diretas entre modulos que deveriam evoluir separadamente.
- Preferir contratos/interfaces para provedores, agentes, plugins e ferramentas externas.
- Manter efeitos colaterais explicitos, especialmente leitura de arquivos, escrita, rede e comandos de sistema.
- Toda capacidade sensivel deve passar por uma camada de permissao e auditoria.

## SOLID

### Single Responsibility Principle

Cada modulo deve ter um motivo claro para mudar.

Exemplos:

- Um provider de LLM nao deve saber renderizar UI.
- Um componente de tela nao deve decidir permissao de sistema.
- Um agente nao deve acessar arquivos diretamente sem passar pela camada de ferramentas/permissoes.

### Open/Closed Principle

O core deve ser aberto para extensao e fechado para mudancas frequentes.

Exemplos:

- Novos provedores de LLM entram por uma interface comum.
- Novos plugins declaram capacidades via manifesto.
- Novas ferramentas de agente sao registradas sem alterar o fluxo central.

### Liskov Substitution Principle

Implementacoes de um contrato devem poder substituir umas as outras.

Exemplos:

- Um provider mock, local ou remoto deve funcionar por meio da mesma interface.
- Um indexador de contexto local pode ser trocado por outro sem quebrar o consumidor.

### Interface Segregation Principle

Interfaces devem ser pequenas e especificas.

Exemplos:

- Separar `TextModelProvider`, `ImageModelProvider` e `EmbeddingProvider`.
- Separar ferramenta de leitura de arquivo de ferramenta de escrita.
- Separar Git status, Git diff e Git commit em capacidades distintas.

### Dependency Inversion Principle

Modulos de alto nivel devem depender de abstracoes, nao de implementacoes concretas.

Exemplos:

- Agentes dependem de contratos de ferramentas, nao de comandos Tauri diretamente.
- A UI (hooks) depende de servicos de aplicacao, nao de detalhes de filesystem ou Tauri.
Componentes de UI nunca dependem de servicos ou infrastructure — apenas de props.
- O orquestrador de IA depende de providers registrados, nao de uma API especifica.

## Separacao de Camadas

Camadas atuais:

- `ui/components/`: UI pura com props. Nunca chamam services ou infrastructure.
- `ui/hooks/`: estado + efeitos colaterais. Chamam `application/services/*`.
- `application/services/`: orquestracao. Chamam `infrastructure/native.ts`.
- `domain`: entidades, contratos e tipos centrais.
- `infrastructure`: Tauri, filesystem, Git, rede, armazenamento e APIs externas.
- `plugins`: manifestos, registro e ciclo de vida de extensoes.
- `agents`: definicoes, permissoes, ferramentas e logs de agentes.

Regras:

- `ui/components/` → `ui/hooks/` (props)
- `ui/hooks/` → `application/services/`
- `application/services/` → `infrastructure/native.ts`
- `application` depende de `domain` e contratos.
- `domain` nao deve depender de UI, Tauri, banco, rede ou provider especifico.
- `infrastructure` implementa contratos definidos nas camadas internas.

## Padrao para Hooks Customizados

Hooks seguem o padrao state-only + service delegation:

```typescript
// Hook declara estado + funcoes que delegam ao service
export function useGit() {
  const [gitFiles, setGitFiles] = useState<GitFile[]>([]);
  const svcRef = useRef(createGitService());

  const refresh = useCallback(async () => {
    const result = await svcRef.current.getStatus();
    setGitFiles(result);
  }, []);

  return { gitFiles, refresh };
}
```

Regras:
- Hook nao importa de `infrastructure/` diretamente.
- Service e criado com `useRef` para lazy initialization.
- Funcoes retornadas usam `useCallback` com dependencias minimas.
- Hooks podem importar de `application/services/*` e `domain/*`.

## Padrao para Application Services

Services sao factory functions que retornam objeto de metodos:

```typescript
// application/services/git.ts
export function createGitService() {
  return {
    async getStatus(): Promise<GitFile[]> {
      return invoke<GitFile[]>('git_status');
    },
    async getDiff(file: string): Promise<string> {
      return invoke<string>('git_diff', { file });
    },
  };
}
```

Regras:
- Service nao tem estado interno (stateless).
- Toda dependencia externa e injetada por parametro ou importada de `infrastructure/`.
- Metodos retornam `Promise`, nunca recebem callbacks.
- Factory pode receber parametros de configuracao se necessario.
- Services sao testaveis com `infrastructure/__mocks__/tauri.ts`.

## Padrao para Provedores de Modelo

Todo provider deve declarar:

- Identificador estavel.
- Nome exibido ao usuario.
- Capacidades suportadas.
- Modelos disponiveis.
- Requisitos de configuracao.
- Politica de erro e fallback.

Providers devem ser testaveis com implementacoes mockadas.

## Padrao para Agentes

Todo agente deve declarar:

- Objetivo.
- Modelo padrao.
- Ferramentas permitidas.
- Permissoes necessarias.
- Formato de saida esperado.
- Nivel de autonomia.

Agentes nao devem executar acoes sensiveis diretamente. Eles devem solicitar execucao por ferramentas controladas.

## Padrao para Plugins

Plugins devem comecar declarativos.

Cada plugin deve possuir manifesto com:

- Nome.
- Versao.
- Autor.
- Capacidades.
- Permissoes.
- Configuracoes visuais.
- Comandos adicionados.

Execucao de codigo local por plugins deve ser uma decisao explicita e separada do MVP.

## Formatacao

- TypeScript, JavaScript, JSON, CSS e Markdown seguem Prettier.
- Rust segue Rustfmt.
- Indentacao padrao: 2 espacos para web/docs, 4 espacos para Rust.
- Linha recomendada: ate 100 caracteres.
- Arquivos devem usar LF e terminar com newline.

## Nomenclatura

- Tipos, classes e componentes: `PascalCase`.
- Funcoes, variaveis e metodos: `camelCase`.
- Arquivos TypeScript de componentes: `PascalCase.tsx`.
- Arquivos utilitarios e servicos: `kebab-case.ts`.
- Modulos Rust: `snake_case`.
- Nomes de contratos devem representar capacidade, nao tecnologia.

## Testabilidade

- Regras de negocio devem ser testadas sem UI.
- Providers devem ter mocks.
- Ferramentas sensiveis devem ter testes para permissao negada e permissao concedida.
- Fluxos de agentes devem registrar acoes de forma verificavel.

