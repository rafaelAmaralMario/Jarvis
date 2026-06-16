import { useState } from 'react';
import { TerminalPanel } from '@/components/Terminal/TerminalPanel';
import { OutputPanel } from './OutputPanel';
import { MCPBottomPanel } from './MCPBottomPanel';
import { ProblemsPanel } from './ProblemsPanel';

type TabId = 'terminal' | 'output' | 'mcp' | 'problems';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { id: 'terminal', label: 'Terminal', icon: '>' },
  { id: 'output', label: 'Output', icon: '□' },
  { id: 'mcp', label: 'MCP Servers', icon: '🔌' },
  { id: 'problems', label: 'Problems', icon: '✕' },
];

export function BottomPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('terminal');

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center bg-[#252526] border-b border-[#333] shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border-r border-[#333] cursor-pointer select-none ${
              tab.id === activeTab
                ? 'bg-[#1e1e1e] text-[#ccc] border-t-[1.5px] border-t-[#007acc]'
                : 'text-[#999] hover:text-[#ccc] hover:bg-[#2a2a2a]'
            }`}
          >
            <span className="text-[11px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === 'terminal' && <TerminalPanel />}
        {activeTab === 'output' && <OutputPanel />}
        {activeTab === 'mcp' && <MCPBottomPanel />}
        {activeTab === 'problems' && <ProblemsPanel />}
      </div>
    </div>
  );
}
