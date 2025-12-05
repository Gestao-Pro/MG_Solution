
import React from 'react';
import { LucideProps } from 'lucide-react';

interface IconButtonProps {
    icon: React.ComponentType<LucideProps>;
    // Fix: Changed onClick prop type to allow passing mouse events, which is needed for stopPropagation.
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    className?: string;
    disabled?: boolean;
    tooltip?: string;
    size?: 'sm' | 'md';
}

const IconButton: React.FC<IconButtonProps> = ({ icon: Icon, onClick, className = '', disabled = false, tooltip, size = 'md' }) => {
    const sizeClasses = size === 'sm' ? 'p-1.5' : 'p-2.5';
    
    return (
        <div className="relative group flex items-center">
            <button
                onClick={onClick}
                disabled={disabled}
                className={`flex items-center justify-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${className}`}
            >
                <Icon className={size === 'sm' ? "w-4 h-4" : "w-5 h-5"} />
            </button>
            {tooltip && (
                <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-gray-700 dark:bg-black text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {tooltip}
                </div>
            )}
        </div>
    );
};

export default IconButton;
