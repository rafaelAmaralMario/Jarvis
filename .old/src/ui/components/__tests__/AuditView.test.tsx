import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuditView } from '../AuditView';

describe('AuditView', () => {
  it('should render without crashing', () => {
    const { container } = render(<AuditView auditEvents={[]} />);
    expect(container.querySelector('.bottom-content')).toBeInTheDocument();
  });

  it('should render audit event rows', () => {
    const events = [
      { id: '1', timestamp: '2024-01-01 10:00', actor: 'user', permission: 'git.commit', target: 'workspace', result: 'success' },
    ];
    render(<AuditView auditEvents={events} />);
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('2024-01-01 10:00')).toBeInTheDocument();
    expect(screen.getByText(/git.commit/)).toBeInTheDocument();
  });

  it('should render multiple events', () => {
    const events = [
      { id: '1', timestamp: '10:00', actor: 'user', permission: 'read', target: 'file.ts', result: 'ok' },
      { id: '2', timestamp: '10:01', actor: 'agent', permission: 'write', target: 'file.ts', result: 'ok' },
    ];
    render(<AuditView auditEvents={events} />);
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('agent')).toBeInTheDocument();
  });
});
