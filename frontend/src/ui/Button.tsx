import React from 'react'

interface buttonTypes {
  buttonLabel: string;
  onClick: () => void;
  classname?: string;
  type?: "submit" | "reset" | "button" | undefined;
  disabled?: boolean;
}

export const Button: React.FC<buttonTypes> = ({ buttonLabel, onClick, classname, type = 'button', disabled = false }) => {
  return (
    <button
      className={`bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center justify-center ${classname}`}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {buttonLabel}
    </button>
  )
}
