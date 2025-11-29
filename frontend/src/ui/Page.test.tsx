import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Page } from './Page';

vi.mock('./Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header-mock" />,
}));

describe('Page', () => {
  afterEach(() => {
    cleanup();
    document.getElementById('cosmic-stars')?.remove();
  });

  it('applies theme classes and renders children', () => {
    render(
      <Page theme="enchanted">
        <span>conteudo</span>
      </Page>
    );

    expect(screen.getByText('conteudo')).toBeInTheDocument();
    const themedContainer = document.querySelector('.bg-gradient-to-b');
    expect(themedContainer?.className).toContain('from-emerald-950');
  });

  it('creates and cleans up star container', () => {
    const { unmount } = render(
      <Page>
        <span>primeiro</span>
      </Page>
    );

    expect(document.getElementById('cosmic-stars')).toBeInTheDocument();
    unmount();
    expect(document.getElementById('cosmic-stars')).toBeNull();
  });
});
