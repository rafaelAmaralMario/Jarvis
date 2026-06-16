# E2E Test Suite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Comprehensive Playwright E2E test suite that catches rendering bugs, bridge errors, and UI glitches in the Jarvis desktop app.

**Architecture:** Tests run against the Vite dev server (port 1420) with a mock bridge injected via `page.addInitScript()`. The mock simulates realistic backend responses for all ~100 bridge methods. Each spec covers one app view with full interactions — navigation, form input, error states, and edge cases.

**Tech Stack:** Playwright 1.52+, React 19, Vitest, pywebview (not needed for tests)

**Known bugs to catch:**
- KnowledgePanel `<button>` nested in `<button>` (hydration error)
- Chat error `"tool"` filter dead code (AiPanel.tsx:1008)
- Flashing prompt window (AnimatePresence / dialog timing)
- Chat returning error on sendMessage

---
