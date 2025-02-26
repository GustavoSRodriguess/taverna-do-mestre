import React, { ReactNode } from 'react'
import  Header  from './Header';

interface PageType {
    children: ReactNode;
}

export const Page: React.FC<PageType> = ({ children }) => {
    return (
        <div className="font-sans bg-gradient-to-b from-blue-900 to-black text-white h-full">
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
    )
}
