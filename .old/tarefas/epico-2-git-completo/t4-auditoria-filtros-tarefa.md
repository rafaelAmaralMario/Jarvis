# Tarefa: Auditoria com Filtros

**Epico:** 2 — Git Completo  
**Prioridade:** 🟡 Media  
**Estimativa:** 1 semana  
**Dependencias:** Nenhuma

## Objetivo

Transformar a tela de auditoria (AuditView) em uma ferramenta realmente consultavel, com filtros por ator, tipo de permissao, resultado e data.

## Estado Atual

O AuditView exibe todos os eventos em ordem cronologica sem filtros.

## Como Fazer

### 1. Adicionar filtros no hook useAudit

```typescript
interface AuditFilters {
  actor?: string;
  action?: string;
  result?: 'success' | 'failure' | 'blocked';
  startDate?: number;
  endDate?: number;
}
```

### 2. Atualizar AuditView

```tsx
function AuditView({ events }: AuditViewProps) {
  const [filters, setFilters] = useState<AuditFilters>({});
  const filteredEvents = useMemo(() => applyFilters(events, filters), [events, filters]);
  return (
    <div>
      <AuditFiltersPanel filters={filters} onChange={setFilters} />
      <AuditEventList events={filteredEvents} />
    </div>
  );
}
```

### 3. Componentes de filtro

- Select de ator (user, agent:developer, agent:reviewer, etc.)
- Select de acao (read-workspace, write-workspace, git, network, secrets)
- Select de resultado (success, failure, blocked)
- Date range picker (simples: hoje, esta semana, este mes, custom)

## Criterios de Pronto

- [ ] Filtro por ator (user, agent, sistema)
- [ ] Filtro por tipo de permissao
- [ ] Filtro por resultado (sucesso, falha, bloqueado)
- [ ] Filtro por periodo (hoje, semana, mes, custom)
- [ ] Multiplos filtros ativos simultaneamente
- [ ] Filtros resetaveis
- [ ] Contagem de resultados visivel
- [ ] Exportar auditoria (JSON)
