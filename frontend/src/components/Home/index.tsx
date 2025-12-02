import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Castle, FlaskConical, Wand2 } from 'lucide-react';
import { Card, Footer, Page, Section } from '../../ui';
import { useAuth } from '../../context/AuthContext';
import TestimonialCard from './TestimonialCard';
import PricingSection from './PricingSection';
import DemoSection from './DemoSection';

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    return (
        <Page>
            <Section title="Crie Campanhas de RPG Incríveis" className="py-20">
                <p></p>
            </Section>

            <Section title="O Que Você Pode Fazer?" className="bg-gray-900">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card
                        icon={<Castle className="h-7 w-7" />}
                        title="Gerenciar Campanhas"
                        description="Crie e gerencie suas campanhas de RPG. Convide jogadores, organize personagens e acompanhe o progresso."
                        button={{
                            label: isAuthenticated ? 'Minhas Campanhas' : 'Começar',
                            onClick: () => navigate(isAuthenticated ? '/campaigns' : '/login'),
                            className: 'mt-4'
                        }}
                    />
                    <Card
                        icon={<Wand2 className="h-7 w-7" />}
                        title="Criação de PCs e NPCs"
                        description="Gere personagens e NPCs únicos com atributos e histórias detalhadas."
                        button={{
                            label: 'Ir para Gerador',
                            onClick: () => navigate(isAuthenticated ? '/generator' : '/login'),
                            className: 'mt-4'
                        }}
                    />
                    <Card
                        icon={<FlaskConical className="h-7 w-7" />}
                        title="Homebrew"
                        description="Crie e gerencie conteúdo exclusivo para suas mesas: classes, itens, talentos e muito mais."
                        button={{
                            label: isAuthenticated ? 'Abrir Homebrew' : 'Fazer login',
                            onClick: () => navigate(isAuthenticated ? '/homebrew' : '/login'),
                            className: 'mt-4'
                        }}
                    />
                </div>
            </Section>

            <DemoSection />

            <Section title="O Que Nossos Usuários Dizem" className="bg-gray-900">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <TestimonialCard
                        text="O sistema de campanhas mudou completamente minhas sessões de RPG. Organizar jogadores e personagens nunca foi tão fácil!"
                        author="João, Mestre de RPG"
                    />
                    <TestimonialCard
                        text="Poder reutilizar meus personagens em diferentes campanhas é incrível. O sistema é muito intuitivo!"
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
