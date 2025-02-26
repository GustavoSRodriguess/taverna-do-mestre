import React, { useState } from 'react';
import { Page } from '../../ui/Page';
import Section from '../../ui/Section';
import { CharacterGeneratorForm } from './CharacterGeneratorForm';
import { CharacterSheet } from './CharacterSheet';

// Mock de dados para personagem
const mockCharacter = {
    Raça: "Elfo",
    Classe: "Mago",
    HP: 24,
    CA: 13,
    Antecedente: "Sábio",
    Nível: 3,
    Atributos: {
        Força: 8,
        Destreza: 16,
        Constituição: 12,
        Inteligência: 18,
        Sabedoria: 13,
        Carisma: 10
    },
    Modificadores: {
        Força: -1,
        Destreza: 3,
        Constituição: 1,
        Inteligência: 4,
        Sabedoria: 1,
        Carisma: 0
    },
    Habilidades: ["Conjuração de Magias", "Recuperação Arcana", "Tradição Arcana", "Aprimorar Magias"],
    Magias: {
        "Magias de Nível 1": ["Bola de Fogo", "Escudo Mágico", "Raio Arcano"],
        "Magias de Nível 2": ["Nevasca", "Invisibilidade", "Teia"]
    },
    Equipamento: ["Livro de conhecimento", "Tinta e pena"],
    "Traço de Antecedente": "Pesquisador"
};

export const CharCreation: React.FC = () => {
    const [character, setCharacter] = useState<typeof mockCharacter | null>(null);

    // Função para gerar personagem
    const handleGenerateCharacter = (formData: any) => {
        console.log("Dados do formulário:", formData);
        // Em um cenário real, enviaríamos esses dados para o backend
        // Por enquanto, usamos os dados mockados
        setCharacter(mockCharacter);
    };

    return (
        <Page>
            <Section title="Criação de Personagem" className="py-8">
                <p className="text-lg mb-8 max-w-3xl mx-auto">
                    Crie personagens para sua campanha de RPG de forma rápida e fácil.
                    Preencha o formulário abaixo com as características desejadas.
                </p>

                <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    <CharacterGeneratorForm onGenerateCharacter={handleGenerateCharacter} />
                    <CharacterSheet character={character} />
                </div>
            </Section>
        </Page>
    );
};

export default CharCreation;