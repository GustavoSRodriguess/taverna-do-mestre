import React from 'react';

interface NumberFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    min?: number;
    max?: number;
    className?: string;
}

export const NumberField: React.FC<NumberFieldProps> = ({
    label,
    value,
    onChange,
    min,
    max,
    className = '',
}) => {
    return (
        <div className={className}>
            <label className="block text-indigo-200 mb-2">{label}</label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                min={min}
                max={max}
                className="w-full px-4 py-2 rounded bg-indigo-900 text-white border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
        </div>
    );
};