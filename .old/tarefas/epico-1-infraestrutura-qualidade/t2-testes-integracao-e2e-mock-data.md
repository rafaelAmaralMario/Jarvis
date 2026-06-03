# Mock Data: Testes de Integracao e E2E

## Git Flow Mock

```typescript
export const mockGitFlows = {
  statusResult: [
    { x: 'M', y: ' ', path: 'src/index.ts' },
    { x: ' ', y: 'M', path: 'README.md' },
  ],
  stageResult: undefined,
  unstageResult: undefined,
  diffResult: 'diff --git a/src/index.ts b/src/index.ts\nindex abc..def 100644\n--- a/src/index.ts\n+++ b/src/index.ts\n@@ -1 +1,2 @@\n+console.log("hello");\n console.log("world");',
  commitResult: undefined,
  branchesResult: ['main', 'feature/test'],
  prUrlResult: 'https://github.com/user/repo/compare/main...feature/test?expand=1',
};
```

## File CRUD Mock

```typescript
export const mockFileOperations = {
  createResult: undefined,
  renameResult: undefined,
  moveResult: undefined,
  deleteResult: undefined,
  readResult: 'console.log("hello world");',
  writeResult: undefined,
  searchResult: [
    { path: 'src/index.ts', matches: ['console.log'] },
    { path: 'src/utils.ts', matches: ['console.error'] },
  ],
};
```

## Settings Mock for Persistence

```typescript
export const mockSettingsPersistence = {
  initial: {
    theme: 'dark',
    activeModelId: 'mock-text',
    ollamaUrl: 'http://localhost:11434',
    permissions: {
      'read-workspace': true,
      'write-workspace': false,
      git: true,
      network: false,
      secrets: false,
    },
  },
  modified: {
    theme: 'light',
    activeModelId: 'ollama:llama3.2',
    ollamaUrl: 'http://192.168.1.100:11434',
    permissions: {
      'read-workspace': true,
      'write-workspace': true,
      git: true,
      network: true,
      secrets: false,
    },
  },
};
```

## Rust Mock Data

```rust
pub mod test_data {
    pub fn valid_plugin_manifest() -> serde_json::Value {
        serde_json::json!({
            "id": "test-plugin",
            "name": "Test Plugin",
            "version": "1.0.0",
            "capabilities": ["models.text"],
            "permissions": []
        })
    }

    pub fn invalid_plugin_manifest() -> serde_json::Value {
        serde_json::json!({
            "id": "",
            "name": 123,
            "capabilities": "invalid"
        })
    }

    pub fn workspace_structure() -> Vec<&'static str> {
        vec!["src/main.rs", "src/lib.rs", "Cargo.toml", "README.md"]
    }
}
```
