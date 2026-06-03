# Recomendacoes de Automacao de Sistema — JARVIS

## 1. Visao Geral

O JARVIS deve ser capaz de automatizar **qualquer tarefa no computador do usuario** que um humano poderia fazer, incluindo:

- Navegar na web e interagir com sites
- Controlar aplicacoes desktop
- Executar comandos no terminal
- Manipular arquivos
- Preencher formularios e fazer login
- Realizar operacoes financeiras
- Executar scripts e provas online

---

## 2. Automacao Web (Playwright + Python)

### Stack Recomendada

| Tecnologia | Funcao | Gratis? |
|-----------|--------|---------|
| Playwright (Python) | Automacao de navegador completa | ✅ Sim |
| Playwright (JS) | Alternativa para integracao direta | ✅ Sim |
| Browser Tauri | Navegador embutido opcional | ✅ N/A |

### Capacidades

```python
# sidecar/api/browser.py
@router.post("/browser/navigate")
async def browser_navigate(url: str):
    """Navegar para URL."""
    page = await browser_context.new_page()
    await page.goto(url)
    return {"title": await page.title(), "url": page.url}

@router.post("/browser/fill")
async def browser_fill(selector: str, value: str):
    """Preencher campo de formulario."""
    await page.fill(selector, value)
    return {"success": True}

@router.post("/browser/click")
async def browser_click(selector: str):
    """Clicar em elemento."""
    await page.click(selector)
    return {"success": True}

@router.post("/browser/select")
async def browser_select(selector: str, value: str):
    """Selecionar opcao em dropdown."""
    await page.select_option(selector, value)
    return {"success": True}

@router.post("/browser/screenshot")
async def browser_screenshot():
    """Capturar screenshot da pagina atual."""
    screenshot = await page.screenshot(full_page=True)
    return Response(content=screenshot, media_type="image/png")

@router.post("/browser/get-text")
async def browser_get_text(selector: str):
    """Extrair texto de elemento."""
    text = await page.text_content(selector)
    return {"text": text}

@router.post("/browser/wait-and-click")
async def browser_wait_and_click(selector: str, timeout: int = 5000):
    """Esperar elemento aparecer e clicar."""
    await page.wait_for_selector(selector, timeout=timeout)
    await page.click(selector)
    return {"success": True}

@router.post("/browser/login")
async def browser_login(url: str, username_selector: str, password_selector: str,
                        submit_selector: str, username: str, password: str):
    """Fazer login automatico em site."""
    check_permission("browser-control")
    check_permission("secrets")  # Credenciais sao secrets
    
    await page.goto(url)
    await page.fill(username_selector, username)
    await page.fill(password_selector, password)
    await page.click(submit_selector)
    await page.wait_for_load_state("networkidle")
    
    return {"logged_in": True, "current_url": page.url}
```

### Casos de Uso

| Acao | Como Fazer | Complexidade |
|------|-----------|-------------|
| Login em site | Playwright fill + click | Baixa |
| Preencher formulario | Playwright fill + select | Media |
| Baixar arquivo | Playwright download event | Media |
| Fazer prova online | Navegar + preencher + enviar | Alta |
| Comprar acoes | Login + formulario de ordem + confirmar | Alta |
| Extrato bancario | Login + navegar + baixar PDF | Alta |
| Postar em redes sociais | Login + preencher + publicar | Media |

---

## 3. Automacao de Sistema (PyAutoGUI + Rust)

### Stack Recomendada

| Tecnologia | Funcao | Gratis? |
|-----------|--------|---------|
| PyAutoGUI (Python) | Controle de teclado/mouse multiplataforma | ✅ Sim |
| enigo (Rust) | Controle de teclado/mouse nativo | ✅ Sim |
| mss (Python) | Captura de tela rapida | ✅ Sim |
| pynput (Python) | Monitoramento de teclado/mouse | ✅ Sim |

### Capacidades

```python
# sidecar/api/system.py
import pyautogui
import mss

@router.post("/system/keypress")
async def system_keypress(key: str, modifiers: list[str] = []):
    """Pressionar tecla no sistema."""
    check_permission("keyboard-mouse")
    
    if "ctrl" in modifiers: pyautogui.keyDown("ctrl")
    if "alt" in modifiers: pyautogui.keyDown("alt")
    if "shift" in modifiers: pyautogui.keyDown("shift")
    
    pyautogui.press(key)
    
    if "ctrl" in modifiers: pyautogui.keyUp("ctrl")
    if "alt" in modifiers: pyautogui.keyUp("alt")
    if "shift" in modifiers: pyautogui.keyUp("shift")
    
    return {"success": True}

@router.post("/system/type-text")
async def system_type_text(text: str):
    """Digitar texto no sistema."""
    check_permission("keyboard-mouse")
    pyautogui.write(text, interval=0.01)  # 10ms entre caracteres
    return {"success": True}

@router.post("/system/click")
async def system_click(x: int, y: int, button: str = "left"):
    """Clicar em posicao da tela."""
    check_permission("keyboard-mouse")
    pyautogui.click(x, y, button=button)
    return {"success": True}

@router.post("/system/move-mouse")
async def system_move_mouse(x: int, y: int, duration: float = 0.5):
    """Mover mouse para posicao."""
    check_permission("keyboard-mouse")
    pyautogui.moveTo(x, y, duration=duration)
    return {"success": True}

@router.post("/system/screenshot")
async def system_screenshot():
    """Capturar screenshot da tela inteira."""
    check_permission("screen-capture")
    with mss.mss() as sct:
        screenshot = sct.shot(output="/tmp/screen.png")
    return Response(content=open(screenshot, "rb").read(), media_type="image/png")

@router.post("/system/get-windows")
async def system_get_windows():
    """Listar janelas abertas."""
    windows = []
    import pygetwindow as gw
    for win in gw.getWindows():
        windows.append({
            "title": win.title,
            "left": win.left,
            "top": win.top,
            "width": win.width,
            "height": win.height,
            "is_active": win.isActive,
        })
    return {"windows": windows}

@router.post("/system/focus-window")
async def system_focus_window(title: str):
    """Focar em janela pelo titulo."""
    check_permission("keyboard-mouse")
    import pygetwindow as gw
    win = gw.getWindowsWithTitle(title)[0]
    win.activate()
    return {"success": True}
```

