import { motion } from 'framer-motion';
import type { ModelDetail, Specialty } from '@/types';
import { SPECIALTY_CONFIG } from '@/types';

interface ModelCardProps {
  model: ModelDetail;
  onStart: (name: string) => void;
  onStop: (name: string) => void;
  onSettings: (name: string) => void;
  index?: number;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 25 };

export function ModelCard({ model, onStart, onStop, onSettings, index = 0 }: ModelCardProps) {
  const specialty = SPECIALTY_CONFIG[model.specialty as Specialty] ?? SPECIALTY_CONFIG.general;
  const isRunning = model.status === 'running';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: index * 0.05 }}
      whileHover={{ y: -2, scale: 1.005 }}
      className={`group relative rounded-xl border p-4 flex items-center gap-4 cursor-default transition-colors ${
        isRunning
          ? 'bg-gradient-to-br from-card to-green-950/20 border-green-900/50'
          : 'bg-card border-border hover:border-border/80 hover:bg-accent/30'
      }`}
    >
      {isRunning && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/60 to-transparent animate-pulse" />
      )}

      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
        style={{ background: `${specialty.color}22` }}
      >
        {specialty.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate">{model.name}</span>
          <span
            className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full"
            style={{ background: `${specialty.color}33`, color: specialty.color }}
          >
            {specialty.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/60">{model.size}</span>
          <span className="text-border">•</span>
          <span className="truncate">{model.description || 'No description'}</span>
          <span className="text-border">•</span>
          <span>modified {model.modified}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-medium">
        <span className={`flex items-center gap-1.5 ${isRunning ? 'text-green-500' : 'text-muted-foreground'}`}>
          <span
            className={`w-2 h-2 rounded-full ${
              isRunning
                ? 'bg-green-500 shadow-sm shadow-green-500/60 animate-pulse'
                : 'bg-muted-foreground'
            }`}
          />
          {isRunning ? 'Running' : 'Stopped'}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => isRunning ? onStop(model.name) : onStart(model.name)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border transition-all ${
            isRunning
              ? 'bg-red-950/20 border-red-900/40 text-red-500 hover:bg-red-950/30 hover:shadow-sm hover:shadow-red-900/30'
              : 'bg-green-950/20 border-green-900/40 text-green-500 hover:bg-green-950/30 hover:shadow-sm hover:shadow-green-900/30'
          }`}
        >
          {isRunning ? '■' : '▶'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSettings(model.name)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm border border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all"
        >
          ⚙
        </motion.button>
      </div>
    </motion.div>
  );
}
