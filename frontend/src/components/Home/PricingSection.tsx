import React from 'react';
import PricingCard from './PricingCard';

const PricingSection: React.FC = () => {
    const plans = [
        { title: 'Básico', price: 'Grátis', features: ['Mapas básicos', 'NPCs limitados'] },
        { title: 'Premium', price: '$10/mês', features: ['Mapas avançados', 'NPCs ilimitados', 'Narrativas dinâmicas'], isHighlighted: true },
        { title: 'Empresarial', price: '$25/mês', features: ['Tudo do Premium', 'Suporte prioritário'] },
    ];

    return (
        <section className="bg-gray-800 py-16">
            <div className="container mx-auto text-center">
                <h2 className="text-3xl font-bold font-cinzel mb-8">Planos Acessíveis para Todos</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <PricingCard key={index} {...plan} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PricingSection;