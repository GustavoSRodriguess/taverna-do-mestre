import React from 'react';

const DemoSection: React.FC = () => {
    return (
        <section className="bg-gray-800 py-16">
            <div className="container mx-auto text-center">
                <h2 className="text-3xl font-bold font-cinzel mb-8">Veja Como Funciona</h2>
                <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
                    <p className="text-gray-400 mb-4">Aqui vai um vídeo ou GIF demonstrando a plataforma.</p>
                    <button className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700">
                        Experimente Grátis
                    </button>
                </div>
            </div>
        </section>
    );
};

export default DemoSection;