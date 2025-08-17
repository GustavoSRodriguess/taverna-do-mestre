import { useMemo } from 'react';
import { GameAttributes, GameSkill } from '../types/game';
import {
    calculateModifier,
    formatModifier,
    calculateProficiencyBonus,
    calculateSkillBonus,
    calculateSpellStats
} from '../utils/gameUtils';

export const useGameCalculations = (
    attributes: GameAttributes,
    level: number,
    skills: { [key: string]: GameSkill } = {},
    spellcastingAbility?: keyof GameAttributes
) => {
    const proficiencyBonus = useMemo(() => calculateProficiencyBonus(level), [level]);

    const modifiers = useMemo(() => {
        return Object.entries(attributes).reduce((acc, [key, value]) => {
            acc[key as keyof GameAttributes] = calculateModifier(value);
            return acc;
        }, {} as GameAttributes);
    }, [attributes]);

    const formattedModifiers = useMemo(() => {
        return Object.entries(modifiers).reduce((acc, [key, value]) => {
            acc[key as keyof GameAttributes] = formatModifier(value);
            return acc;
        }, {} as Record<keyof GameAttributes, string>);
    }, [modifiers]);

    const skillBonuses = useMemo(() => {
        return Object.entries(skills).reduce((acc, [skillName, skillData]) => {
            // This would need skill-to-attribute mapping, simplified for now
            const attributeScore = attributes.dexterity; // Default, should be mapped properly
            acc[skillName] = calculateSkillBonus(
                attributeScore,
                proficiencyBonus,
                skillData.proficient,
                skillData.expertise,
                skillData.bonus
            );
            return acc;
        }, {} as { [key: string]: number });
    }, [skills, attributes, proficiencyBonus]);

    const spellStats = useMemo(() => {
        if (!spellcastingAbility) return null;

        return calculateSpellStats(attributes, proficiencyBonus, spellcastingAbility);
    }, [attributes, proficiencyBonus, spellcastingAbility]);

    const savingThrows = useMemo(() => {
        return Object.entries(modifiers).reduce((acc, [key, value]) => {
            acc[key as keyof GameAttributes] = value + proficiencyBonus; // Simplified
            return acc;
        }, {} as GameAttributes);
    }, [modifiers, proficiencyBonus]);

    return {
        proficiencyBonus,
        modifiers,
        formattedModifiers,
        skillBonuses,
        spellStats,
        savingThrows
    };
};

export default useGameCalculations;