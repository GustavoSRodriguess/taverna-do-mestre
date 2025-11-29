import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ComponentDoc from './ComponentDoc';

vi.mock('../ui', async () => {
  const actual = await vi.importActual<typeof import('../ui')>('../ui');
  return {
    ...actual,
    Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Section: ({ title, children }: { title: string; children: React.ReactNode }) => (
      <section>
        <h2>{title}</h2>
        {children}
      </section>
    ),
  };
});

describe('ComponentDoc', () => {
  it('navigates tabs, toggles alert, opens modal and simulates loading', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    try {
      render(<ComponentDoc />);

      expect(screen.getAllByText('Badges').length).toBeGreaterThan(0);

      fireEvent.click(screen.getByText('Alerts'));
      expect(screen.getByText('Info Alert')).toBeInTheDocument();
      fireEvent.click(screen.getByText('×'));
      expect(screen.getByText('Mostrar Alerta')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Tooltips'));
      fireEvent.click(screen.getByText('Modals'));

      fireEvent.click(screen.getByText('Abrir Modal'));
      expect(screen.getByText('Exemplo de Modal')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Simular Loading'));
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
      await waitFor(
        () => expect(screen.queryByText('Carregando...')).not.toBeInTheDocument(),
        { timeout: 3000 }
      );
    } finally {
      alertSpy.mockRestore();
    }
  });
});
