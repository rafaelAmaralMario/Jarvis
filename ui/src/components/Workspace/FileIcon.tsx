import type { FileEntry } from '@/types';

const ICONS: Record<string, string> = {
  ts: '#3178C6', tsx: '#3178C6', js: '#F7DF1E', jsx: '#F7DF1E',
  mjs: '#F7DF1E', cjs: '#F7DF1E',
  py: '#3572A5', rs: '#DEA584', go: '#00ADD8', java: '#B07219',
  rb: '#CC342D', php: '#4F5D95', r: '#198CE7', scala: '#C22D40',
  swift: '#F05138', kotlin: '#7F52FF', dart: '#00B4AB',
  cpp: '#00599C', c: '#A8B9CC', h: '#A8B9CC', hpp: '#00599C',
  cs: '#178600',
  html: '#E34F26', css: '#1572B6', scss: '#CC6694', less: '#1D365D',
  json: '#8BC34A', xml: '#FF6600', yaml: '#6B8E23', yml: '#6B8E23',
  md: '#083FA1', sql: '#E38C00', sh: '#4EAA25', bash: '#4EAA25',
  dockerfile: '#2496ED', tf: '#844FBA',
  toml: '#9C4221', ini: '#0050A0', cfg: '#0050A0',
  lock: '#E74C3C', gitignore: '#F05032',
  env: '#FFA000', env_example: '#FFA000',
  svg: '#FFB13B', ico: '#FFB13B',
  png: '#4FC3F7', jpg: '#4FC3F7', jpeg: '#4FC3F7', gif: '#AB47BC', webp: '#4FC3F7',
  pdf: '#E53935', doc: '#295B99', docx: '#295B99',
  xls: '#1F724C', xlsx: '#1F724C', csv: '#1F724C',
  mp3: '#FF5722', wav: '#FF5722', ogg: '#FF5722',
  mp4: '#9C27B0', mov: '#9C27B0', avi: '#9C27B0',
  zip: '#795548', tar: '#795548', gz: '#795548', rar: '#795548', '7z': '#795548',
};

function getExt(name: string): string {
  const parts = name.split('.');
  if (parts.length < 2) return '';
  if (name === '.env.example') return 'env_example';
  if (name.startsWith('.env')) return 'env';
  if (name === '.gitignore') return 'gitignore';
  if (name === 'Dockerfile' || name.endsWith('.dockerfile')) return 'dockerfile';
  return parts[parts.length - 1].toLowerCase();
}

function FolderIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      {expanded ? (
        <path d="M2 3.5A1.5 1.5 0 013.5 2h2.879a1.5 1.5 0 011.06.44l1.122 1.12H13.5A1.5 1.5 0 0115 5.06v6.44a1.5 1.5 0 01-1.5 1.5h-10A1.5 1.5 0 012 11.5V3.5z" fill="#42A5F5" />
      ) : (
        <path d="M1.5 3.5A1.5 1.5 0 013 2h3.379a1.5 1.5 0 011.06.44l1.122 1.12H13A1.5 1.5 0 0114.5 5v7.5A1.5 1.5 0 0113 14H3a1.5 1.5 0 01-1.5-1.5V3.5z" fill="#FFA726" />
      )}
    </svg>
  );
}

function FileSvg({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <path d="M3 1.5A1.5 1.5 0 004.5 3h7A1.5 1.5 0 0013 1.5" fill={color} />
      <path d="M3 1.5A1.5 1.5 0 014.5 0h5.879a1.5 1.5 0 011.06.44l1.122 1.12H13a1.5 1.5 0 011.5 1.5V13a1.5 1.5 0 01-1.5 1.5H3A1.5 1.5 0 011.5 13V3A1.5 1.5 0 013 1.5z" fill={color} fillOpacity="0.25" />
      <path d="M1.5 3A1.5 1.5 0 013 1.5h5.879a1.5 1.5 0 011.06.44l1.122 1.12H13A1.5 1.5 0 0114.5 4.5V13a1.5 1.5 0 01-1.5 1.5H3A1.5 1.5 0 011.5 13V3z" fill={color} fillOpacity="0.4" />
      <path d="M3 1.5A1.5 1.5 0 004.5 3h7A1.5 1.5 0 0013 1.5" fill={color} fillOpacity="0.7" />
    </svg>
  );
}

