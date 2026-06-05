-- Migration 004: Models, Agents & Orchestration
-- Creates tables for AI model metadata, agent definitions, and orchestration config

CREATE TABLE IF NOT EXISTS model_metadata (
    model_name TEXT PRIMARY KEY,
    specialty TEXT NOT NULL DEFAULT 'general'
        CHECK (specialty IN ('chat', 'code', 'reasoning', 'embedding', 'vision', 'general')),
    notes TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#6b7280',
    icon TEXT NOT NULL DEFAULT '🤖',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    model TEXT NOT NULL,
    system_prompt TEXT NOT NULL DEFAULT '',
    temperature REAL NOT NULL DEFAULT 0.7
        CHECK (temperature >= 0.0 AND temperature <= 2.0),
    max_tokens INTEGER NOT NULL DEFAULT 2048
        CHECK (max_tokens > 0),
    specialty TEXT NOT NULL DEFAULT 'general',
    tools TEXT NOT NULL DEFAULT '[]',
    is_default INTEGER NOT NULL DEFAULT 0
        CHECK (is_default IN (0, 1)),
    can_orchestrate INTEGER NOT NULL DEFAULT 1
        CHECK (can_orchestrate IN (0, 1)),
    priority INTEGER NOT NULL DEFAULT 5
        CHECK (priority >= 0 AND priority <= 10),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS orchestration_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    enabled INTEGER NOT NULL DEFAULT 1
        CHECK (enabled IN (0, 1)),
    orchestrator_model TEXT NOT NULL DEFAULT '',
    critic_enabled INTEGER NOT NULL DEFAULT 1
        CHECK (critic_enabled IN (0, 1)),
    critic_temperature REAL NOT NULL DEFAULT 0.1
        CHECK (critic_temperature >= 0.0 AND critic_temperature <= 2.0),
    max_agents_per_query INTEGER NOT NULL DEFAULT 3
        CHECK (max_agents_per_query > 0),
    show_trace INTEGER NOT NULL DEFAULT 1
        CHECK (show_trace IN (0, 1)),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS agent_conversations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'New conversation',
    model TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS conversation_messages (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    conversation_id TEXT NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    agent_id TEXT REFERENCES agents(id),
    model TEXT,
    tokens_used INTEGER DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_agents_default ON agents(is_default) WHERE is_default = 1;
CREATE INDEX idx_agents_orchestrate ON agents(can_orchestrate) WHERE can_orchestrate = 1;
CREATE INDEX idx_conv_agent ON agent_conversations(agent_id);
CREATE INDEX idx_messages_conv ON conversation_messages(conversation_id, created_at);

-- Seed data: default orchestrator config
INSERT OR IGNORE INTO orchestration_config (id, enabled) VALUES (1, 1);

-- Seed data: default agents
INSERT OR IGNORE INTO agents (id, name, description, model, system_prompt, temperature, specialty, is_default, can_orchestrate) VALUES
('default-assistant',
 'Assistant Geral',
 'General purpose assistant for everyday tasks',
 'llama3.2:3b',
 'Você é o JARVIS, um assistente de IA útil, amigável e preciso. Responda em português brasileiro. Use markdown para formatar respostas. Seja conciso e direto.',
 0.7,
 'general',
 1,
 1);

INSERT OR IGNORE INTO agents (id, name, description, model, system_prompt, temperature, max_tokens, specialty, can_orchestrate, priority) VALUES
('code-expert',
 'Code Expert',
 'Senior software engineer for code review and architecture',
 'codellama:7b',
 'Você é um engenheiro de software sênior especializado em C++, arquitetura limpa e design patterns. Revise código, sugira melhorias, aponte bugs e explique conceitos complexos de forma clara. Seja técnico e preciso.',
 0.2,
 4096,
 'code',
 1,
 8);
