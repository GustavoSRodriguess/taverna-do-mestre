import React from 'react';
import { CardBorder, Badge } from '../../../ui';
import { BadgeVariant } from '../../../ui/Badge';

// Tipos
type Item = {
    nome: string;
    tipo: string;
    valor: number;
    raridade?: string;
};

type Hoard = {
    coins: Record<string, number>;
    items: Item[];
    valor: number;
};

type LootData = {
    nivel: number;
    valorTotal: number;
    hoards: Hoard[];
};

interface LootSheetProps {
    loot: LootData | null;
}

export const LootSheet: React.FC<LootSheetProps> = ({ loot }) => {
    if (!loot) {
        return (
            <CardBorder className="h-full flex items-center justify-center text-center bg-indigo-950/50">
                <p className="text-indigo-300">Preencha o formulário e clique em "Gerar Tesouro" para ver os resultados aqui.</p>
            </CardBorder>
        );
    }

    // Função para formatar valores como moeda
    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'PO'
        }).format(value).replace('PO', 'PO');
    };

    // Função para obter a variante do badge com base na raridade
    const getRarityBadge = (raridade?: string) => {
        if (!raridade) return null;

        const variantMap: Record<string, BadgeVariant> = {
            'comum': 'info',
            'incomum': 'primary',
            'raro': 'success',
            'muito raro': 'warning',
            'lendário': 'danger'
        };

        return <Badge text={raridade} variant={variantMap[raridade.toLowerCase()] || 'primary'} />;
    };

    // Função para formatar as moedas
    const formatCoins = (coins: Record<string, number>): string => {
        const coinTypes = {
            'copper': 'PC',
            'silver': 'PP',
            'electrum': 'PE',
            'gold': 'PO',
            'platinum': 'PL'
        };

        return Object.entries(coins)
            .filter(([_, value]) => value > 0)
            .map(([type, value]) => `${value} ${coinTypes[type as keyof typeof coinTypes] || type}`)
            .join(', ');
    };

    return (
        <CardBorder className="bg-indigo-950/80">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Tesouro Gerado</h2>
                <Badge text={`Nível ${loot.nivel}`} variant="success" />
            </div>

            <div className="mb-4">
                <h3 className="text-indigo-300 text-sm mb-2">Valor Total</h3>
                <p className="font-semibold text-xl">{formatCurrency(loot.valorTotal)}</p>
            </div>

            {loot.hoards.map((hoard, hoardIndex) => (
                <div key={hoardIndex} className="mb-6 pb-6 border-b border-indigo-800 last:border-0">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold">Tesouro {hoardIndex + 1}</h3>
                        <Badge text={formatCurrency(hoard.valor)} variant="primary" />
                    </div>

                    {Object.keys(hoard.coins).length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-indigo-300 text-sm mb-1">Moedas</h4>
                            <p className="bg-indigo-900/30 p-2 rounded">{formatCoins(hoard.coins)}</p>
                        </div>
                    )}

                    {hoard.items.length > 0 && (
                        <div>
                            <h4 className="text-indigo-300 text-sm mb-2">Itens</h4>
                            <div className="overflow-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-indigo-800/50 text-left">
                                            <th className="p-2">Nome</th>
                                            <th className="p-2">Tipo</th>
                                            <th className="p-2">Valor</th>
                                            <th className="p-2">Raridade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hoard.items.map((item, index) => (
                                            <tr key={index} className="border-b border-indigo-800/30">
                                                <td className="p-2">{item.nome}</td>
                                                <td className="p-2">{item.tipo}</td>
                                                <td className="p-2">{formatCurrency(item.valor)}</td>
                                                <td className="p-2">
                                                    {getRarityBadge(item.raridade)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            <div className="mt-6">
                <h3 className="text-indigo-300 text-sm mb-2">Dicas para o Mestre</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Considere o contexto onde este tesouro está localizado.</li>
                    <li>Adapte o tesouro de acordo com o tema da sua campanha.</li>
                    <li>Use moedas e gemas como recompensas imediatas, e itens mágicos como recompensas de longo prazo.</li>
                </ul>
            </div>
        </CardBorder>
    );
};