import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { CardBorder } from '../../ui';

interface FilterOption {
    value: string;
    label: string;
}

interface CustomFilterConfig {
    key: string;
    label: string;
    options: FilterOption[];
}

interface HomebrewFilterBarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
    filterVisibility: 'all' | 'public' | 'private';
    onVisibilityChange: (value: 'all' | 'public' | 'private') => void;
    customFilters?: CustomFilterConfig[];
    customFilterValues?: Record<string, any>;
    onCustomFilterChange?: (key: string, value: any) => void;
    onClearFilters: () => void;
    hasActiveFilters: boolean;
}

const HomebrewFilterBar: React.FC<HomebrewFilterBarProps> = ({
    searchTerm,
    onSearchChange,
    searchPlaceholder = 'Buscar...',
    filterVisibility,
    onVisibilityChange,
    customFilters = [],
    customFilterValues = {},
    onCustomFilterChange,
    onClearFilters,
    hasActiveFilters,
}) => {
    return (
        <CardBorder className="bg-indigo-950/50 mb-6">
            <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-indigo-900/50 border border-indigo-700 rounded-md
                         text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm text-indigo-300">Filtros:</span>
                    </div>

                    {/* Visibility Filter */}
                    <select
                        value={filterVisibility}
                        onChange={(e) => onVisibilityChange(e.target.value as any)}
                        className="px-3 py-1 bg-indigo-900/50 border border-indigo-700 rounded-md
                         text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="all">Todas</option>
                        <option value="public">Públicas</option>
                        <option value="private">Privadas</option>
                    </select>

                    {/* Custom Filters */}
                    {customFilters.map((filter) => (
                        <select
                            key={filter.key}
                            value={customFilterValues[filter.key] || 'all'}
                            onChange={(e) => onCustomFilterChange?.(filter.key, e.target.value)}
                            className="px-3 py-1 bg-indigo-900/50 border border-indigo-700 rounded-md
                             text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">{filter.label}</option>
                            {filter.options.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    ))}

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <button
                            onClick={onClearFilters}
                            className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 underline"
                        >
                            <X className="w-3 h-3" />
                            Limpar Filtros
                        </button>
                    )}
                </div>
            </div>
        </CardBorder>
    );
};

export default HomebrewFilterBar;
