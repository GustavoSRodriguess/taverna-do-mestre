import React from 'react';
import { CardBorder, Button } from '../../ui';
import { LucideIcon, Search } from 'lucide-react';

interface HomebrewEmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    buttonLabel?: string;
    onButtonClick?: () => void;
    variant?: 'no-items' | 'no-results';
    onClearFilters?: () => void;
}

const HomebrewEmptyState: React.FC<HomebrewEmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    buttonLabel,
    onButtonClick,
    variant = 'no-items',
    onClearFilters,
}) => {
    if (variant === 'no-results') {
        return (
            <CardBorder className="text-center py-12 bg-indigo-950/50">
                <Search className="w-16 h-16 mx-auto mb-4 text-indigo-400" />
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-indigo-300 mb-4">{description}</p>
                {onClearFilters && (
                    <button
                        onClick={onClearFilters}
                        className="text-purple-400 hover:text-purple-300 underline"
                    >
                        Limpar todos os filtros
                    </button>
                )}
            </CardBorder>
        );
    }

    return (
        <CardBorder className="text-center py-12 bg-indigo-950/50">
            <Icon className="w-24 h-24 mx-auto mb-4 text-indigo-400" />
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-indigo-300 mb-6">{description}</p>
            {buttonLabel && onButtonClick && (
                <Button
                    buttonLabel={buttonLabel}
                    onClick={onButtonClick}
                    classname="bg-green-600 hover:bg-green-700"
                />
            )}
        </CardBorder>
    );
};

export default HomebrewEmptyState;
