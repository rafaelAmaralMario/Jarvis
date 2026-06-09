import { motion } from 'framer-motion';
import type { Agent } from '@/types';

interface AgentCardProps {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  index?: number;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 25 };

export function AgentCard({ agent, onEdit, onDelete, onSetDefault, index = 0 }: AgentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className={`rounded-xl border p-5 transition-all ${
        agent.isDefault
          ? 'border-yellow-600/40 bg-yellow-950/5'
          : 'border-border bg-card hover:border-border/80 hover:bg-accent/30'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg bg-muted flex-shrink-0">
          {agent.specialty === 'code' ? '💻' : agent.specialty === 'reasoning' ? '🧠' : '🤖'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{agent.name}</h3>
            {agent.isDefault && (
              <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded-full">★ Default</span>
            )}
            {agent.isBuiltin && (
              <span className="text-[10px] font-medium text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full border border-purple-500/20">Nativo</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{agent.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
        <span><strong className="text-foreground/60">Model:</strong> {agent.model}</span>
        <span><strong className="text-foreground/60">Temp:</strong> {agent.temperature}</span>
        <span><strong className="text-foreground/60">Max tokens:</strong> {agent.maxTokens}</span>
        {agent.tools.length > 0 && (
          <span><strong className="text-foreground/60">Tools:</strong> {agent.tools.join(', ')}</span>
        )}
      </div>

      <div className="text-xs text-muted-foreground/70 bg-muted/50 px-3 py-2 rounded-lg italic border-l-2 border-border mb-4 line-clamp-2">
        &ldquo;{agent.systemPrompt.slice(0, 120)}{agent.systemPrompt.length > 120 ? '...' : ''}&rdquo;
      </div>

      <div className="flex gap-2">
        {!agent.isDefault && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSetDefault(agent.id)}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-accent/50 transition-colors"
          >
            ★ Set Default
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onEdit(agent)}
          className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-accent/50 transition-colors"
        >
          ✎ Edit
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onDelete(agent.id)}
          disabled={agent.isBuiltin}
          className="px-3 py-1.5 rounded-lg border border-red-900/40 text-xs font-medium text-red-500 hover:bg-red-950/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          title={agent.isBuiltin ? 'Agentes nativos não podem ser excluídos' : 'Excluir agente'}
        >
          🗑 Delete
        </motion.button>
      </div>
    </motion.div>
  );
}
