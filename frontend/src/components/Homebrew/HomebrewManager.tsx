import React, { useState } from 'react';
import { Page, Section } from '../../ui';
import { Wand2, Swords, Scroll } from 'lucide-react';
import HomebrewRacesList from './HomebrewRacesList';
import HomebrewClassesList from './HomebrewClassesList';
import HomebrewBackgroundsList from './HomebrewBackgroundsList';

type HomebrewTab = 'races' | 'classes' | 'backgrounds';

const HomebrewManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<HomebrewTab>('races');

    const tabs = [
        { id: 'races' as HomebrewTab, label: 'Raças', Icon: Wand2 },
        { id: 'classes' as HomebrewTab, label: 'Classes', Icon: Swords },
        { id: 'backgrounds' as HomebrewTab, label: 'Antecedentes', Icon: Scroll }
    ];

    return (
        <Page>
            <Section title="Homebrew Workshop" className="py-8">
                <div className="max-w-7xl mx-auto">
                    <p className="text-indigo-300 mb-8 text-center">
                        Crie e gerencie seu conteúdo customizado para D&D 5e
                    </p>

                    {/* Tabs */}
                    <div className="bg-indigo-950/50 rounded-lg mb-6 border border-indigo-800">
                        <div className="border-b border-indigo-800">
                            <nav className="flex">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            flex-1 py-4 px-6 text-center font-medium text-sm
                                            border-b-2 transition-colors duration-200 flex items-center justify-center gap-2
                                            ${activeTab === tab.id
                                                ? 'border-orange-500 text-orange-400 bg-indigo-900/50'
                                                : 'border-transparent text-indigo-400 hover:text-indigo-200 hover:bg-indigo-900/30'
                                            }
                                        `}
                                    >
                                        <tab.Icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {activeTab === 'races' && <HomebrewRacesList />}
                            {activeTab === 'classes' && <HomebrewClassesList />}
                            {activeTab === 'backgrounds' && <HomebrewBackgroundsList />}
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-blue-300 mb-1">
                                    Conteúdo Público vs Privado
                                </h3>
                                <p className="text-sm text-blue-400/80">
                                    Marque seu conteúdo como <strong>Público</strong> para compartilhar com outros jogadores.
                                    Conteúdo <strong>Privado</strong> fica visível apenas para você.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>
        </Page>
    );
};

export default HomebrewManager;
