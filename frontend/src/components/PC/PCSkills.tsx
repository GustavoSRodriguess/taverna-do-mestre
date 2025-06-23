import React from 'react';
import { CardBorder, Button } from '../../ui';
import { PCData } from './PCEditor';

interface PCSkillsProps {
    pcData: PCData;
    updatePCData: (updates: Partial<PCData>) => void;
}

interface SkillInfo {
    name: string;
    attribute: keyof PCData['attributes'];
    description: string;
}

const skills: SkillInfo[] = [
    { name: 'Acrobacia', attribute: 'dexterity', description: 'Manobras acrobáticas, equilíbrio' },
    { name: 'Arcanismo', attribute: 'intelligence', description: 'Conhecimento sobre magia' },
    { name: 'Atletismo', attribute: 'strength', description: 'Escalada, natação, saltos' },
    { name: 'Atuação', attribute: 'charisma', description: 'Entretenimento e performance' },
    { name: 'Blefar', attribute: 'charisma', description: 'Enganar e mentir convincentemente' },
    { name: 'Furtividade', attribute: 'dexterity', description: 'Mover-se sem ser detectado' },
    { name: 'História', attribute: 'intelligence', description: 'Conhecimento histórico' },
    { name: 'Intimidação', attribute: 'charisma', description: 'Influenciar através do medo' },
    { name: 'Intuição', attribute: 'wisdom', description: 'Discernir intenções' },
    { name: 'Investigação', attribute: 'intelligence', description: 'Encontrar pistas e evidências' },
    { name: 'Lidar com Animais', attribute: 'wisdom', description: 'Interagir com animais' },
    { name: 'Medicina', attribute: 'wisdom', description: 'Cuidados médicos básicos' },
    { name: 'Natureza', attribute: 'intelligence', description: 'Conhecimento sobre natureza' },
    { name: 'Percepção', attribute: 'wisdom', description: 'Notar detalhes do ambiente' },
    { name: 'Persuasão', attribute: 'charisma', description: 'Convencer e influenciar' },
    { name: 'Prestidigitação', attribute: 'dexterity', description: 'Truques de mão, furtar' },
    { name: 'Religião', attribute: 'intelligence', description: 'Conhecimento religioso' },
    { name: 'Sobrevivência', attribute: 'wisdom', description: 'Navegar e sobreviver na natureza' }
];

