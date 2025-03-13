'use client';

import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useAppContext } from '../lib/context';

const DarkModeToggle: React.FC = () => {
  const { state, toggleDarkMode } = useAppContext();
  const { darkMode } = state;

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? (
        <FaSun className="text-yellow-400 text-xl" />
      ) : (
        <FaMoon className="text-gray-600 text-xl" />
      )}
    </button>
  );
};

export default DarkModeToggle; 