---

## 4. Exemplo: Fluxo Completo de Automacao

### "Pesquise o preco da acao PETR4 e me mostre"

```
Usuario: "Pesquise o preco da acao PETR4 e me mostre"

1. Agente solicita permissao [browser-control]
2. Usuario autoriza "Permitir uma vez"
3. Python Sidecar: Playwright abre navegador
4. Python: Navega para https://www.google.com/finance
5. Python: Preenche "PETR4" no campo de busca
6. Python: Clica em buscar
7. Python: Extrai preco da pagina
8. Python: Fecha navegador
9. Retorna resultado: "PETR4: R$ 47,53 (+2,3%)"
10. Auditoria registra: browser-control, google.com, success
```

### "Baixe o PDF do relatorio no site do banco"

```
Usuario: "Baixe o PDF do relatorio no site do banco"

1. Agente solicita permissoes [browser-control, secrets, file-download]
2. Usuario autoriza
3. Python: Playwright abre navegador no modo stealth
4. Python: Navega para site do banco
5. Python: Preenche login (credenciais do keyring)
6. Python: Clica "Extratos"
7. Python: Seleciona periodo
8. Python: Clica "Baixar PDF"
9. Python: Aguarda download
10. Python: Salva em ~/Downloads/extrato_2026-06.pdf
11. Retorna: "PDF salvo em ~/Downloads/extrato_2026-06.pdf"
12. Notifica usuario com toast
```

### "Execute o script de teste e me mostre os resultados"

```
Usuario: "Execute npm run test e me mostre os resultados"

1. Agente solicita permissao [system-command]
2. Usuario autoriza
3. Rust: Executa "npm run test" via PTY
4. Rust: Captura stdout/stderr em tempo real
5. Frontend: Exibe saida no terminal (streaming)
6. Python: Analisa saida e extrai resultados
7. Retorna: "12 testes passaram, 2 falharam"
8. Agente sugere corrigir os 2 testes que falharam
```

---

## 5. Modo Stealth e Anti-Deteccao

Para sites que bloqueiam automacao, usar Playwright com patches:

```python
# sidecar/core/browser_stealth.py
async def create_stealth_browser():
    """Criar navegador com anti-deteccao."""
    from playwright.async_api import async_playwright
    
    p = await async_playwright().start()
    browser = await p.chromium.launch(
        headless=False,  # Navegador visivel para usuario acompanhar
        args=[
            "--disable-blink-features=AutomationControlled",
            "--disable-features=IsolateOrigins,site-per-process",
        ]
    )
    
    context = await browser.new_context(
        viewport={"width": 1280, "height": 720},
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...",
        locale="pt-BR",
        timezone_id="America/Sao_Paulo",
    )
    
    # Remover webdriver flag
    await context.add_init_script("""
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
    """)
    
    return browser, context
```

---

## 6. Permissoes Especificas de Automacao

| Permissao | Acoes que Permite | Risco |
|-----------|------------------|-------|
| browser-control | Navegar, clicar, preencher, extrair | 🔴 Alto |
| system-command | Executar any comando | 🔴 Critico |
| keyboard-mouse | Simular teclado/mouse | 🔴 Alto |
| screen-capture | Ver tudo na tela | 🔴 Critico |
| file-download | Salvar arquivos no sistema | 🟡 Medio |
| automation-web | Logar, fazer acoes em sites | 🔴 Alto |
| automation-finance | Comprar/vender, transferir | 🔴 Critico |

### Dialogo de Permissao para Automacao

```
┌──────────────────────────────────────────────────────────────┐
│  🤖 O agente "Assistente" quer:                              │
│                                                              │
│  📍 Navegar para google.com/finance                          │
│  📝 Pesquisar por "PETR4"                                    │
│  👆 Clicar no resultado                                       │
│                                                              │
│  Permissoes necessarias:                                      │
│  [🔴] browser-control                                         │
│                                                              │
│  [Permitir uma vez]  [Permitir sempre]  [Negar]  [Detalhes]  │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. Limites de Seguranca para Automacao

```typescript
const AUTOMATION_SAFETY_LIMITS = {
  maxStepsPerAutomation: 50,           // Max 50 passos por automacao
  maxDurationPerAutomation: 300000,    // 5 minutos
  requireConfirmationEvery: 10,        // Confirmar a cada 10 passos
  blockListedDomains: [                // Dominios bloqueados
    '*.gov.br',                        // Sites governamentais
    '*.mil.br',                        // Sites militares
    'localhost:*',                     // Acesso local (so com permisao extra)
  },
  financialFlagKeywords: [             // Palavras que disparam protecao financeira
    'comprar', 'vender', 'transferir', 'pagar',
    'investir', 'resgatar', 'emprestimo',
    'buy', 'sell', 'transfer', 'payment',
    'trade', 'invest', 'withdraw', 'deposit',
  ],
  destructiveCommands: [               // Comandos bloqueados
    'rm -rf', 'format', 'dd if=', 'mkfs',
    'shutdown', 'reboot', 'init 0',
  ],
};
```
