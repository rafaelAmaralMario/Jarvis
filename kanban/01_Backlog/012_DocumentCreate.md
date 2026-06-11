# Criação de Documentos (DOCX, PDF, XLSX)

## Descrição
Criar tools para geração de documentos formatados: `create_docx` (relatórios Word com formatação), `create_pdf` (PDFs com ReportLab), `create_xlsx` (planilhas Excel com dados e fórmulas). Output baixável.

## Análise Técnica

### Arquitetura

```
Agent/ToolCall → ToolManager._handle_create_docx(args)
  → DocumentGeneratorService (novo: document_generator.py)
    → python-docx: Document() → add heading, paragraph, table, image → save
  → ToolResult com path + bytes + metadados
  → Frontend: URL para download (file:// ou bridge)

Agent/ToolCall → ToolManager._handle_create_pdf(args)
  → DocumentGenerator._create_pdf()
    → ReportLab: Canvas() ou SimpleDocTemplate → text, table, image → save

Agent/ToolCall → ToolManager._handle_create_xlsx(args)
  → DocumentGenerator._create_xlsx()
    → openpyxl: Workbook() → sheet.cell(), chart, formula → save
```

Reutiliza `python-docx` e `openpyxl` instalados pelo Card 011. Adiciona `reportlab` para PDF. Novo módulo `backend/jarvis/document_generator.py` com classe `DocumentGenerator`.

### Implementação Detalhada

1. File: `backend/jarvis/document_generator.py` — classe `DocumentGenerator`
   - `_create_docx(path, content_dict) → str (path)`
     - `content_dict` schema: `{"title": "...", "sections": [{"heading": "...", "level": 1, "content": "...", "type": "paragraph|table|image", "data": ...}]}`
     - Usa `python-docx`: `Document()` → `doc.add_heading(text, level=level)` → `doc.add_paragraph(text)` para texto → `doc.add_table(rows, cols)` para tabelas
     - Inline styling: bold, italic, code blocks via `run.bold = True`, `run.italic = True`, font monospace
     - Salva em `workspace/output/` com timestamp
   - `_create_pdf(path, content_dict) → str (path)`
     - Usa `reportlab`: `SimpleDocTemplate(path, pagesize=A4)`
     - `ParagraphStyle` para títulos (Heading1-3), corpo, código, listas
     - `TableStyle` para tabelas com grid
     - Flowables: Paragraph, Table, Image (se caminho fornecido), Spacer
     - Registra fontes TTF padrão do sistema para suporte a acentos
   - `_create_xlsx(path, content_dict) → str (path)`
     - Usa `openpyxl`: `Workbook()` → ativa sheet
     - `content_dict` schema: `{"sheets": [{"name": "...", "headers": [...], "rows": [[...]], "formulas": {"A10": "=SUM(A2:A9)"}, "chart": {...}}]}`
     - `cell.value` para dados, `cell.number_format` para formatação (moeda, data, porcentagem)
     - Fórmulas: célula com string iniciando `=`
     - Opcional: `openpyxl.chart.BarChart` para gráficos simples

2. File: `backend/jarvis/tool_manager.py`
   - Em `_register_tools()` adicionar três tools:
     ```python
     "create_docx": ToolDefinition(
         name="create_docx",
         description="Create a formatted Word document (.docx).",
         parameters={"type": "object", "properties": {
             "path": {"type": "string", "description": "Output file path"},
             "title": {"type": "string", "description": "Document title"},
             "sections": {"type": "array", "items": {"type": "object"}, "description": "List of sections, each with heading, content, type"},
         }, "required": ["path", "sections"]},
         risk=RiskLevel.ASK,
     ),
     "create_pdf": ToolDefinition(
         name="create_pdf",
         description="Create a PDF document with formatted text and tables.",
         parameters={"type": "object", "properties": {
             "path": {"type": "string", "description": "Output file path"},
             "sections": {"type": "array", "items": {"type": "object"}, "description": "List of content sections"},
         }, "required": ["path", "sections"]},
         risk=RiskLevel.ASK,
     ),
     "create_xlsx": ToolDefinition(
         name="create_xlsx",
         description="Create an Excel spreadsheet with data and formulas.",
         parameters={"type": "object", "properties": {
             "path": {"type": "string", "description": "Output file path"},
             "sheets": {"type": "array", "items": {"type": "object"}, "description": "List of sheets with headers, rows, formulas"},
         }, "required": ["path", "sheets"]},
         risk=RiskLevel.ASK,
     ),
     ```
   - Handlers: `_handle_create_docx`, `_handle_create_pdf`, `_handle_create_xlsx`
     - Instanciam `DocumentGenerator`, chamam método, retornam `ToolResult(success=True, output=f"Documento criado: {path}", data={"path": path, "size_bytes": size})`
     - Validar tipos de parâmetros antes de passar ao generator (JSON schema do frontend já valida, mas dupla checagem)

3. File: `backend/pyproject.toml`
   - Adicionar: `reportlab>=4.3,<5` (size: ~5MB, PDF generation engine)

### Riscos e Mitigações
- **Fontes PDF**: reportlab precisa de fontes TrueType para acentos/português. Mitigação: incluir fallback para fontes built-in (Helvetica) e detectar `reportlab.pdfbase.ttfonts.TTFont` para fontes do sistema.
- **Documentos complexos**: Tabelas com merge de células no DOCX. Mitigação: começar com estruturas simples, adicionar suporte a merge `doc.add_table().cell(row, col).merge()` em versão 2.
- **Imagens**: Inserir imagem em DOCX/PDF. Mitigação: suportar path local ou base64 no content_dict, usando `doc.add_picture()` e reportlab `Image()`.
- **Tamanho**: XLSX com 10k+ linhas. Mitigação: usar `openpyxl` write-only mode (`WriteOnly Workbook`) para dados grandes.

## Use Cases
1. **Relatório executivo automatizado**: LLM analisa dados e gera relatório .docx com título, seções, tabelas e formatação profissional
2. **Nota fiscal / recibo em PDF**: Gerar PDF formatado com logotipo, valores em tabela, e dados do cliente
3. **Planilha de orçamento**: Criar .xlsx com categorias, valores, `=SUM()` nas células de total, formatação moeda

## Test Cases
1. [ ] `create_docx` com sections=[{heading:"Resumo", content:"Texto", type:"paragraph"}] → arquivo .docx criado, texto legível ao abrir no Word, metadados de tamanho > 0
2. [ ] `create_pdf` com tabela 3x3 → PDF gerado, tabela visível, acentos preservados (verificar "ç", "ã")
3. [ ] `create_xlsx` com fórmula `=SUM(A1:A5)` → arquivo gerado, célula com fórmula preservada, ao abrir no Excel o valor calcula corretamente
4. [ ] Path inválido ou permissão negada → `success=False`, erro descritivo

## Critérios de Aceitação
- [ ] Tool `create_docx`: texto → arquivo .docx formatado
- [ ] Tool `create_pdf`: texto + layout → arquivo .pdf
- [ ] Tool `create_xlsx`: dados → arquivo .xlsx com fórmulas
- [ ] Suporte a formatação (títulos, listas, tabelas, imagens)
- [ ] Download do documento gerado

## Dependências
- [ ] 011_DocumentRead (bibliotecas compartilhadas)

## Fase
Fase 4 — Documentos

## Prioridade
Média

## Esforço Estimado
Médio