const PCSkills: React.FC<PCSkillsProps> = ({ pcData, updatePCData }) => {
    const getModifier = (score: number): number => {
        return Math.floor((score - 10) / 2);
    };

    const formatModifier = (modifier: number): string => {
        return modifier >= 0 ? `+${modifier}` : modifier.toString();
    };

    const getSkillBonus = (skill: SkillInfo): number => {
        const attributeModifier = getModifier(pcData.attributes[skill.attribute]);
        const skillData = pcData.skills[skill.name] || { proficient: false, expertise: false, bonus: 0 };

        let total = attributeModifier + skillData.bonus;

        if (skillData.proficient) {
            total += pcData.proficiency_bonus;
        }

        if (skillData.expertise) {
            total += pcData.proficiency_bonus; // Expertise dobra o bônus de proficiência
        }

        return total;
    };

    const updateSkill = (skillName: string, updates: Partial<typeof pcData.skills[string]>) => {
        const currentSkill = pcData.skills[skillName] || { proficient: false, expertise: false, bonus: 0 };
        const newSkills = {
            ...pcData.skills,
            [skillName]: { ...currentSkill, ...updates }
        };
        updatePCData({ skills: newSkills });
    };

    const getAttributeShort = (attribute: keyof PCData['attributes']): string => {
        const map = {
            strength: 'FOR',
            dexterity: 'DES',
            constitution: 'CON',
            intelligence: 'INT',
            wisdom: 'SAB',
            charisma: 'CAR'
        };
        return map[attribute];
    };

    const rollSkill = (skill: SkillInfo) => {
        const roll = Math.floor(Math.random() * 20) + 1;
        const bonus = getSkillBonus(skill);
        const total = roll + bonus;

        alert(`🎲 ${skill.name}\nRolagem: ${roll} + ${bonus} = ${total}`);
    };

    return (
        <div className="space-y-6">
            {/* Header com estatísticas */}
            <CardBorder className="bg-indigo-950/80">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-purple-400">Perícias</h3>
                    <div className="flex gap-4 text-sm">
                        <div className="text-indigo-300">
                            <span className="font-bold">Proficiências:</span> {
                                Object.values(pcData.skills).filter(s => s?.proficient).length
                            }
                        </div>
                        <div className="text-indigo-300">
                            <span className="font-bold">Especializações:</span> {
                                Object.values(pcData.skills).filter(s => s?.expertise).length
                            }
                        </div>
                    </div>
                </div>
            </CardBorder>

            {/* Lista de Perícias */}
            <CardBorder className="bg-indigo-950/80">
                <div className="space-y-2">
                    {/* Cabeçalho da tabela */}
                    <div className="grid grid-cols-12 gap-2 pb-2 border-b border-indigo-700 text-sm font-bold text-indigo-300">
                        <div className="col-span-1 text-center">Prof</div>
                        <div className="col-span-1 text-center">Exp</div>
                        <div className="col-span-4">Perícia</div>
                        <div className="col-span-1 text-center">Atr</div>
                        <div className="col-span-2 text-center">Bônus</div>
                        <div className="col-span-2 text-center">Total</div>
                        <div className="col-span-1 text-center">Rolar</div>
                    </div>

                    {/* Perícias */}
                    {skills.map((skill) => {
                        const skillData = pcData.skills[skill.name] || { proficient: false, expertise: false, bonus: 0 };
                        const attributeModifier = getModifier(pcData.attributes[skill.attribute]);
                        const totalBonus = getSkillBonus(skill);

                        return (
                            <div key={skill.name} className="grid grid-cols-12 gap-2 py-2 hover:bg-indigo-900/30 rounded">
                                {/* Proficiência */}
                                <div className="col-span-1 flex justify-center">
                                    <input
                                        type="checkbox"
                                        checked={skillData.proficient}
                                        onChange={(e) => updateSkill(skill.name, { proficient: e.target.checked })}
                                        className="w-4 h-4 text-purple-600 bg-indigo-800 border-indigo-600 rounded
                                         focus:ring-purple-500"
                                        title="Proficiente"
                                    />
                                </div>

                                {/* Expertise */}
                                <div className="col-span-1 flex justify-center">
                                    <input
                                        type="checkbox"
                                        checked={skillData.expertise}
                                        onChange={(e) => updateSkill(skill.name, { expertise: e.target.checked })}
                                        disabled={!skillData.proficient}
                                        className="w-4 h-4 text-yellow-600 bg-indigo-800 border-indigo-600 rounded
                                         focus:ring-yellow-500 disabled:opacity-50"
                                        title="Especialização (requer proficiência)"
                                    />
                                </div>

                                {/* Nome da Perícia */}
                                <div className="col-span-4">
                                    <div className="text-white font-medium">{skill.name}</div>
                                    <div className="text-xs text-indigo-300">{skill.description}</div>
                                </div>

                                {/* Atributo */}
                                <div className="col-span-1 text-center">
                                    <span className="text-purple-300 font-bold text-sm">
                                        {getAttributeShort(skill.attribute)}
                                    </span>
                                    <div className="text-xs text-indigo-400">
                                        {formatModifier(attributeModifier)}
                                    </div>
                                </div>

                                {/* Bônus Manual */}
                                <div className="col-span-2 flex justify-center">
                                    <input
                                        type="number"
                                        value={skillData.bonus}
                                        onChange={(e) => updateSkill(skill.name, { bonus: parseInt(e.target.value) || 0 })}
                                        className="w-16 px-1 py-1 bg-indigo-800 text-white text-center text-sm rounded
                                         border border-indigo-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                        min={-10}
                                        max={10}
                                        title="Bônus adicional"
                                    />
                                </div>

                                {/* Total */}
                                <div className="col-span-2 text-center">
                                    <span className={`font-bold text-lg ${skillData.proficient ? 'text-green-400' :
                                        skillData.expertise ? 'text-yellow-400' : 'text-white'
                                        }`}>
                                        {formatModifier(totalBonus)}
                                    </span>
                                </div>

                                {/* Botão de Rolagem */}
                                <div className="col-span-1 flex justify-center">
                                    <Button
                                        buttonLabel="🎲"
                                        onClick={() => rollSkill(skill)}
                                        classname="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legenda */}
                <div className="mt-4 p-3 bg-indigo-900/30 rounded border border-indigo-800">
                    <div className="text-sm text-indigo-300">
                        <p><strong>Prof:</strong> Proficiência (+{pcData.proficiency_bonus} no total)</p>
                        <p><strong>Exp:</strong> Especialização (dobra o bônus de proficiência)</p>
                        <p><strong>Bônus:</strong> Modificadores adicionais (itens, magias, etc.)</p>
                    </div>
                </div>
            </CardBorder>
        </div>
    );
};

export default PCSkills;