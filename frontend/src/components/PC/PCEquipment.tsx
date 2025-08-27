import React from 'react';
import { CardBorder, Button } from '../../ui';
// import { PCData } from './PCEditor';
import { FullCharacter } from '../../types';
import { Package, Sword, Backpack, Plus, PackageOpen, Trash2 } from 'lucide-react';

interface PCEquipmentProps {
    pcData: FullCharacter;
    updatePCData: (updates: Partial<FullCharacter>) => void;
}

const PCEquipment: React.FC<PCEquipmentProps> = ({ pcData, updatePCData }) => {
    const addItem = () => {
        const newItem = {
            name: 'Novo Item',
            quantity: 1,
            equipped: false,
            description: ''
        };

        const newEquipment = [...pcData.equipment, newItem];
        updatePCData({ equipment: newEquipment });
    };

    const updateItem = (index: number, updates: Partial<typeof pcData.equipment[0]>) => {
        const newEquipment = [...pcData.equipment];
        newEquipment[index] = { ...newEquipment[index], ...updates };
        updatePCData({ equipment: newEquipment });
    };

    const removeItem = (index: number) => {
        const newEquipment = pcData.equipment.filter((_, i) => i !== index);
        updatePCData({ equipment: newEquipment });
    };

    const equippedItems = pcData.equipment.filter(item => item.equipped);
    const inventoryItems = pcData.equipment.filter(item => !item.equipped);

    return (
        <div className="space-y-6">
            {/* Estatísticas */}
            <div className="grid md:grid-cols-3 gap-6">
                <CardBorder className="bg-indigo-950/80 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-purple-400" />
                        <h3 className="text-lg font-bold text-purple-400">Total de Itens</h3>
                    </div>
                    <div className="text-3xl font-bold text-white">{pcData.equipment.length}</div>
                </CardBorder>

                <CardBorder className="bg-indigo-950/80 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Sword className="w-5 h-5 text-green-400" />
                        <h3 className="text-lg font-bold text-green-400">Equipados</h3>
                    </div>
                    <div className="text-3xl font-bold text-white">{equippedItems.length}</div>
                </CardBorder>

                <CardBorder className="bg-indigo-950/80 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Backpack className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-bold text-blue-400">Inventário</h3>
                    </div>
                    <div className="text-3xl font-bold text-white">{inventoryItems.length}</div>
                </CardBorder>
            </div>

            {/* Itens Equipados */}
            <CardBorder className="bg-green-950/30 border-green-700">
                <div className="flex items-center gap-2 mb-4">
                    <Sword className="w-6 h-6 text-green-400" />
                    <h3 className="text-xl font-bold text-green-400">Equipamentos</h3>
                </div>

                {equippedItems.length === 0 ? (
                    <p className="text-green-300 text-center py-4">Nenhum item equipado</p>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {pcData.equipment.map((item, index) => {
                            if (!item.equipped) return null;
                            return (
                                <div key={index} className="bg-green-900/20 p-3 rounded border border-green-600">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="font-bold text-white">{item.name}</div>
                                            <div className="text-sm text-green-300">Qtd: {item.quantity}</div>
                                            {item.description && (
                                                <div className="text-xs text-green-400 mt-1">{item.description}</div>
                                            )}
                                        </div>
                                        <Button
                                            buttonLabel={
                                <div className="flex items-center gap-1">
                                    <PackageOpen className="w-3 h-3" />
                                    <span>Desequipar</span>
                                </div>
                            }
                                            onClick={() => updateItem(index, { equipped: false })}
                                            classname="bg-yellow-600 hover:bg-yellow-700 text-xs px-2 py-1 ml-2"
                                        // title="Desequipar"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardBorder>

            {/* Inventário */}
            <CardBorder className="bg-indigo-950/80">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <Backpack className="w-6 h-6 text-purple-400" />
                        <h3 className="text-xl font-bold text-purple-400">Inventário</h3>
                    </div>
                    <Button
                        buttonLabel={
                            <div className="flex items-center gap-1">
                                <Plus className="w-4 h-4" />
                                <span>Adicionar Item</span>
                            </div>
                        }
                        onClick={addItem}
                        classname="bg-green-600 hover:bg-green-700"
                    />
                </div>

                {pcData.equipment.length === 0 ? (
                    <div className="text-center py-8 text-indigo-300">
                        <Backpack className="w-16 h-16 mx-auto mb-4 text-indigo-400" />
                        <p>Inventário vazio</p>
                        <p className="text-sm mt-2">Clique em "Adicionar Item" para começar</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pcData.equipment.map((item, index) => (
                            <div key={index} className={`p-4 rounded border ${item.equipped
                                ? 'bg-green-900/20 border-green-600'
                                : 'bg-indigo-900/30 border-indigo-700'
                                }`}>
                                <div className="grid md:grid-cols-6 gap-4 items-center">
                                    <div className="md:col-span-2">
                                        <label className="block text-indigo-200 text-sm mb-1">Nome</label>
                                        <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => updateItem(index, { name: e.target.value })}
                                            className="w-full px-2 py-1 bg-indigo-800 text-white rounded
                                             border border-indigo-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-indigo-200 text-sm mb-1">Qtd</label>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, { quantity: parseInt(e.target.value) || 1 })}
                                            className="w-full px-2 py-1 bg-indigo-800 text-white text-center rounded
                                             border border-indigo-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            min={1}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-indigo-200 text-sm mb-1">Descrição</label>
                                        <input
                                            type="text"
                                            value={item.description || ''}
                                            onChange={(e) => updateItem(index, { description: e.target.value })}
                                            className="w-full px-2 py-1 bg-indigo-800 text-white rounded
                                             border border-indigo-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            placeholder="Propriedades, efeitos..."
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            buttonLabel={
                                                item.equipped ? (
                                                    <div className="flex items-center gap-1">
                                                        <PackageOpen className="w-3 h-3" />
                                                        <span>Desequipar</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1">
                                                        <Sword className="w-3 h-3" />
                                                        <span>Equipar</span>
                                                    </div>
                                                )
                                            }
                                            onClick={() => updateItem(index, { equipped: !item.equipped })}
                                            classname={`flex-1 text-sm ${item.equipped
                                                ? 'bg-yellow-600 hover:bg-yellow-700'
                                                : 'bg-green-600 hover:bg-green-700'
                                                }`}
                                        // title={item.equipped ? "Desequipar" : "Equipar"}
                                        />
                                        <Button
                                            buttonLabel={<Trash2 className="w-4 h-4" />}
                                            onClick={() => removeItem(index)}
                                            classname="bg-red-600 hover:bg-red-700 text-sm px-2"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardBorder>
        </div>
    );
};

export default PCEquipment;