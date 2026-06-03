import { useState, useCallback, useRef, useEffect } from 'react';
import { useJarvis, useBridgeEvent } from '@/hooks/use-jarvis';
import { TerminalInstance } from './TerminalInstance';

interface TabData {
  id: string;
  label: string;
  buffer: string;
}

export function TerminalPanel() {
  const bridge = useJarvis();
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const bufferRef = useRef<Map<string, string>>(new Map());
  const terminalRefs = useRef<Map<string, (data: string) => void>>(new Map());

  const ensureTerminal = useCallback(async () => {
    if (tabs.length === 0) {
      const id = await bridge.terminalCreate();
      if (id) {
        const newTab: TabData = { id, label: 'terminal', buffer: '' };
        setTabs([newTab]);
        setActiveTab(id);
      }
    }
  }, [bridge, tabs.length]);

  useEffect(() => {
    ensureTerminal();
  }, [ensureTerminal]);

  const addTab = useCallback(async () => {
    const id = await bridge.terminalCreate();
    if (id) {
      const count = tabs.length + 1;
      const newTab: TabData = { id, label: `terminal ${count}`, buffer: '' };
      setTabs(prev => [...prev, newTab]);
      setActiveTab(id);
    }
  }, [bridge, tabs.length]);

  const closeTab = useCallback(async (id: string) => {
    await bridge.terminalClose(id);
    setTabs(prev => {
      const next = prev.filter(t => t.id !== id);
      if (next.length === 0) return next;
      if (activeTab === id) {
        const idx = prev.findIndex(t => t.id === id);
        const newIdx = Math.min(idx, next.length - 1);
        setActiveTab(next[newIdx].id);
      }
      return next;
    });
  }, [bridge, activeTab]);

  const handleData = useCallback((id: string, data: string) => {
    bridge.terminalWrite(id, data);
  }, [bridge]);

  const handleResize = useCallback((id: string, cols: number, rows: number) => {
    bridge.terminalResize(id, cols, rows);
  }, [bridge]);

  useBridgeEvent<{ id: string; data: string }>('terminal-output', useCallback(({ id, data }) => {
    const writer = terminalRefs.current.get(id);
    if (writer) {
      writer(data);
    } else {
      const prev = bufferRef.current.get(id) || '';
      bufferRef.current.set(id, prev + data);
    }
  }, []));

  useBridgeEvent<{ id: string; exitCode: number }>('terminal-exit', useCallback(({ id, exitCode }) => {
    const writer = terminalRefs.current.get(id);
    if (writer) {
      writer(`\r\n\x1b[31m[process exited with code ${exitCode}]\x1b[0m\r\n`);
    }
    setTabs(prev => prev.map(t =>
      t.id === id ? { ...t, label: `${t.label} (exited)` } : t
    ));
  }, []));

  const handleTerminalReady = useCallback((id: string, write: (data: string) => void) => {
    terminalRefs.current.set(id, write);
    const buffered = bufferRef.current.get(id);
    if (buffered) {
      write(buffered);
      bufferRef.current.delete(id);
    }
  }, []);

  if (tabs.length === 0) return null;

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      <div className="flex items-center px-2 py-0.5 border-b border-[#333] bg-[#252526] shrink-0 gap-0.5">
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            onMouseDown={(e) => {
              if (e.button === 1) closeTab(tab.id);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs cursor-pointer border-r border-[#333] select-none ${
              tab.id === activeTab
                ? 'bg-[#1e1e1e] text-[#ccc] border-t-[1.5px] border-t-[#007acc]'
                : 'text-[#999] hover:text-[#ccc] hover:bg-[#2a2a2a]'
            }`}
          >
            <span>{tab.label}</span>
            <button
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
              className="text-[10px] leading-none px-0.5 rounded hover:bg-[#ffffff1a] text-[#666] hover:text-[#ccc]"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={addTab}
          className="px-1.5 py-0.5 text-xs text-[#999] hover:text-[#ccc] hover:bg-[#2a2a2a] rounded ml-1"
          title="New Terminal"
        >
          +
        </button>
      </div>
      <div className="flex-1 relative">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`absolute inset-0 ${tab.id === activeTab ? '' : 'hidden'}`}
          >
            <TerminalInstance
              terminalId={tab.id}
              onData={(data) => handleData(tab.id, data)}
              onResize={(cols, rows) => handleResize(tab.id, cols, rows)}
              onReady={(write) => handleTerminalReady(tab.id, write)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
