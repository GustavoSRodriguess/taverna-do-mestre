import React from 'react';
import { CardBorder } from '../../../ui/CardBorder';
import { Button } from '../../../ui/Button';

type NPCAttributes = {
    Forca: number;
    Destreza: number;
    Constituicão: number;
    Inteligência: number;
    Sabedoria: number;
    Carisma: number;
};

type NPCData = {
    Raca: string;
    Classe: string;
    HP: number;
    CA: number;
    Antecedente: string;
    Nível: number;
    Atributos: NPCAttributes;
    Modificadores: NPCAttributes;
    Habilidades: string[];
    Magias: Record<string, string[]>;
    Equipamento: string[];
    "Traco de Antecedente": string;
};

interface NPCSheetProps {
    npc: NPCData | null;
}

export const NPCSheet: React.FC<NPCSheetProps> = ({ npc }) => {
    if (!npc) {
        return (
            <CardBorder className="h-full flex items-center justify-center text-center bg-indigo-950/50">
                <p className="text-indigo-300">Preencha o formulário e clique em "Gerar NPC" para ver os resultados aqui.</p>
            </CardBorder>
        );
    }

    return (
        <CardBorder className="bg-indigo-950/80">
            <h2 className="text-2xl font-bold mb-6">Ficha do NPC</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <h3 className="text-indigo-300 text-sm">Raca</h3>
                    <p className="font-semibold">{npc.Raca}</p>
                </div>
                <div>
                    <h3 className="text-indigo-300 text-sm">Classe</h3>
                    <p className="font-semibold">{npc.Classe}</p>
                </div>
                <div>
                    <h3 className="text-indigo-300 text-sm">Nível</h3>
                    <p className="font-semibold">{npc.Nível}</p>
                </div>
                <div>
                    <h3 className="text-indigo-300 text-sm">Antecedente</h3>
                    <p className="font-semibold">{npc.Antecedente}</p>
                </div>
                <div>
                    <h3 className="text-indigo-300 text-sm">HP</h3>
                    <p className="font-semibold">{npc.HP}</p>
                </div>
                <div>
                    <h3 className="text-indigo-300 text-sm">CA</h3>
                    <p className="font-semibold">{npc.CA}</p>
                </div>
            </div>

            <div className="mb-4">
                <h3 className="text-indigo-300 text-sm mb-2">Atributos</h3>
                <div className="grid grid-cols-3 gap-2">
                    {Object.entries(npc.Atributos).map(([attr, value]) => (
                        <div key={attr} className="bg-indigo-800/50 rounded p-2 text-center">
                            <div className="text-xs text-indigo-300">{attr}</div>
                            <div className="font-bold text-xl">{value}</div>
                            <div className="text-sm">
                                ({npc.Modificadores[attr as keyof NPCAttributes] >= 0 ? '+' : ''}
                                {npc.Modificadores[attr as keyof NPCAttributes]})
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-4">
                <h3 className="text-indigo-300 text-sm mb-2">Habilidades</h3>
                <ul className="list-disc list-inside space-y-1">
                    {npc.Habilidades.map((habilidade, index) => (
                        <li key={index}>{habilidade}</li>
                    ))}
                </ul>
            </div>

            {Object.keys(npc.Magias).length > 0 && (
                <div className="mb-4">
                    <h3 className="text-indigo-300 text-sm mb-2">Magias</h3>
                    {Object.entries(npc.Magias).map(([level, spells]) => (
                        <div key={level} className="mb-2">
                            <h4 className="text-indigo-200 text-xs">{level}</h4>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                {spells.map((spell, index) => (
                                    <li key={index}>{spell}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            <div className="mb-4">
                <h3 className="text-indigo-300 text-sm mb-2">Equipamento</h3>
                <ul className="list-disc list-inside space-y-1">
                    {npc.Equipamento.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            </div>

            <div>
                <h3 className="text-indigo-300 text-sm mb-2">Traco de Antecedente</h3>
                <p>{npc["Traco de Antecedente"]}</p>
            </div>

            <div className="mt-6 flex justify-end">
                <Button
                    buttonLabel="Salvar NPC"
                    onClick={() => console.log("Salvando NPC")}
                    classname="bg-purple-700 hover:bg-purple-800"
                />
            </div>
        </CardBorder>
    );
};
