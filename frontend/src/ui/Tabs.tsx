import React, { useState } from 'react';

export interface TabItem {
    id: string;
    label: string;
    icon?: string | React.ReactNode;
}

interface TabsProps {
    tabs: TabItem[];
    defaultTabId?: string;
    onChange?: (tabId: string) => void;
    className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
    tabs,
    defaultTabId,
    onChange,
    className = ''
}) => {
    const [activeTabId, setActiveTabId] = useState(defaultTabId || tabs[0]?.id);

    const handleTabChange = (tabId: string) => {
        setActiveTabId(tabId);
        if (onChange) {
            onChange(tabId);
        }
    };

    return (
        <div className={`mb-4 ${className}`}>
            <div className="flex border-b border-indigo-700">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`px-6 py-3 font-medium text-sm flex items-center transition-colors
              ${activeTabId === tab.id
                                ? 'text-purple-400 border-b-2 border-purple-500'
                                : 'text-indigo-300 hover:text-white hover:bg-indigo-800/30'
                            }`}
                    >
                        {tab.icon && <span className="mr-2">{tab.icon}</span>}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Tabs;