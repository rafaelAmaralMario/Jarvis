import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useJarvis } from '@/hooks/use-jarvis';
import type { ModelServerStatus } from '@/types';

interface StatusBarProps {
  moduleCount: number;
  modelName: string;
}

export function StatusBar({ moduleCount, modelName }: StatusBarProps) {
  const bridge = useJarvis();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');
  const [serverStatus, setServerStatus] = useState<ModelServerStatus | null>(null);

  useEffect(() => {
    bridge.getAppVersion().then(() => {
      bridge.checkForUpdates().then(result => {
        if (result.update_available) {
          setUpdateAvailable(true);
          setLatestVersion(result.latest_version);
        }
      });
    });
  }, [bridge]);

  useEffect(() => {
    const check = async () => {
      try {
        const status = await bridge.getModelServerStatus();
        setServerStatus(status);
      } catch {}
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, [bridge]);

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
      {updateAvailable && (
        <motion.a
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          href="#"
          onClick={e => { e.preventDefault(); window.location.hash = '#settings/updates'; }}
          className="flex items-center gap-1.5 mr-3 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          v{latestVersion} disponível
        </motion.a>
      )}
      <span className="flex items-center gap-1.5 mr-2">
        <span className={`w-1.5 h-1.5 rounded-full ${serverStatus?.running ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
        <span className={serverStatus?.running ? 'text-green-200' : 'text-red-200'}>
          Ollama {serverStatus?.running ? 'on' : 'off'}
        </span>
      </span>
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
