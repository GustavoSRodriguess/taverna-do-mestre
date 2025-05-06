import React, { useState } from 'react';
import { Button, SelectField, NumberField } from '../../../ui';

interface LootGeneratorFormProps {
    onGenerateLoot: (lootData: {
        nivel: string;
        tipoMoedas: string;
        itemCategories: string[];
        quantidade: string;
        gems: boolean;
        artObjects: boolean;
        magicItems: boolean;
        ranks: string[];
    }) => void;
}

export const LootGeneratorForm: React.FC<LootGeneratorFormProps> = ({ onGenerateLoot }) => {
    const [level, setLevel] = useState("1");
    const [coinType, setCoinType] = useState("standard");
    const [quantity, setQuantity] = useState("1");
    const [includeGems, setIncludeGems] = useState(true);
    const [includeArtObjects, setIncludeArtObjects] = useState(true);
    const [includeMagicItems, setIncludeMagicItems] = useState(true);
    const [itemRanks, setItemRanks] = useState(["minor", "medium", "major"]);

    const coinTypeOptions = [
        { value: 'standard', label: 'Padrão' },
        { value: 'double', label: 'Dobrado' },
        { value: 'half', label: 'Metade' },
        { value: 'none', label: 'Nenhum' }
    ];

    const magicItemCategories = [
        { id: 'armor', value: 'armor', label: 'Armaduras' },
        { id: 'weapons', value: 'weapons', label: 'Armas' },
        { id: 'potions', value: 'potions', label: 'Poções' },
        { id: 'rings', value: 'rings', label: 'Anéis' },
        { id: 'rods', value: 'rods', label: 'Bastões' },
        { id: 'scrolls', value: 'scrolls', label: 'Pergaminhos' },
        { id: 'staves', value: 'staves', label: 'Cajados' },
        { id: 'wands', value: 'wands', label: 'Varinhas' },
        { id: 'wondrous', value: 'wondrous', label: 'Itens Maravilhosos' }
    ];

    const itemRankOptions = [
        { id: 'minor', value: 'minor', label: 'Menor' },
        { id: 'medium', value: 'medium', label: 'Médio' },
        { id: 'major', value: 'major', label: 'Maior' }
    ];

    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        magicItemCategories.map(category => category.value)
    );

    const handleCategoryToggle = (category: string) => {
        if (selectedCategories.includes(category)) {
            setSelectedCategories(selectedCategories.filter(c => c !== category));
        } else {
            setSelectedCategories([...selectedCategories, category]);
        }
    };

    const handleRankToggle = (rank: string) => {
        if (itemRanks.includes(rank)) {
            setItemRanks(itemRanks.filter(r => r !== rank));
        } else {
            setItemRanks([...itemRanks, rank]);
        }
    };

    const handleGenerateLoot = () => {
        onGenerateLoot({
            nivel: level,
            tipoMoedas: coinType,
            itemCategories: selectedCategories,
            quantidade: quantity,
            // Pass the state values to the callback
            gems: includeGems,
            artObjects: includeArtObjects,
            magicItems: includeMagicItems,
            ranks: itemRanks
        });
    };

    return (
        <div className="text-left">
            <div className="space-y-4">
                <NumberField
                    label="Nível do Tesouro (1-20)"
                    value={level}
                    onChange={setLevel}
                    min={1}
                    max={20}
                />

                <SelectField
                    label="Tipo de Moedas"
                    value={coinType}
                    onChange={setCoinType}
                    options={coinTypeOptions}
                />

                <NumberField
                    label="Quantidade de Tesouros"
                    value={quantity}
                    onChange={setQuantity}
                    min={1}
                    max={10}
                />

                <div className="mb-4">
                    <label className="block text-indigo-200 mb-2">Incluir Itens</label>
                    <div className="flex flex-wrap gap-2 pl-2">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="includeGems"
                                checked={includeGems}
                                onChange={() => setIncludeGems(!includeGems)}
                                className="mr-2 text-purple-600 focus:ring-purple-500"
                            />
                            <label htmlFor="includeGems" className="text-white">Gemas</label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="includeArtObjects"
                                checked={includeArtObjects}
                                onChange={() => setIncludeArtObjects(!includeArtObjects)}
                                className="mr-2 text-purple-600 focus:ring-purple-500"
                            />
                            <label htmlFor="includeArtObjects" className="text-white">Objetos de Arte</label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="includeMagicItems"
                                checked={includeMagicItems}
                                onChange={() => setIncludeMagicItems(!includeMagicItems)}
                                className="mr-2 text-purple-600 focus:ring-purple-500"
                            />
                            <label htmlFor="includeMagicItems" className="text-white">Itens Mágicos</label>
                        </div>
                    </div>
                </div>

                {includeMagicItems && (
                    <>
                        <div className="mb-4 pl-4 border-l-2 border-purple-600">
                            <label className="block text-indigo-200 mb-2">Categorias de Itens Mágicos</label>
                            <div className="grid grid-cols-2 gap-2">
                                {magicItemCategories.map(category => (
                                    <div key={category.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={category.id}
                                            checked={selectedCategories.includes(category.value)}
                                            onChange={() => handleCategoryToggle(category.value)}
                                            className="mr-2 text-purple-600 focus:ring-purple-500"
                                        />
                                        <label htmlFor={category.id} className="text-white">{category.label}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4 pl-4 border-l-2 border-purple-600">
                            <label className="block text-indigo-200 mb-2">Nível dos Itens Mágicos</label>
                            <div className="flex gap-4">
                                {itemRankOptions.map(rank => (
                                    <div key={rank.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={rank.id}
                                            checked={itemRanks.includes(rank.value)}
                                            onChange={() => handleRankToggle(rank.value)}
                                            className="mr-2 text-purple-600 focus:ring-purple-500"
                                        />
                                        <label htmlFor={rank.id} className="text-white">{rank.label}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <Button
                    buttonLabel="Gerar Tesouro"
                    onClick={handleGenerateLoot}
                    classname="w-full mt-4"
                />
            </div>
        </div>
    );
};
