import React from 'react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
    title?: string;
    message: string;
    variant?: AlertVariant;
    className?: string;
    onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
    title,
    message,
    variant = 'info',
    className = '',
    onClose
}) => {
    const variantClasses = {
        info: 'bg-indigo-900/60 border-indigo-600 text-indigo-200',
        success: 'bg-green-900/60 border-green-600 text-green-200',
        warning: 'bg-yellow-900/60 border-yellow-500 text-yellow-200',
        error: 'bg-red-900/60 border-red-600 text-red-200'
    };

    const iconMap = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
    };

    return (
        <div className={`p-4 mb-4 border-l-4 rounded ${variantClasses[variant]} ${className}`}>
            <div className="flex justify-between items-start">
                <div className="flex">
                    <span className="text-lg mr-2">{iconMap[variant]}</span>
                    <div>
                        {title && <h3 className="font-semibold mb-1">{title}</h3>}
                        <p>{message}</p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-lg font-bold hover:opacity-70 transition-opacity"
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
};

export default Alert;