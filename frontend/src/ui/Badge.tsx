import React from 'react';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
    text: string;
    variant?: BadgeVariant;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    text,
    variant = 'primary',
    className = ''
}) => {
    const variantClasses = {
        primary: 'bg-purple-600 text-white',
        success: 'bg-green-600 text-white',
        warning: 'bg-yellow-500 text-black',
        danger: 'bg-red-600 text-white',
        info: 'bg-blue-600 text-white'
    };

    return (
        <span
            className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${variantClasses[variant]} ${className}`}
        >
            {text}
        </span>
    );
};

export default Badge;