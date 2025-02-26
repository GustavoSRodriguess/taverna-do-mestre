import React from 'react';
import { Button } from './Button';

interface ButtonProps {
    label: string;
    className?: string;
    onClick: () => void;
}

interface CardProps {
    icon?: string;
    title: string;
    description: string;
    className?: string;
    button?: ButtonProps;
}

const Card: React.FC<CardProps> = ({ icon, title, description, className = '', button }) => {
    return (
        <div className={`p-6 border border-purple-600 rounded-lg ${className}`}>
            {icon && <div className="text-purple-500 text-4xl mb-4">{icon}</div>}
            <h3 className="text-xl font-bold font-cinzel mb-2">{title}</h3>
            <p className="text-gray-400">{description}</p>
            {button && 
                <Button buttonLabel={button.label} onClick={button.onClick} classname={button.className} />
            }
        </div>
    );
};

export default Card;