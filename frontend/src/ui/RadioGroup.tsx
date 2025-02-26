import React from 'react';

interface RadioOption {
  id: string;
  value: string;
  label: string;
}

interface RadioGroupProps {
  label: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  options,
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={className}>
      <label className="block text-indigo-200 mb-2">{label}</label>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.id} className="flex items-center">
            <input
              type="radio"
              id={option.id}
              name={label.replace(/\s+/g, '')}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="mr-2 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor={option.id} className="text-white">
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};