export function FileIcon({ entry }: { entry: FileEntry }) {
  if (entry.isDirectory) {
    return <FolderIcon expanded={false} />;
  }

  const ext = getExt(entry.name);
  const color = ICONS[ext] || '#8B8B8B';

  if (ext === 'ts' || ext === 'tsx') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
        <rect width="16" height="16" rx="2" fill="#3178C6" />
        <text x="3" y="12" fontSize="9" fontWeight="bold" fill="white">TS</text>
      </svg>
    );
  }
  if (ext === 'js' || ext === 'jsx' || ext === 'mjs' || ext === 'cjs') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
        <rect width="16" height="16" rx="2" fill="#F7DF1E" />
        <text x="4" y="12" fontSize="9" fontWeight="bold" fill="black">JS</text>
      </svg>
    );
  }
  if (ext === 'py') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
        <rect width="16" height="16" rx="2" fill="#3572A5" />
        <path d="M8 2c-2.2 0-3.5.4-3.5 1.5v1h3.5v.5H4.5C3.4 5 2 4.3 2 3V2.5C2 1.4 3.4 1 4.5 1h7C12.6 1 14 1.4 14 2.5v1c0 1.1-1.4 1.5-2.5 1.5H8v-.5h3.5v-1C11.5 2.4 10.2 2 8 2z" fill="#FFD43B" />
        <path d="M8 14c2.2 0 3.5-.4 3.5-1.5v-1H8v-.5h3.5c1.1 0 2.5.7 2.5 2v.5c0 1.1-1.4 1.5-2.5 1.5h-7C3.4 15 2 14.6 2 13.5v-1C2 11.4 3.4 11 4.5 11H8v.5H4.5v1C4.5 13.6 5.8 14 8 14z" fill="#FFD43B" />
      </svg>
    );
  }
  if (ext === 'rs') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
        <rect width="16" height="16" rx="2" fill="#DEA584" />
        <path d="M8 3l4 2.5v5L8 13l-4-2.5v-5L8 3z" fill="white" fillOpacity="0.8" />
      </svg>
    );
  }
  if (ext === 'html') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
        <rect width="16" height="16" rx="2" fill="#E34F26" />
        <text x="2" y="12" fontSize="8" fontWeight="bold" fill="white">H</text>
      </svg>
    );
  }
  if (ext === 'md') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
        <rect width="16" height="16" rx="2" fill="#083FA1" />
        <text x="2" y="12" fontSize="9" fontWeight="bold" fill="white">M</text>
      </svg>
    );
  }
  if (ext === 'json') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
        <rect width="16" height="16" rx="2" fill="#8BC34A" />
        <text x="2" y="12" fontSize="8" fontWeight="bold" fill="white">{ }</text>
      </svg>
    );
  }
  if (ext === 'css') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
        <rect width="16" height="16" rx="2" fill="#1572B6" />
        <text x="2" y="12" fontSize="8" fontWeight="bold" fill="white">#</text>
      </svg>
    );
  }
  if (ext === 'scss') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
        <rect width="16" height="16" rx="2" fill="#CC6694" />
        <text x="2" y="12" fontSize="8" fontWeight="bold" fill="white">$</text>
      </svg>
    );
  }
  if (ext === 'pdf') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
        <rect width="16" height="16" rx="2" fill="#E53935" />
        <text x="3" y="12" fontSize="8" fontWeight="bold" fill="white">PDF</text>
      </svg>
    );
  }
  if (ext === 'svg') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
        <rect width="16" height="16" rx="2" fill="#FFB13B" />
        <path d="M8 4l2 3h-4l2-3zM8 12l-2-3h4l-2 3zM4 8l3-2v4l-3-2zM12 8l-3-2v4l3-2z" fill="white" fillOpacity="0.7" />
      </svg>
    );
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico'].includes(ext)) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
        <rect width="16" height="16" rx="2" fill="#4FC3F7" />
        <circle cx="5" cy="5" r="1.5" fill="white" fillOpacity="0.7" />
        <path d="M2 10l3-3 2 2 2-2 3 3v2H2v-2z" fill="white" fillOpacity="0.7" />
      </svg>
    );
  }
  if (['sql', 'db'].includes(ext)) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
        <rect width="16" height="16" rx="2" fill="#E38C00" />
        <path d="M3 4c0-.6.7-1 2-1s2 .4 2 1v1c0 .6-.7 1-2 1s-2-.4-2-1V4z" fill="white" fillOpacity="0.5" />
        <path d="M3 7c0-.6.7-1 2-1s2 .4 2 1v1c0 .6-.7 1-2 1s-2-.4-2-1V7z" fill="white" fillOpacity="0.5" />
        <path d="M3 10c0-.6.7-1 2-1s2 .4 2 1v1c0 .6-.7 1-2 1s-2-.4-2-1v-1z" fill="white" fillOpacity="0.5" />
        <path d="M7 5c0-.6.7-1 2-1s2 .4 2 1v1c0 .6-.7 1-2 1s-2-.4-2-1V5z" fill="white" fillOpacity="0.5" />
        <path d="M7 8c0-.6.7-1 2-1s2 .4 2 1v1c0 .6-.7 1-2 1s-2-.4-2-1V8z" fill="white" fillOpacity="0.5" />
      </svg>
    );
  }

  return <FileSvg color={color} />;
}
