import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: 'top' | 'right' | 'bottom' | 'left';
    className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'top',
    className = ''
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const targetRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Posicionamento de acordo com a direção
    const getPositionClasses = () => {
        switch (position) {
            case 'top':
                return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
            case 'right':
                return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
            case 'bottom':
                return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
            case 'left':
                return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
            default:
                return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
        }
    };

    // Seta de acordo com a direção
    const getArrowClasses = () => {
        switch (position) {
            case 'top':
                return 'top-full left-1/2 transform -translate-x-1/2 border-t-indigo-800 border-t-8 border-x-transparent border-x-8 border-b-0';
            case 'right':
                return 'right-full top-1/2 transform -translate-y-1/2 border-r-indigo-800 border-r-8 border-y-transparent border-y-8 border-l-0';
            case 'bottom':
                return 'bottom-full left-1/2 transform -translate-x-1/2 border-b-indigo-800 border-b-8 border-x-transparent border-x-8 border-t-0';
            case 'left':
                return 'left-full top-1/2 transform -translate-y-1/2 border-l-indigo-800 border-l-8 border-y-transparent border-y-8 border-r-0';
            default:
                return 'top-full left-1/2 transform -translate-x-1/2 border-t-indigo-800 border-t-8 border-x-transparent border-x-8 border-b-0';
        }
    };

    // Ajustar posição para evitar que saia da tela
    useEffect(() => {
        if (isVisible && tooltipRef.current && targetRef.current) {
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Ajuste horizontal
            if (tooltipRect.right > viewportWidth) {
                tooltipRef.current.style.left = 'auto';
                tooltipRef.current.style.right = '0';
            } else if (tooltipRect.left < 0) {
                tooltipRef.current.style.left = '0';
                tooltipRef.current.style.right = 'auto';
            }

            // Ajuste vertical
            if (tooltipRect.bottom > viewportHeight) {
                tooltipRef.current.style.top = 'auto';
                tooltipRef.current.style.bottom = '100%';
            } else if (tooltipRect.top < 0) {
                tooltipRef.current.style.top = '100%';
                tooltipRef.current.style.bottom = 'auto';
            }
        }
    }, [isVisible]);

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            ref={targetRef}
        >
            {children}

            {isVisible && (
                <div
                    className={`absolute z-50 ${getPositionClasses()} ${className}`}
                    ref={tooltipRef}
                >
                    <div className="bg-indigo-800 text-white text-sm py-1 px-2 rounded shadow-lg whitespace-nowrap">
                        {content}
                    </div>
                    <div className={`absolute w-0 h-0 ${getArrowClasses()}`}></div>
                </div>
            )}
        </div>
    );
};

export default Tooltip;