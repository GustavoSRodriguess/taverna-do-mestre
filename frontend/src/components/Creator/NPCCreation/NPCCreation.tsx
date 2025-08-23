import React from 'react';
import { NPCGeneratorForm } from './NPCGeneratorForm';
import { NPCSheet } from './NPCSheet';
import apiService from '../../../services/apiService';
import { GeneratorContainer } from '../GeneratorContainer';

const NPCFormWrapper: React.ComponentType<{ onGenerate: (formData: any) => void }> = ({ onGenerate }) => (
  <NPCGeneratorForm onGenerateNPC={onGenerate} />
);

const NPCSheetWrapper: React.ComponentType<{ data?: any }> = ({ data }) => (
  <NPCSheet npc={data} />
);

export const NPCCreation: React.FC = () => {
  return (
    <GeneratorContainer
      title="Geração de NPCs"
      description="Gere NPCs para sua campanha de RPG de forma rápida e fácil. Escolha entre geração automática aleatória ou controle manualmente as características."
      loadingMessage="Gerando NPC..."
      FormComponent={NPCFormWrapper}
      SheetComponent={NPCSheetWrapper}
      generateFunction={apiService.generateNPC}
    />
  );
};

export default NPCCreation;