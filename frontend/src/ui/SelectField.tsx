import React from 'react';

interface Option {
    value: string;
    label: string;
}

interface SelectFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    className?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
    label,
    value,
    onChange,
    options,
    className = '',
}) => {
    return (
        <div className={className}>
            <label className="block text-indigo-200 mb-2">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-2 rounded bg-indigo-900 text-white border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};