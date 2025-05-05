import React from 'react';
import { CardBorder, Badge } from '../../../ui';

// Tipos
type Monster = {
    nome: string;
    xp: number;
    cr: number;
};

type EncounterData = {
    tema: string;
    xpTotal: number;
    monstros: Monster[];
    descricaoNarrativa: string;
};

interface EncounterSheetProps {
    encounter: EncounterData | null;
}

export const EncounterSheet: React.FC<EncounterSheetProps> = ({ encounter }) => {
    if (!encounter) {
        return (
            <CardBorder className="h-full flex items-center justify-center text-center bg-indigo-950/50">
                <p className="text-indigo-300">Preencha o formulário e clique em "Gerar Encontro" para ver os resultados aqui.</p>
            </CardBorder>
        );
    }

    // Função auxiliar para determinar a dificuldade do monstro com base no CR
    const getMonsterDifficulty = (cr: number): string => {
        if (cr < 1) return 'Fácil';
        if (cr < 3) return 'Médio';
        if (cr < 7) return 'Difícil';
        return 'Mortal';
    };

    // Função para determinar a variante do badge com base na dificuldade
    const getBadgeVariant = (cr: number) => {
        const difficulty = getMonsterDifficulty(cr);
        switch (difficulty) {
            case 'Fácil': return 'info';
            case 'Médio': return 'primary';
            case 'Difícil': return 'warning';
            case 'Mortal': return 'danger';
            default: return 'primary';
        }
    };

    return (
        <CardBorder className="bg-indigo-950/80">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Encontro Gerado</h2>
                <Badge text={`XP Total: ${encounter.xpTotal}`} variant="success" />
            </div>

            <div className="mb-4">
                <h3 className="text-indigo-300 text-sm mb-2">Tema</h3>
                <p className="font-semibold">{encounter.tema}</p>
            </div>

            <div className="mb-4">
                <h3 className="text-indigo-300 text-sm mb-2">Descrição Narrativa</h3>
                <p className="text-sm bg-indigo-900/30 p-3 rounded border border-indigo-800">
                    {encounter.descricaoNarrativa}
                </p>
            </div>

            <div className="mb-4">
                <h3 className="text-indigo-300 text-sm mb-2">Monstros</h3>
                <div className="overflow-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-indigo-800/50 text-left">
                                <th className="p-2">Nome</th>
                                <th className="p-2">CR</th>
                                <th className="p-2">XP</th>
                                <th className="p-2">Dificuldade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {encounter.monstros.map((monstro, index) => (
                                <tr key={index} className="border-b border-indigo-800/30">
                                    <td className="p-2">{monstro.nome}</td>
                                    <td className="p-2">{monstro.cr}</td>
                                    <td className="p-2">{monstro.xp}</td>
                                    <td className="p-2">
                                        <Badge
                                            text={getMonsterDifficulty(monstro.cr)}
                                            variant={getBadgeVariant(monstro.cr)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="text-indigo-300 text-sm mb-2">Dicas para o Mestre</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Considere o ambiente para adicionar elementos táticos interessantes.</li>
                    <li>Adapte a descrição narrativa de acordo com a sua campanha.</li>
                    <li>Ajuste o número de monstros para balancear o encontro, se necessário.</li>
                </ul>
            </div>
        </CardBorder>
    );
};