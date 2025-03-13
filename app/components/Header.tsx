'use client';

import React from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useDbContext } from '../lib/dbContext';

const Header: React.FC = () => {
  const { state, setSelectedCurrency, toggleDarkMode } = useDbContext();
  const { currencies, selectedCurrency, darkMode } = state;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm mb-6 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-primary dark:text-primary-dark mr-2">
            Splitwise
          </h1>
          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded">
            Beta
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Currency Selector */}
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="select-field-sm"
            aria-label="Select currency"
          >
            {currencies.map(currency => (
              <option key={currency.code} value={currency.code}>
                {currency.code} ({currency.symbol})
              </option>
            ))}
          </select>
          
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header; 