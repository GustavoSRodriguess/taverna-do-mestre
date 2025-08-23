import { useState, useCallback, useMemo } from 'react';

export type ValidationRule<T = any> = {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
  message?: string;
};

export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

export type FormErrors<T> = {
  [K in keyof T]?: string;
};

interface UseFormValidationResult<T> {
  values: T;
  errors: FormErrors<T>;
  isValid: boolean;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (newValues: Partial<T>) => void;
  validateField: (field: keyof T) => boolean;
  validateAll: () => boolean;
  reset: () => void;
  clearErrors: () => void;
}

export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules<T>
): UseFormValidationResult<T> => {
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});

  const validateField = useCallback((field: keyof T): boolean => {
    const value = values[field];
    const rules = validationRules[field];
    
    if (!rules) return true;

    // Required validation
    if (rules.required && (value === null || value === undefined || value === '')) {
      setErrors(prev => ({
        ...prev,
        [field]: rules.message || `${String(field)} é obrigatório`
      }));
      return false;
    }

    // If field is empty and not required, skip other validations
    if (!rules.required && (value === null || value === undefined || value === '')) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      return true;
    }

    // Min/Max for numbers
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        setErrors(prev => ({
          ...prev,
          [field]: rules.message || `${String(field)} deve ser maior que ${rules.min}`
        }));
        return false;
      }
      
      if (rules.max !== undefined && value > rules.max) {
        setErrors(prev => ({
          ...prev,
          [field]: rules.message || `${String(field)} deve ser menor que ${rules.max}`
        }));
        return false;
      }
    }

    // MinLength/MaxLength for strings
    if (typeof value === 'string') {
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        setErrors(prev => ({
          ...prev,
          [field]: rules.message || `${String(field)} deve ter pelo menos ${rules.minLength} caracteres`
        }));
        return false;
      }
      
      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        setErrors(prev => ({
          ...prev,
          [field]: rules.message || `${String(field)} deve ter no máximo ${rules.maxLength} caracteres`
        }));
        return false;
      }
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      setErrors(prev => ({
        ...prev,
        [field]: rules.message || `${String(field)} tem formato inválido`
      }));
      return false;
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        setErrors(prev => ({
          ...prev,
          [field]: customError
        }));
        return false;
      }
    }

    // If all validations pass, remove error
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    
    return true;
  }, [values, validationRules]);

  const validateAll = useCallback((): boolean => {
    let isFormValid = true;
    
    Object.keys(validationRules).forEach(field => {
      const fieldValid = validateField(field as keyof T);
      if (!fieldValid) {
        isFormValid = false;
      }
    });
    
    return isFormValid;
  }, [validateField, validationRules]);

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValuesState(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Validate field on change (optional - can be debounced)
    setTimeout(() => validateField(field), 0);
  }, [validateField]);

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({
      ...prev,
      ...newValues
    }));
  }, []);

  const reset = useCallback(() => {
    setValuesState(initialValues);
    setErrors({});
  }, [initialValues]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    values,
    errors,
    isValid,
    setValue,
    setValues,
    validateField,
    validateAll,
    reset,
    clearErrors
  };
};

// Helper functions for common validation rules
export const createValidationRules = {
  required: (message?: string): ValidationRule => ({ 
    required: true, 
    message 
  }),
  
  minLength: (min: number, message?: string): ValidationRule => ({ 
    minLength: min, 
    message 
  }),
  
  maxLength: (max: number, message?: string): ValidationRule => ({ 
    maxLength: max, 
    message 
  }),
  
  range: (min: number, max: number, message?: string): ValidationRule => ({ 
    min, 
    max, 
    message 
  }),
  
  email: (message?: string): ValidationRule => ({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: message || 'Email inválido'
  }),
  
  custom: (validator: (value: any) => string | null): ValidationRule => ({
    custom: validator
  })
};