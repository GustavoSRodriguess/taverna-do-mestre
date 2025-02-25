import React from 'react';

interface SectionProps {
    title: string;
    children: React.ReactNode;
    className?: string;
}

const Section: React.FC<SectionProps> = ({ title, children, className = '' }) => {
    return (
        <section className={`py-16 ${className}`}>
            <div className="container mx-auto text-center">
                <h2 className="text-3xl font-bold font-cinzel mb-8">{title}</h2>
                {children}
            </div>
        </section>
    );
};

export default Section;