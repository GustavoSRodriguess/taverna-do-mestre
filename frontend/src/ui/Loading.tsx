import React from 'react';

interface LoadingProps {
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
    text?: string;
    className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
    size = 'md',
    fullScreen = false,
    text,
    className = ''
}) => {
    // Classes de tamanho para o spinner
    const sizeClasses = {
        sm: 'w-5 h-5 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4'
    };

    // Componente do spinner
    const spinner = (
        <div
            className={`${sizeClasses[size]} rounded-full border-t-transparent border-purple-600 animate-spin ${className}`}
        />
    );

    // Se for fullScreen, renderiza em tela cheia
    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-indigo-950/80 flex flex-col items-center justify-center z-50">
                {spinner}
                {text && <p className="mt-4 text-indigo-200">{text}</p>}
            </div>
        );
    }

    // Renderização normal
    return (
        <div className="flex flex-col items-center justify-center p-4">
            {spinner}
            {text && <p className="mt-2 text-indigo-200">{text}</p>}
        </div>
    );
};

export default Loading;