import React, { ReactNode } from 'react'

interface CardBorder {
    className?: string;
    children: ReactNode;
}

export const CardBorder: React.FC<CardBorder> = ({className, children}) => {
  return (
      <div className={`p-6 border border-purple-600 rounded-lg ${className}`}>
        {children}    
      </div>
  )
}
