# Leitura de Documentos (PDF, DOCX, XLSX)

## Descrição
Implementar leitura e extração de conteúdo de documentos. Tools: `read_pdf`, `read_docx`, `read_xlsx`. Usar pdfplumber/PyMuPDF, python-docx, openpyxl. Extrair texto, tabelas, metadados. Integrar com RAG para busca semântica.

## Análise Técnica

### Arquitetura

```
User → Bridge.toolsExecute("read_pdf", args) → ToolManager._handle_read_pdf()
  → DocumentReaderService (new module: document_service.py)
    → PyMuPDF (pdf) / python-docx (docx) / openpyxl (xlsx)
    → extrai texto + tabelas + metadados
  → ToolResult com output formatado em markdown
```

Novo módulo `backend/jarvis/document_service.py` com classe `DocumentReader` que expõe métodos `read_pdf()`, `read_docx()`, `read_xlsx()`. Cada retorna `DocumentContent(text, tables, metadata, pages)`. O ToolManager chama o service e converte o resultado estruturado em string markdown para o LLM consumir (via `output`) e dados brutos para frontend (via `data`).

### Implementação Detalhada

1. File: `backend/jarvis/document_service.py` — classe `DocumentReader`
   - `read_pdf(path, start_page, end_page) → DocumentContent`
     - Usa `PyMuPDF` (`import fitz`): `fitz.open(path)` → itera páginas → `page.get_text("text")` para texto, `page.find_tables()` para tabelas (`pdfplumber` alternativa)
     - Metadados: `doc.metadata` (author, title, subject, creationDate)
     - Tabelas extraídas como listas de listas (para CSV/markdown)
     - Suporte a páginas seletivas (start_page/end_page) para documentos grandes
   - `read_docx(path) → DocumentContent`
     - Usa `python-docx`: `Document(path)` → itera paragraphs e tables
     - Metadados: `doc.core_properties` (author, created, modified)
     - Tabelas: extrai cada `table` como `[[cell.text for cell in row.cells] for row in table.rows]`
   - `read_xlsx(path, sheet_name) → DocumentContent`
     - Usa `openpyxl`: `load_workbook(path, data_only=True)` → itera sheets
     - Cada sheet → lista de linhas (valores)
     - Metadados: `wb.properties` (creator, created, modified)
     - Suporte a múltiplas sheets
   - `DocumentContent` é um dataclass:
     ```python
     @dataclass
     class DocumentContent:
         text: str               # texto completo
         tables: list[list[list]]  # lista de tabelas
         metadata: dict          # autor, data, etc.
         pages: int              # total de páginas (PDF) ou sheets (XLSX)
         file_path: str
         file_type: str          # pdf, docx, xlsx
         size_bytes: int
     ```

2. File: `backend/jarvis/tool_manager.py`
   - Em `_register_tools()` adicionar três tools:
     ```python
     "read_pdf": ToolDefinition(
         name="read_pdf",
         description="Read text and tables from a PDF file.",
         parameters={"type": "object", "properties": {
             "path": {"type": "string", "description": "Path to PDF file"},
             "start_page": {"type": "number", "description": "First page (1-indexed, default: 1)"},
             "end_page": {"type": "number", "description": "Last page (default: all)"},
         }, "required": ["path"]},
         risk=RiskLevel.SAFE,
         examples=["read_pdf path='report.pdf'", "read_pdf path='book.pdf' start_page=10 end_page=20"],
     ),
     "read_docx": ToolDefinition(
         name="read_docx",
         description="Read text and tables from a Word (.docx) file.",
         parameters={"type": "object", "properties": {
             "path": {"type": "string", "description": "Path to DOCX file"},
         }, "required": ["path"]},
         risk=RiskLevel.SAFE,
     ),
     "read_xlsx": ToolDefinition(
         name="read_xlsx",
         description="Read data from an Excel (.xlsx) spreadsheet.",
         parameters={"type": "object", "properties": {
             "path": {"type": "string", "description": "Path to XLSX file"},
             "sheet": {"type": "string", "description": "Sheet name (default: first sheet)"},
         }, "required": ["path"]},
         risk=RiskLevel.SAFE,
     ),
     ```
   - Adicionar handlers `_handle_read_pdf`, `_handle_read_docx`, `_handle_read_xlsx`
     - Cada handler resolve path, instancia `DocumentReader`, chama método correspondente
     - Converte `DocumentContent` para string markdown no `output` e dados brutos no `data`

3. File: `backend/pyproject.toml`
   - Adicionar: `PyMuPDF>=1.25,<2` (size: ~15MB, parsing PDF robusto com tabelas)
   - Adicionar: `python-docx>=1.1,<2` (size: ~2MB, leitura/escrita DOCX)
   - Adicionar: `openpyxl>=3.1,<4` (size: ~10MB, leitura/escrita XLSX)

### Riscos e Mitigações
- **PDF complexos**: PDFs escaneados (imagem) não terão texto extraível. Mitigação: detectar páginas sem texto e retornar aviso "Página X: sem texto extraível (possível imagem)".
- **Arquivos grandes**: PDFs de 1000+ páginas. Mitigação: default limit = 50 páginas, exigir start_page/end_page explícito para ranges maiores.
- **Codificação**: Documentos em português com acentos. Mitigação: garantir encoding UTF-8 em toda a pipeline, testar com CP1252.
- **Proteção**: PDFs com senha. Mitigação: capturar exceção `fitz.FileDataError` e retornar ToolResult com erro claro.

## Use Cases
1. **Extração de relatório financeiro**: Usuário envia PDF de balanço trimestral → extrai tabelas como markdown para o LLM analisar números
2. **Leitura de currículos**: Processar lote de DOCX de currículos → extrair texto para busca semântica via RAG
3. **Análise de planilha de vendas**: XLSX com vendas mensais → extrair dados + fórmulas para gerar sumário executivo

## Test Cases
1. [ ] `read_pdf` com PDF de texto simples → output contém texto esperado, `data["metadata"]` contém author/title, páginas corretas
2. [ ] `read_docx` com documento formatado (títulos, listas, tabelas) → tabelas extraídas como `list[list]`, formatação preservada nos parágrafos
3. [ ] `read_xlsx` com múltiplas sheets e `sheet="Sheet2"` → retorna apenas dados da sheet especificada, metadados presentes
4. [ ] Arquivo inexistente ou protegido → `success=False`, mensagem de erro clara sem traceback

## Critérios de Aceitação
- [ ] Instalar pdfplumber/PyMuPDF, python-docx, openpyxl
- [ ] Tool `read_pdf`: extrai texto e tabelas de PDF
- [ ] Tool `read_docx`: extrai texto de documentos Word
- [ ] Tool `read_xlsx`: extrai dados de planilhas Excel
- [ ] Suporte a documentos grandes (paginação)
- [ ] Extração de metadados (autor, data, etc.)

## Dependências
- [ ] — (independente)

## Fase
Fase 4 — Documentos

## Prioridade
Média

## Esforço Estimado
Pequeno
