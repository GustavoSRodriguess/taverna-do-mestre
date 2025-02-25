import React from 'react';

interface HeaderProps {
    logo: string;
    menuItems: { label: string; href: string }[];
    ctaButton: { label: string; onClick: () => void };
}

const Header: React.FC<HeaderProps> = ({ logo, menuItems, ctaButton }) => {
    return (
        <header className="p-4">
            <div className="container mx-auto flex justify-between items-center">
                <div className="text-2xl font-bold font-cinzel">{logo}</div>
                <nav>
                    <ul className="flex space-x-4">
                        {menuItems.map((item, index) => (
                            <li key={index}>
                                <a href={item.href} className="hover:text-purple-500">
                                    {item.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
                <button
                    onClick={ctaButton.onClick}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                    {ctaButton.label}
                </button>
            </div>
        </header>
    );
};

export default Header;