import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EditorPanel } from '@/components/Editor/EditorPanel';

const mockTabs: { path: string; name: string; isDirty: boolean; language: string }[] = [];

const mockBridge = {
  editorGetOpenFiles: vi.fn().mockResolvedValue(mockTabs),
  editorDetectLanguage: vi.fn().mockResolvedValue('plaintext'),
  editorGetSettings: vi.fn().mockResolvedValue({}),
  listFiles: vi.fn().mockResolvedValue([]),
};

vi.mock('@/hooks/use-jarvis', () => ({
  useJarvis: () => mockBridge,
}));

describe('EditorPanel', () => {
  it('renders empty state', () => {
    render(<EditorPanel />);
    expect(screen.getByTitle(/quick open/i)).toBeInTheDocument();
  });

  it('renders toolbar', () => {
    render(<EditorPanel />);
    expect(screen.getByTitle(/settings/i)).toBeInTheDocument();
  });
});
