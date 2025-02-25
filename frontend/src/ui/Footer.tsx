import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-900 py-8">
            <div className="container mx-auto text-center">
                <div className="mb-6">
                    <ul className="flex justify-center space-x-6">
                        <li><a href="#" className="hover:text-purple-500">Sobre Nós</a></li>
                        <li><a href="#" className="hover:text-purple-500">Suporte</a></li>
                        <li><a href="#" className="hover:text-purple-500">Termos de Uso</a></li>
                    </ul>
                </div>
                <div className="mb-6">
                    <p className="text-gray-400">Siga-nos:</p>
                    <div className="flex justify-center space-x-4">
                        <a href="#" className="text-gray-400 hover:text-purple-500">Twitter</a>
                        <a href="#" className="text-gray-400 hover:text-purple-500">Instagram</a>
                        <a href="#" className="text-gray-400 hover:text-purple-500">Discord</a>
                    </div>
                </div>
                <div>
                    <p className="text-gray-400">Assine nossa newsletter:</p>
                    <div className="flex justify-center mt-2">
                        <input
                            type="email"
                            placeholder="Seu e-mail"
                            className="px-4 py-2 rounded-l-lg bg-gray-800 text-white focus:outline-none"
                        />
                        <button className="bg-purple-600 text-white px-4 py-2 rounded-r-lg hover:bg-purple-700">
                            Assinar
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;