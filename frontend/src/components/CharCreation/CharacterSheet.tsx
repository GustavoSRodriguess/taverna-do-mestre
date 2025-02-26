import React from 'react';
import { CardBorder } from '../../ui/CardBorder';

// Tipos
type CharacterAttributes = {
    Força: number;
    Destreza: number;
    Constituição: number;
    Inteligência: number;
    Sabedoria: number;
    Carisma: number;
};

type CharacterData = {
    Raça: string;
    Classe: string;
    HP: number;
    CA: number;
    Antecedente: string;
    Nível: number;
    Atributos: CharacterAttributes;
    Modificadores: CharacterAttributes;
    Habilidades: string[];
    Magias: Record<string, string[]>;
    Equipamento: string[];
    "Traço de Antecedente": string;
};

interface CharacterSheetProps {
    character: CharacterData | null;
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ character }) => {
    if (!character) {
        return (
            <CardBorder className="h-full flex items-center justify-center text-center bg-indigo-950/50">
                <p className="text-indigo-300">Preencha o formulário e clique em "Gerar Personagem" para ver os resultados aqui.</p>
            </CardBorder>
        );
    }

    return (
        <CardBorder className="bg-indigo-950/80">
            <h2 className="text-2xl font-bold mb-6">Ficha de Personagem</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <h3 className="text-indigo-300 text-sm">Raça</h3>
                    <p className="font-semibold">{character.Raça}</p>
                </div>
                <div>
                    <h3 className="text-indigo-300 text-sm">Classe</h3>
                    <p className="font-semibold">{character.Classe}</p>
                </div>
                <div>
                    <h3 className="text-indigo-300 text-sm">Nível</h3>
                    <p className="font-semibold">{character.Nível}</p>
                </div>
                <div>
                    <h3 className="text-indigo-300 text-sm">Antecedente</h3>
                    <p className="font-semibold">{character.Antecedente}</p>
                </div>
                <div>
                    <h3 className="text-indigo-300 text-sm">HP</h3>
                    <p className="font-semibold">{character.HP}</p>
                </div>
                <div>
                    <h3 className="text-indigo-300 text-sm">CA</h3>
                    <p className="font-semibold">{character.CA}</p>
                </div>
            </div>

            <div className="mb-4">
                <h3 className="text-indigo-300 text-sm mb-2">Atributos</h3>
                <div className="grid grid-cols-3 gap-2">
                    {Object.entries(character.Atributos).map(([attr, value]) => (
                        <div key={attr} className="bg-indigo-800/50 rounded p-2 text-center">
                            <div className="text-xs text-indigo-300">{attr}</div>
                            <div className="font-bold text-xl">{value}</div>
                            <div className="text-sm">
                                ({character.Modificadores[attr as keyof CharacterAttributes] >= 0 ? '+' : ''}
                                {character.Modificadores[attr as keyof CharacterAttributes]})
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-4">
                <h3 className="text-indigo-300 text-sm mb-2">Habilidades</h3>
                <ul className="list-disc list-inside space-y-1">
                    {character.Habilidades.map((habilidade, index) => (
                        <li key={index}>{habilidade}</li>
                    ))}
                </ul>
            </div>

            {Object.keys(character.Magias).length > 0 && (
                <div className="mb-4">
                    <h3 className="text-indigo-300 text-sm mb-2">Magias</h3>
                    {Object.entries(character.Magias).map(([level, spells]) => (
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
                    {character.Equipamento.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            </div>

            <div>
                <h3 className="text-indigo-300 text-sm mb-2">Traço de Antecedente</h3>
                <p>{character["Traço de Antecedente"]}</p>
            </div>
        </CardBorder>
    );
};