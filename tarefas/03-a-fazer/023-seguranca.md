# 023 — Segurança

## Metadados
- Status: a fazer
- Prioridade: 🟡 Média
- Dependências: (nenhuma)

## Descrição
Permission Center, Audit Log Viewer, Secret Storage e criptografia de dados sensíveis.

## Especificação Técnica

### C++ — SecurityManager
```cpp
class SecurityManager {
    // Permission Center
    std::vector<Permission> getPermissions(const std::string& moduleId);
    bool setPermission(const std::string& moduleId, const std::string& permission, bool granted);
    
    // Secret Storage
    bool storeSecret(const std::string& key, const std::string& value);
    std::string getSecret(const std::string& key);
    bool deleteSecret(const std::string& key);
    
    // Audit
    std::vector<AuditEntry> getAuditLog(int limit = 100, const std::string& module = "");
    void logAudit(const std::string& module, const std::string& action, const std::string& detail);
    
    // Encryption
    std::string encrypt(const std::string& data, const std::string& key);
    std::string decrypt(const std::string& data, const std::string& key);
};
```

### Bridge handlers
- `securityGetPermissions(moduleId)`
- `securitySetPermission(moduleId, permission, granted)`
- `securityGetAuditLog(limit, module)`
- `securityStoreSecret(key, value)` / `securityGetSecret(key)` / `securityDeleteSecret(key)`

### React — Componentes
- `PermissionPanel.tsx` — grid de permissões por módulo
- `AuditLogViewer.tsx` — tabela com filtros por módulo/ação/data
- `SecretManager.tsx` — UI para gerenciar chaves de API armazenadas

## Critérios de Aceitação
- [ ] Permission Center mostra módulos e permissões
- [ ] Permissões podem ser ativadas/desativadas
- [ ] Audit log mostra eventos com timestamp
- [ ] Secrets são armazenados criptografados
- [ ] Criptografia/descriptografia funciona

## Test Cases

### TC-001: Permission toggle
- **Passos:** 1. Abrir Permission Center 2. Desativar permissão de rede
- **Resultado:** Módulo não pode mais fazer requisições HTTP
- **Cobertura:** normal

### TC-002: Audit log
- **Passos:** 1. Realizar ações 2. Abrir Audit Log
- **Resultado:** Ações aparecem listadas com timestamp e detalhes
- **Cobertura:** normal
