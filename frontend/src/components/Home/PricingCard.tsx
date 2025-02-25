import React from 'react';

interface PricingCardProps {
    title: string;
    price: string;
    features: string[];
    isHighlighted?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ title, price, features, isHighlighted = false }) => {
    return (
        <div className={`p-6 border border-purple-600 rounded-lg ${isHighlighted ? 'bg-gray-900' : ''}`}>
            <h3 className="text-xl font-bold font-cinzel mb-4">{title}</h3>
            <p className="text-gray-400 mb-4">{price}</p>
            <ul className="text-gray-400 mb-6">
                {features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                ))}
            </ul>
            <button className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700">
                Assinar
            </button>
        </div>
    );
};

export default PricingCard;