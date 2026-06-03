# 023 — Segurança

## Metadados
- Status: a fazer
- Prioridade: 🟡 Média
- Fase: 6 — Extensibilidade
- Dependências: (nenhuma)

## Descrição
Permission Center UI, Audit Log Viewer, Secret Storage e criptografia.
O PermissionManager básico já existe no kernel — falta a UI e o Secret Storage.

## Especificação Técnica

### 1. C++ — SecurityManager (refinamento)

O `PermissionManager` já existe em `kernel/src/permission_manager.cpp`.
Precisa de expansão:

```cpp
namespace jarvis::security {

class ISecurityManager {
public:
    virtual ~ISecurityManager() = default;

    // Permissions (já existe, expandir)
    virtual std::vector<PermissionEntry> getAllPermissions() = 0;
    virtual bool setPermission(const std::string& moduleId, const std::string& permission, bool granted) = 0;
    virtual bool checkPermission(const std::string& moduleId, const std::string& permission) = 0;

    // Audit (tabela já existe, expandir)
    virtual void logAudit(const std::string& module, const std::string& action, const std::string& detail) = 0;
    virtual std::vector<AuditEntry> getAuditLog(int limit = 100, int offset = 0, const std::string& moduleFilter = "") = 0;
    virtual int getAuditCount(const std::string& moduleFilter = "") = 0;

    // Secret Storage (novo)
    virtual bool storeSecret(const std::string& service, const std::string& value) = 0;
    virtual std::string getSecret(const std::string& service) = 0;
    virtual bool deleteSecret(const std::string& service) = 0;
    virtual bool hasSecret(const std::string& service) = 0;

    // Encryption (novo)
    virtual std::string encrypt(const std::string& plaintext) = 0;
    virtual std::string decrypt(const std::string& ciphertext) = 0;

    // Master password
    virtual bool isMasterPasswordSet() = 0;
    virtual bool setMasterPassword(const std::string& password) = 0;
    virtual bool verifyMasterPassword(const std::string& password) = 0;
};

}
```

**Secret Storage:**
- Usa `libsodium` para criptografia dos valores
- Chave derivada da master password via Argon2id
- Tabela `secrets`: service | encrypted_value
- Master password armazenada como hash (Argon2id)

**Encryption:**
- AES-256-GCM via libsodium (crypto_secretbox)
- Funções auxiliares para encrypt/decrypt de strings

### 2. Migration #11 — `secrets`

```sql
CREATE TABLE IF NOT EXISTS secrets (
    service TEXT PRIMARY KEY,
    encrypted_value TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS master_password (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
```

### 3. Bridge handlers

```cpp
bridge.registerHandler("securityGetPermissions", [securityManager](const QVariantList&) -> QVariant { ... });
bridge.registerHandler("securitySetPermission", [securityManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("securityGetAuditLog", [securityManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("securityGetAuditCount", [securityManager](const QVariantList&) -> QVariant { ... });
bridge.registerHandler("securityStoreSecret", [securityManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("securityGetSecret", [securityManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("securityDeleteSecret", [securityManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("securitySetMasterPassword", [securityManager](const QVariantList& args) -> QVariant { ... });
bridge.registerHandler("securityVerifyMasterPassword", [securityManager](const QVariantList& args) -> QVariant { ... });
```

### 4. React — Componentes

**PermissionPanel.tsx:**
- Tabela: Módulo | Permissão | Concedida (toggle)
- Agrupado por módulo
- Busca por nome de módulo/permissão
- Apenas visível para usuários com permissão de administrador

**AuditLogViewer.tsx:**
- Tabela com paginação: Timestamp | Módulo | Ação | Detalhes
- Filtros: por módulo (dropdown), por data (date range), por ação (texto)
- Botão "Exportar CSV"
- Auto-refresh a cada 30s (opcional)

**SecretManager.tsx:**
- Tabela: Serviço | Status (configurado/não) | Ações
- Formulário: nome do serviço + value (password field) + salvar
- Botão "Revelar" (mostra valor mascarado)
- Protegido por master password

**MasterPasswordDialog.tsx:**
- Modal na primeira vez que tenta acessar secrets
- Input de senha + confirmar senha
- Se já configurada: apenas input de senha para verificar

### 5. Integração com Settings

Aba "Segurança" na SettingsPage:
- Sub-aba "Permissões": PermissionPanel
- Sub-aba "Auditoria": AuditLogViewer
- Sub-aba "Senhas": SecretManager + MasterPassword setup

## Critérios de Aceitação
- [ ] Permission Center mostra módulos com permissões toggle
- [ ] Audit Log mostra eventos com timestamp, módulo, ação, detalhes
- [ ] Audit Log tem paginação e filtros
- [ ] Secrets são armazenados criptografados no banco
- [ ] Master password protege acesso aos secrets
- [ ] Criptografia/descriptografia com AES-256-GCM funciona
- [ ] Tabela `secrets` criada na migration

## Test Cases

### TC-001: Permission toggle
- **Passos:** 1. Abrir Settings > Segurança > Permissões 2. Desativar permissão de rede para módulo X
- **Resultado:** Módulo X não pode mais fazer requisições HTTP
- **Cobertura:** normal

### TC-002: Audit log
- **Passos:** 1. Realizar 3 ações (abrir arquivo, salvar, fechar) 2. Abrir Audit Log
- **Resultado:** 3 entradas aparecem com timestamp e detalhes
- **Cobertura:** normal

### TC-003: Secret storage
- **Passos:** 1. Definir master password 2. Salvar secret "OPENAI_KEY=sk-xxx" 3. Fechar e reabrir app
- **Resultado:** Secret persiste e pode ser lida após autenticar com master password
- **Cobertura:** normal

### TC-004: Master password protege secrets
- **Passos:** 1. Tentar acessar SecretManager sem master password
- **Resultado:** MasterPasswordDialog aparece solicitando senha
- **Cobertura:** normal
