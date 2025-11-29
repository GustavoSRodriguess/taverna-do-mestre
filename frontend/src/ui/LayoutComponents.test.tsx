import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Card from './Card';
import { Tooltip } from './Tooltip';
import { Modal, ModalConfirmFooter } from './Modal';
import Section from './Section';
import { NumberField } from './NumberField';
import { SelectField } from './SelectField';
import { RadioGroup } from './RadioGroup';
import { Tabs } from './Tabs';
import { Loading } from './Loading';
import IconLabel from './IconLabel';
import Footer from './Footer';
import { Bell } from 'lucide-react';

describe('UI components smoke tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Card with icon and button handler', () => {
    const onClick = vi.fn();
    render(
      <Card
        icon="🏰"
        title="Teste"
        description="Descricao"
        button={{ label: 'acao', onClick }}
      />
    );

    expect(screen.getByText('Teste')).toBeInTheDocument();
    fireEvent.click(screen.getByText('acao'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows and hides Tooltip on hover', () => {
    render(
      <Tooltip content="dica">
        <button>hover</button>
      </Tooltip>
    );

    const trigger = screen.getByText('hover');
    fireEvent.mouseEnter(trigger);
    expect(screen.getByText('dica')).toBeInTheDocument();

    fireEvent.mouseLeave(trigger);
    expect(screen.queryByText('dica')).not.toBeInTheDocument();
  });

  it('applies right position classes on Tooltip', () => {
    render(
      <Tooltip content="right-tip" position="right">
        <button>hover-right</button>
      </Tooltip>
    );

    const trigger = screen.getByText('hover-right');
    fireEvent.mouseEnter(trigger);
    const tooltip = screen.getByText('right-tip').parentElement!;
    expect(tooltip.className).toContain('left-full');
  });

  it('applies bottom position classes on Tooltip', () => {
    render(
      <Tooltip content="bottom-tip" position="bottom">
        <button>hover-bottom</button>
      </Tooltip>
    );

    fireEvent.mouseEnter(screen.getByText('hover-bottom'));
    const tooltip = screen.getByText('bottom-tip').parentElement!;
    expect(tooltip.className).toContain('top-full');
  });

  it('renders Modal when open and closes via overlay, close button and escape', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal isOpen onClose={onClose} title="Titulo">
        <p>conteudo</p>
      </Modal>
    );

    expect(screen.getByText('Titulo')).toBeInTheDocument();
    const overlay = container.querySelector('.absolute.inset-0') as HTMLElement;
    fireEvent.click(overlay);
    fireEvent.click(screen.getByText('×'));
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('calls confirm and cancel handlers in ModalConfirmFooter', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(<ModalConfirmFooter onConfirm={onConfirm} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('Cancelar'));
    fireEvent.click(screen.getByText('Confirmar'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('renders Section with children', () => {
    render(
      <Section title="Sessao">
        <span>conteudo</span>
      </Section>
    );

    expect(screen.getByText('Sessao')).toBeInTheDocument();
    expect(screen.getByText('conteudo')).toBeInTheDocument();
  });

  it('handles NumberField change', () => {
    const onChange = vi.fn();
    render(
      <NumberField label="Numero" value="1" onChange={onChange} min={0} max={10} />
    );

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '5' } });
    expect(onChange).toHaveBeenCalledWith('5');
  });

  it('handles SelectField options and change', () => {
    const onChange = vi.fn();
    render(
      <SelectField
        label="Select"
        value="a"
        onChange={onChange}
        options={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ]}
      />
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'b' } });
    expect(onChange).toHaveBeenCalledWith('b');
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('handles RadioGroup selection', () => {
    const onChange = vi.fn();
    render(
      <RadioGroup
        label="Opcao"
        value="1"
        onChange={onChange}
        options={[
          { id: 'r1', value: '1', label: 'Um' },
          { id: 'r2', value: '2', label: 'Dois' },
        ]}
      />
    );

    const optionTwo = screen.getByLabelText('Dois');
    fireEvent.click(optionTwo);
    expect(onChange).toHaveBeenCalledWith('2');
  });

  it('switches Tabs and calls onChange', () => {
    const onChange = vi.fn();
    render(
      <Tabs
        tabs={[
          { id: 'a', label: 'Tab A' },
          { id: 'b', label: 'Tab B' },
        ]}
        defaultTabId="a"
        onChange={onChange}
      />
    );

    const tabB = screen.getByText('Tab B');
    fireEvent.click(tabB);
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('renders Loading variants', () => {
    const { rerender } = render(<Loading text="Carregando" />);
    expect(screen.getByText('Carregando')).toBeInTheDocument();

    rerender(<Loading fullScreen text="Cheio" />);
    expect(screen.getByText('Cheio')).toBeInTheDocument();
    expect(screen.getByText('Cheio').parentElement).toHaveClass('fixed inset-0');
  });

  it('renders IconLabel with lucide icon and gap/size classes', () => {
    render(
      <IconLabel icon={Bell} iconSize={6} gap={3} iconClassName="text-purple-500">
        <span>Label</span>
      </IconLabel>
    );

    const wrapper = screen.getByText('Label').parentElement!;
    expect(wrapper.className).toContain('gap-3');
    const icon = wrapper.querySelector('svg');
    expect(icon).toBeTruthy();
    expect(icon?.getAttribute('class')).toContain('w-6');
    expect(icon?.getAttribute('class')).toContain('text-purple-500');
  });

  it('renders Footer links and newsletter form', () => {
    render(<Footer />);
    expect(screen.getByText('Sobre Nós')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Seu e-mail')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Assinar'));
  });
});
