# Casos de Uso

## US-001: Abrir JARVIS e encontrar notas

**Ator:** Usuario
**Fluxo:**
1. Usuario abre JARVIS
2. Modulo Conhecimento carrega automaticamente
3. Usuario ve suas notas, pastas e tags
4. Usuario cria nova nota com `Ctrl+N`
5. Nota e salva no SQLite e sincronizada com disco

## US-002: Perguntar algo a IA com contexto do cerebro

**Ator:** Usuario
**Fluxo:**
1. Usuario abre chat no painel de IA
2. Digita "Explique a arquitetura do projeto X"
3. AI Engine busca notas relevantes no Conhecimento
4. AI Engine prepara prompt com contexto enriquecido
5. Usuario recebe resposta com citacoes das notas

## US-003: Agente cria nota automaticamente

**Ator:** Agente "Cerebro do Projeto"
**Fluxo:**
1. Usuario ativa agente
2. Agente analisa o projeto atual
3. Agente cria nota no Conhecimento com resumo
4. Nota fica disponivel para consultas futuras

## US-004: Editar codigo com assistencia IA

**Ator:** Usuario (Modulo IDE + AI Engine)
**Fluxo:**
1. Usuario abre arquivo no IDE
2. Seleciona codigo e pede "Explique isto"
3. AI Engine recebe selecao + contexto do projeto
4. AI Engine retorna explicacao no chat
5. Opcional: AI Engine sugere edicao que usuario pode aceitar

## US-005: Automacao de navegador

**Ator:** Usuario (Modulo Automacao)
**Fluxo:**
1. Usuario descreve "Va no site X e baixe o arquivo Y"
2. AI Engine interpreta e gera plano de acao
3. Modulo Automacao executa no navegador (Playwright-like)
4. Resultado e exibido ao usuario
