import { useState, useMemo } from 'react';

export interface FilterConfig<T> {
    searchFields: (keyof T)[];
    customFilters?: {
        [key: string]: (item: T, value: any) => boolean;
    };
}

export function useHomebrewFilters<T extends { is_public?: boolean }>(
    items: T[],
    config: FilterConfig<T>
) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterVisibility, setFilterVisibility] = useState<'all' | 'public' | 'private'>('all');
    const [customFilterValues, setCustomFilterValues] = useState<Record<string, any>>({});

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            // Search filter
            const matchesSearch = searchTerm === '' ||
                config.searchFields.some(field => {
                    const value = item[field];
                    if (typeof value === 'string') {
                        return value.toLowerCase().includes(searchTerm.toLowerCase());
                    }
                    return false;
                });

            // Visibility filter
            const matchesVisibility = filterVisibility === 'all' ||
                (filterVisibility === 'public' && item.is_public) ||
                (filterVisibility === 'private' && !item.is_public);

            // Custom filters
            const matchesCustomFilters = !config.customFilters || Object.entries(customFilterValues).every(([key, value]) => {
                if (value === 'all' || value === undefined || value === null) return true;
                const filterFn = config.customFilters?.[key];
                return filterFn ? filterFn(item, value) : true;
            });

            return matchesSearch && matchesVisibility && matchesCustomFilters;
        });
    }, [items, searchTerm, filterVisibility, customFilterValues, config]);

    const clearFilters = () => {
        setSearchTerm('');
        setFilterVisibility('all');
        setCustomFilterValues({});
    };

    const hasActiveFilters = searchTerm !== '' || filterVisibility !== 'all' ||
        Object.values(customFilterValues).some(v => v !== 'all' && v !== undefined && v !== null);

    return {
        searchTerm,
        setSearchTerm,
        filterVisibility,
        setFilterVisibility,
        customFilterValues,
        setCustomFilterValue: (key: string, value: any) => {
            setCustomFilterValues(prev => ({ ...prev, [key]: value }));
        },
        filteredItems,
        clearFilters,
        hasActiveFilters,
        totalCount: items.length,
        filteredCount: filteredItems.length,
    };
}
