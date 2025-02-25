import React from 'react';
import Section from '../../ui/Section';
import { Button } from '../../ui/Button';
import Card from '../../ui/Card';
import Footer from '../../ui/Footer';
import TestimonialCard from './TestimonialCard';
import { Page } from '../../ui/Page';
import PricingSection from './PricingSection';
import DemoSection from './DemoSection';

const HomePage: React.FC = () => {
    return (
        <Page>
            <Section title="Crie Campanhas de RPG Incríveis" className="py-20">
                <Button buttonLabel="Comece Agora" onClick={() => console.log('Button clicked')} />
            </Section>

            <Section title="O Que Você Pode Fazer?" className="bg-gray-900">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card
                        icon="🗺️"
                        title="Geração de Mapas"
                        description="Crie mapas personalizados com algoritmos de geração procedural."
                    />
                    <Card
                        icon="🧙"
                        title="Criação de NPCs"
                        description="Gere NPCs únicos com atributos e histórias detalhadas."
                    />
                    <Card
                        icon="📖"
                        title="Narrativas Dinâmicas"
                        description="Crie narrativas adaptáveis com base nas escolhas dos jogadores."
                    />
                </div>
            </Section>

            <DemoSection/>

            <Section title="O Que Nossos Usuários Dizem" className="bg-gray-900">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <TestimonialCard
                        text="Essa plataforma mudou completamente minhas sessões de RPG. Recomendo!"
                        author="João, Mestre de RPG"
                        />
                    <TestimonialCard
                        text="A geração de mapas é incrível. Economiza horas de trabalho!"
                        author="Maria, Jogadora"
                        />
                </div>
            </Section>

            <PricingSection />
            
            <Footer />
        </Page>
    );
};

export default HomePage;