import React from 'react';

interface InteractiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  color?: string;
  isActive?: boolean;
}

export default function InteractiveButton({ 
  label, 
  children,
  color = 'var(--color-vibrant-coral)', 
  className = '',
  isActive = false,
  ...props
}: InteractiveButtonProps) {
  return (
    <button
      {...props}
      className={`relative px-4 py-2 font-bold text-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ease-in-out active:scale-95 group ${
        className.includes('rounded-') ? '' : 'rounded-full'
      } ${className}`}
    >
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}
        style={{ backgroundColor: color }}
      />
      <span className="relative z-10 drop-shadow-sm flex items-center justify-center gap-2">
        {label || children}
      </span>
    </button>
  );
}
