'use client';

import React from 'react';
import { useDbContext } from '../lib/dbContext';
import { formatCurrency } from '../lib/utils';

const BalancesSummary: React.FC = () => {
  const { state } = useDbContext();
  const { people, balances, currencies, selectedCurrency, selectedGroup } = state;

  // Get non-zero balances for the selected group
  const getNonZeroBalances = () => {
    const groupId = selectedGroup || 'all';
    
    if (!balances[groupId]) {
      return [];
    }
    
    const result = [];
    
    for (const personId in balances[groupId]) {
      let totalOwed = 0;
      let totalOwes = 0;
      
      for (const otherPersonId in balances[groupId][personId]) {
        const balance = balances[groupId][personId][otherPersonId];
        
        if (balance > 0) {
          totalOwed += balance;
        } else if (balance < 0) {
          totalOwes += Math.abs(balance);
        }
      }
      
      const netBalance = totalOwed - totalOwes;
      
      if (Math.abs(netBalance) > 0.01) {
        const person = people.find(p => p.id === personId);
        
        if (person) {
          result.push({
            personId,
            name: person.name,
            balance: netBalance,
          });
        }
      }
    }
    
    return result.sort((a, b) => b.balance - a.balance);
  };

  const nonZeroBalances = getNonZeroBalances();

  if (nonZeroBalances.length === 0) {
    return (
      <div className="mb-6 card">
        <h2 className="text-xl font-semibold mb-4 text-text dark:text-text-dark">Balances Summary</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center">No balances to show.</p>
      </div>
    );
  }

  return (
    <div className="mb-6 card">
      <h2 className="text-xl font-semibold mb-4 text-text dark:text-text-dark">Balances Summary</h2>
      
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {nonZeroBalances.map(({ personId, name, balance }) => {
          let balanceClass = 'text-gray-500 dark:text-gray-400';
          let balanceText = 'is settled up';
          
          if (balance > 0) {
            balanceClass = 'text-green-600 dark:text-green-400';
            balanceText = `gets back ${formatCurrency(balance, selectedCurrency, currencies)}`;
          } else if (balance < 0) {
            balanceClass = 'text-red-600 dark:text-red-400';
            balanceText = `owes ${formatCurrency(Math.abs(balance), selectedCurrency, currencies)}`;
          }
          
          return (
            <li key={personId} className="py-3 flex items-center justify-between">
              <span className="text-text dark:text-text-dark">{name}</span>
              <span className={balanceClass}>{balanceText}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default BalancesSummary; 