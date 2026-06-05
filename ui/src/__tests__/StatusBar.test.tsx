import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from '@/components/StatusBar';

describe('StatusBar', () => {
  it('renders version', () => {
    render(<StatusBar moduleCount={5} modelName="llama3.2:3b" />);
    expect(screen.getByText(/v0\.1/i)).toBeInTheDocument();
  });

  it('shows module count', () => {
    render(<StatusBar moduleCount={5} modelName="llama3.2:3b" />);
    expect(screen.getByText(/5 módulos ativos/i)).toBeInTheDocument();
  });

  it('shows model name', () => {
    render(<StatusBar moduleCount={5} modelName="codellama:7b" />);
    expect(screen.getByText(/codellama:7b/i)).toBeInTheDocument();
  });

  it('shows online indicator', () => {
    render(<StatusBar moduleCount={0} modelName="none" />);
    expect(screen.getByText(/online/i)).toBeInTheDocument();
  });
});
