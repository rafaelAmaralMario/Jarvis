import { motion } from 'framer-motion';

interface StatusBarProps {
  moduleCount: number;
  modelName: string;
}

export function StatusBar({ moduleCount, modelName }: StatusBarProps) {
  return (
    <motion.footer
      initial={{ y: 24 }}
      animate={{ y: 0 }}
      className="h-6 bg-primary flex items-center px-4 text-xs text-primary-foreground"
    >
      <span className="font-medium">JARVIS v0.1</span>
      <span className="mx-3 opacity-50">|</span>
      <span>{moduleCount} módulos ativos</span>
      <span className="mx-3 opacity-50">|</span>
      <span>Modelo: {modelName}</span>
      <div className="flex-1" />
      <motion.span
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="flex items-center gap-1"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
        online
      </motion.span>
    </motion.footer>
  );
}
