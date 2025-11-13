import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface MenuItem {
    label: string;
    href: string;
}

interface HeaderProps {
    logo: string;
    menuItems: MenuItem[];
    ctaButton?: {
        label: string;
        onClick?: () => void;
    };
}

const Header: React.FC<HeaderProps> = ({ logo, menuItems }) => {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
        setUserMenuOpen(false);
    };

    return (
        <header className="text-white shadow-lg">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <Link to="/" className="text-2xl font-bold">
                        {logo}
                    </Link>

                    {/* Desktop menu */}
                    <nav className="hidden md:flex items-center space-x-8">
                        {menuItems.map((item, index) => (
                            <Link
                                key={index}
                                to={item.href}
                                className="text-white hover:text-indigo-300 transition-colors"
                            >
                                {item.label}
                            </Link>
                        ))}

                        {/* Links específicos para usuários autenticados */}
                        {isAuthenticated && (
                            <>
                                <Link
                                    to="/campaigns"
                                    className="text-white hover:text-indigo-300 transition-colors"
                                >
                                    Campanhas
                                </Link>
                                <Link
                                    to="/generator"
                                    className="text-white hover:text-indigo-300 transition-colors"
                                >
                                    Gerador
                                </Link>
                                <Link
                                    to="/characters"
                                    className="text-white hover:text-indigo-300 transition-colors"
                                >
                                    Meus Personagens
                                </Link>
                                <Link
                                    to="/homebrew"
                                    className="text-white hover:text-indigo-300 transition-colors"
                                >
                                    Homebrew
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* User actions */}
                    <div className="relative">
                        {isAuthenticated ? (
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center space-x-2 text-white hover:text-indigo-300"
                                >
                                    <span className="hidden sm:inline">{user?.username?.split(' ')[0]}</span>
                                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                                        {user?.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                </button>

                                {/* User dropdown menu */}
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 py-2 bg-indigo-800 rounded-md shadow-xl z-10 top-full">
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-sm text-indigo-100 hover:bg-indigo-700"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            Meu Perfil
                                        </Link>
                                        <Link
                                            to="/campaigns"
                                            className="block px-4 py-2 text-sm text-indigo-100 hover:bg-indigo-700"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            Minhas Campanhas
                                        </Link>
                                        <Link
                                            to="/generator"
                                            className="block px-4 py-2 text-sm text-indigo-100 hover:bg-indigo-700"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            Criar Personagem
                                        </Link>
                                        <Link
                                            to="/homebrew"
                                            className="block px-4 py-2 text-sm text-indigo-100 hover:bg-indigo-700"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            Homebrew
                                        </Link>
                                        <div className="border-t border-indigo-700 my-1"></div>
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-sm text-indigo-100 hover:bg-indigo-700"
                                        >
                                            Sair
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
                            >
                                Login / Registro
                            </Link>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden text-white"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <svg
                            className="h-6 w-6"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            {mobileMenuOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <nav className="md:hidden mt-4 pt-4 border-t border-indigo-800">
                        <div className="flex flex-col space-y-4">
                            {menuItems.map((item, index) => (
                                <Link
                                    key={index}
                                    to={item.href}
                                    className="text-white hover:text-indigo-300 transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            ))}

                            {isAuthenticated && (
                                <>
                                    <Link
                                        to="/campaigns"
                                        className="text-white hover:text-indigo-300"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Campanhas
                                    </Link>
                                    <Link
                                        to="/generator"
                                        className="text-white hover:text-indigo-300"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Gerador
                                    </Link>
                                    <Link
                                        to="/homebrew"
                                        className="text-white hover:text-indigo-300"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Homebrew
                                    </Link>
                                    <div className="border-t border-indigo-800 pt-4"></div>
                                    <Link
                                        to="/profile"
                                        className="text-white hover:text-indigo-300"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Meu Perfil
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="text-white hover:text-indigo-300 text-left"
                                    >
                                        Sair
                                    </button>
                                </>
                            )}
                        </div>
                    </nav>
                )}
            </div>
        </header>
    );
};

export default Header;