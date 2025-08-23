import React, { useEffect } from 'react';
import { Button } from './Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    className = ''
}) => {
    // Fecha o modal com a tecla Escape
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);

        // Impede o scroll do body quando o modal está aberto
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }

        return () => {
            window.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, onClose]);

    // Se o modal não estiver aberto, não renderiza nada
    if (!isOpen) return null;

    // Classes de tamanho
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            {/* Overlay para fechar ao clicar fora */}
            <div
                className="absolute inset-0"
                onClick={onClose}
            />

            {/* Conteúdo do modal */}
            <div
                className={`${sizeClasses[size]} w-full bg-indigo-950 rounded-lg shadow-lg z-10 border border-indigo-800 ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cabeçalho */}
                <div className="flex justify-between items-center p-4 border-b border-indigo-800">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button
                        className="text-indigo-300 hover:text-white text-2xl font-bold"
                        onClick={onClose}
                    >
                        &times;
                    </button>
                </div>

                {/* Corpo */}
                <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {children}
                </div>

                {/* Rodapé (opcional) */}
                {footer && (
                    <div className="p-4 border-t border-indigo-800 flex justify-end space-x-2">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

// Componente auxiliar para o rodapé de confirmação comum
export const ModalConfirmFooter: React.FC<{
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmVariant?: string;
}> = ({
    onConfirm,
    onCancel,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    confirmVariant = ''
}) => {
        return (
            <>
                <Button
                    buttonLabel={cancelLabel}
                    onClick={onCancel}
                    classname="bg-gray-600 hover:bg-gray-700"
                />
                <Button
                    buttonLabel={confirmLabel}
                    onClick={onConfirm}
                    classname={confirmVariant || ''}
                />
            </>
        );
    };

export default Modal;