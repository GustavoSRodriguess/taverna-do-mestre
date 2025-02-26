import React, { ReactNode, useEffect } from 'react'
import Header from './Header';

interface PageType {
    children: ReactNode;
    theme?: 'cosmic' | 'enchanted' | 'mythical';
}

export const Page: React.FC<PageType> = ({ children, theme = 'cosmic' }) => {
    useEffect(() => {
        if (document.getElementById('cosmic-stars')) return;

        const starsContainer = document.createElement('div');
        starsContainer.id = 'cosmic-stars';
        starsContainer.className = 'fixed top-0 left-0 w-full h-full pointer-events-none z-0';

        for (let i = 0; i < 100; i++) {
            const star = document.createElement('div');
            const size = Math.random() * 0.2 + 0.1; 
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const duration = Math.random() * 3 + 2;
            const delay = Math.random() * 2;

            star.className = 'absolute rounded-full bg-white bg-opacity-80';
            star.style.width = `${size}rem`;
            star.style.height = `${size}rem`;
            star.style.left = `${x}%`;
            star.style.top = `${y}%`;
            star.style.animation = `twinkle ${duration}s infinite ${delay}s`;

            starsContainer.appendChild(star);
        }

        const style = document.createElement('style');
        style.textContent = `
            @keyframes twinkle {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(starsContainer);

        return () => {
            document.body.removeChild(starsContainer);
            document.head.removeChild(style);
        };
    }, []);

    const getBackgroundClasses = () => {
        switch (theme) {
            case 'cosmic':
                return 'bg-gradient-to-b from-indigo-950 via-purple-900 to-black';
            case 'enchanted':
                return 'bg-gradient-to-b from-emerald-950 via-teal-900 to-black';
            case 'mythical':
                return 'bg-gradient-to-b from-amber-950 via-orange-900 to-black';
            default:
                return 'bg-gradient-to-b from-indigo-950 via-purple-900 to-black';
        }
    };

    return (
        <div className={`font-serif ${getBackgroundClasses()} text-white min-h-screen relative`}>
            {/* Névoa animada */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full opacity-20 
                                bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] 
                                from-purple-400 via-transparent to-transparent"></div>

                <div className="absolute bottom-0 left-0 w-full h-2/3 opacity-10
                                bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))]
                                from-purple-400 via-transparent to-transparent animate-pulse"></div>
            </div>

            {/* Conteúdo */}
            <div className="relative z-10">
                <Header
                    logo="RPG Creator"
                    menuItems={[
                        { label: 'Início', href: '/' },
                        { label: 'Recursos', href: '/features' },
                        { label: 'Preços', href: '/pricing' },
                        { label: 'Contato', href: '/contact' },
                    ]}
                    ctaButton={{ label: 'Login/Registro', onClick: () => console.log('CTA clicked') }}
                />
                {children}
            </div>
        </div>
    )
}