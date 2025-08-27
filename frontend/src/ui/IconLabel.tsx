import React from 'react';
import { LucideIcon } from 'lucide-react';

interface IconLabelProps {
    icon: LucideIcon;
    children: React.ReactNode;
    className?: string;
    iconClassName?: string;
    iconSize?: number;
    gap?: number;
}

const IconLabel: React.FC<IconLabelProps> = ({ 
    icon: Icon, 
    children, 
    className = "", 
    iconClassName = "", 
    iconSize = 5,
    gap = 2
}) => {
    const sizeClass = `w-${iconSize} h-${iconSize}`;
    const gapClass = `gap-${gap}`;
    
    return (
        <div className={`flex items-center ${gapClass} ${className}`}>
            <Icon className={`${sizeClass} ${iconClassName}`} />
            {children}
        </div>
    );
};

export default IconLabel;