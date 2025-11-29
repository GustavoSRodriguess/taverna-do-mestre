import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useFormValidation, createValidationRules } from './useFormValidation';

type Form = { name: string; age: number; email: string };

const rules = {
  name: { required: true, minLength: 3 },
  age: { min: 18, max: 60 },
  email: { required: true, pattern: /@example\.com$/ },
} satisfies Record<keyof Form, any>;

describe('useFormValidation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('validates required and length rules and clears errors on success', () => {
    const requiredHook = renderHook(() => useFormValidation<Form>({ name: '', age: 0, email: '' }, rules));

    act(() => {
      expect(requiredHook.result.current.validateField('name')).toBe(false);
    });
    expect(requiredHook.result.current.errors.name).toContain('obrigatório');

    const lengthHook = renderHook(() => useFormValidation<Form>({ name: 'Al', age: 0, email: '' }, rules));
    act(() => {
      lengthHook.result.current.validateField('name');
    });
    expect(lengthHook.result.current.errors.name).toContain('pelo menos 3 caracteres');

    act(() => {
      lengthHook.result.current.setValues({ name: 'Alex' });
      lengthHook.result.current.validateField('name');
    });
    expect(lengthHook.result.current.validateField('name')).toBe(true);
  });

  it('validates numbers, pattern, custom and reset/clearErrors helpers', () => {
    const { result } = renderHook(() =>
      useFormValidation<Form>(
        { name: 'Ok', age: 10, email: 'bad@domain.com' },
        {
          ...rules,
          email: {
            ...rules.email,
            custom: value => (value.startsWith('admin') ? 'Email bloqueado' : null),
          },
        },
      ),
    );

    let valid = true;
    act(() => {
      valid = result.current.validateAll();
    });
    expect(valid).toBe(false);
    expect(result.current.errors.age).toContain('maior que 18');
    expect(result.current.errors.email).toContain('formato');

    act(() => {
      result.current.setValues({ age: 20, email: 'admin@example.com' });
      result.current.validateAll();
    });
    act(() => {
      valid = result.current.validateAll();
    });
    expect(valid).toBe(false);
    expect(result.current.errors.email).toBe('Email bloqueado');

    act(() => result.current.clearErrors());
    expect(result.current.errors.email).toBeUndefined();

    act(() => result.current.reset());
    expect(result.current.values).toEqual({ name: 'Ok', age: 10, email: 'bad@domain.com' });
  });
});

describe('createValidationRules helpers', () => {
  it('builds reusable rule objects', () => {
    expect(createValidationRules.required().required).toBe(true);
    expect(createValidationRules.minLength(2).minLength).toBe(2);
    expect(createValidationRules.maxLength(5).maxLength).toBe(5);
    expect(createValidationRules.range(1, 3).min).toBe(1);
    expect(createValidationRules.range(1, 3).max).toBe(3);
    expect(createValidationRules.email().pattern?.test('user@example.com')).toBe(true);

    const validator = vi.fn().mockReturnValue(null);
    expect(createValidationRules.custom(validator).custom).toBe(validator);
  });
});
