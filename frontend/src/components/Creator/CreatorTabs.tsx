import React from 'react';

interface Tab {
    id: string;
    label: string;
    icon: string;
}

interface GeneratorTabsProps {
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

export const CreatorTabs: React.FC<GeneratorTabsProps> = ({ activeTab, onTabChange }) => {
    const tabs: Tab[] = [
        {
            id: 'character',
            label: 'Personagem',
            icon: '👤'
        },
        {
            id: 'npc',
            label: 'NPC',
            icon: '🧙'
        },
        {
            id: 'encounter',
            label: 'Encontro',
            icon: '⚔️'
        },
        {
            id: 'loot',
            label: 'Tesouro',
            icon: '💎'
        }
    ];

    return (
        <div className="flex pl-3">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`px-4 py-2 text-sm font-medium flex items-center transition-colors rounded-t-lg
                    ${activeTab === tab.id
                            ? 'bg-indigo-800 text-white border-t border-l border-r border-purple-600'
                            : 'bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800/70 hover:text-white'
                        }`}
                >
                    <span className="mr-2">{tab.icon}</span>
                    <span>{tab.label}</span>
                </button>
            ))}
        </div>
    );
};

export default CreatorTabs;