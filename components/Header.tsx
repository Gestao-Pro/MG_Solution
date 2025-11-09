
import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import IconButton from './IconButton';
import { UserProfile } from '../types';

interface HeaderProps {
    toggleSidebar: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    userProfile: UserProfile;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, theme, toggleTheme, userProfile }) => {
    const userInitial = userProfile.userName ? userProfile.userName.charAt(0).toUpperCase() : '?';

    return (
        <header className="flex-shrink-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
            <IconButton 
                icon={Menu} 
                onClick={toggleSidebar} 
                tooltip="Mostrar/Esconder Menu" 
                className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            />
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate" style={{maxWidth: '150px'}}>{userProfile.userName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate" style={{maxWidth: '150px'}}>{userProfile.userRole}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {userInitial}
                    </div>
                </div>
                <IconButton 
                    icon={theme === 'dark' ? Sun : Moon} 
                    onClick={toggleTheme} 
                    tooltip={theme === 'dark' ? "Modo Claro" : "Modo Escuro"} 
                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                />
            </div>
        </header>
    );
};

export default Header;