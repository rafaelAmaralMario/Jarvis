# Bug Fixes + Features Implementation Plan

**Goal:** Fix all reported bugs and implement requested features

**Architecture:** Backend Python (pywebview bridge) + Frontend React (Vite + TypeScript)

**Tech Stack:** Python 3.14, React 19, TypeScript, Vite, pywebview 5, Ollama

---

### Task 1: Fix ModelServerStatus — false positive when offline

**Fix:** Add ping check to `getModelServerStatus()` - don't rely solely on process detection, actually try to connect

**Files:**
- Modify: `backend/jarvis/bridge.py:1407-1460`
- Test: `backend/tests/test_bridge_integration.py` (add test)

**Changes:**
1. Add `OllamaClient.ping()` call inside `getModelServerStatus()`
2. Only return `running: true` if both process is detected AND ping succeeds
3. Return proper error message when ping fails

---

### Task 2: Fix chat stuck forever — sendMessage error handling

**Fix:** Add proper timeouts and error propagation in sendMessage flow

**Files:**
- Modify: `backend/jarvis/bridge.py:363-370`
- Modify: `backend/jarvis/orchestration_manager.py:189-201`
- Modify: `ui/src/hooks/use-jarvis.ts` (add sendMessage fallback)
- Modify: `ui/src/components/AiPanel.tsx` (better error display)

**Changes:**
1. Add timeout to `sendMessage` in bridge.py
2. Fix orchestration_manager.py to catch Ollama exceptions properly
3. Add `sendMessage` fallback in use-jarvis.ts
4. Show proper error in AiPanel when Ollama is down

---

### Task 3: Fix models not listing + Start Ollama button

**Fix:** Improve error messages, fix Start button command detection

**Files:**
- Modify: `backend/jarvis/bridge.py:1462-1478` (startModelServer)
- Modify: `ui/src/components/Settings/ModelsPanel.tsx` (better error display)
- Modify: `ui/src/components/StatusBar.tsx` (add server status)

**Changes:**
1. Fix `startModelServer()` command path detection on Windows
2. Add status polling with proper timeout
3. Show server status in StatusBar too

---

### Task 4: Fix file creation + right-click blocked

**Fix:** 
- Add `data-context-menu-enabled` to FileTree and EditorTabs
- Fix file creation to use inline input value instead of prompt()

**Files:**
- Modify: `ui/src/App.tsx:25-34` (context menu handler)
- Modify: `ui/src/components/Workspace/FileTree.tsx`
- Modify: `ui/src/components/Workspace/WorkspacePanel.tsx`
- Modify: `ui/src/components/Editor/EditorPanel.tsx`
- Modify: `ui/src/components/Editor/EditorTabs.tsx`

**Changes:**
1. Add `data-context-menu-enabled` attribute to FileTree container and Editor tabs
2. Fix FileTree's `onCreateFile` to pass the typed name instead of using prompt()
3. Remove duplicate prompt() calls

---

### Task 5: Populate General Settings

**Files:**
- Create: `ui/src/components/Settings/GeneralPanel.tsx`
- Modify: `ui/src/components/Settings/SettingsPage.tsx`

**Changes:**
1. Create GeneralPanel with: language selector, theme toggle (dark/light), font size, auto-save toggle, terminal font size, editor settings
2. Integrate into SettingsPage

---

### Task 6: Add AI-assisted creation buttons

**Files:**
- Modify: `ui/src/components/Settings/WorkflowsPanel.tsx`
- Modify: `ui/src/components/Settings/AgentsPanel.tsx`

**Changes:**
1. Add "Create with AI" button to Agents panel
2. Add "Create with AI" button to Workflows panel
3. Button opens dialog asking what to create, sends to AI model, creates result

---

### Task 7: Fix console errors

**Files:**
- Modify: `ui/index.html` (add favicon)
- Modify: `ui/src/components/Knowledge/NotePreview.tsx` (fix hydration)

**Changes:**
1. Add favicon link to index.html using an inline SVG favicon
2. Review and fix any hydration issues

---

### Task 8: Unify creation screens

**Files:**
- Create: `ui/src/components/CreateDialog.tsx`
- Modify: `ui/src/components/Knowledge/KnowledgePanel.tsx`
- Modify: `ui/src/components/Workspace/WorkspacePanel.tsx`
- Modify: `ui/src/App.tsx`

**Changes:**
1. Create a unified CreateDialog component that handles: Knowledge notes, Workspace files, Editor files
2. Integrate into activity bar or top toolbar
