'use client';

import React, { useState } from 'react';
import { useDbContext } from '../lib/dbContext';
import { formatCurrency } from '../lib/utils';

const SettlementForm: React.FC = () => {
  const { state, addSettlement, loading } = useDbContext();
  const { people, balances, currencies, selectedCurrency, selectedGroup } = state;
  
  const [fromPersonId, setFromPersonId] = useState('');
  const [toPersonId, setToPersonId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(selectedCurrency);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the maximum amount that can be settled
  const getMaxSettlementAmount = (): number => {
    if (!fromPersonId || !toPersonId) return 0;
    
    const groupId = selectedGroup || 'all';
    
    if (!balances[groupId] || !balances[groupId][fromPersonId] || !balances[groupId][fromPersonId][toPersonId]) {
      return 0;
    }
    
    return Math.max(0, -balances[groupId][fromPersonId][toPersonId]);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!fromPersonId || !toPersonId || !amount) {
      setError('Please fill in all required fields');
      return;
    }
    
    const settlementAmount = parseFloat(amount);
    
    if (isNaN(settlementAmount) || settlementAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    try {
      setSubmitting(true);
      
      await addSettlement({
        fromPersonId,
        toPersonId,
        amount: settlementAmount,
        currency,
        groupId: selectedGroup === 'all' || selectedGroup === null ? undefined : selectedGroup,
      });
      
      // Reset form
      setFromPersonId('');
      setToPersonId('');
      setAmount('');
      setCurrency(selectedCurrency);
    } catch (err) {
      console.error('Error adding settlement:', err);
      setError('Failed to add settlement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Get people who owe money
  const getDebtors = () => {
    const groupId = selectedGroup || 'all';
    
    return people.filter(person => {
      if (!balances[groupId]) return false;
      
      // Check if this person owes money to anyone
      return Object.keys(balances[groupId][person.id] || {}).some(
        otherPersonId => balances[groupId][person.id][otherPersonId] < 0
      );
    });
  };

  // Get people who are owed money by the selected debtor
  const getCreditors = () => {
    if (!fromPersonId) return [];
    
    const groupId = selectedGroup || 'all';
    
    return people.filter(person => {
      if (person.id === fromPersonId || !balances[groupId]) return false;
      
      // Check if the selected debtor owes money to this person
      return balances[groupId][fromPersonId][person.id] < 0;
    });
  };

  const debtors = getDebtors();
  const creditors = getCreditors();
  const maxAmount = getMaxSettlementAmount();

  return (
    <div className="mb-6 card">
      <h2 className="text-xl font-semibold mb-4 text-text dark:text-text-dark">Settle Up</h2>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
          {error}
        </div>
      )}
      
      {debtors.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center">No settlements needed.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="fromPerson" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Who is paying
            </label>
            <select
              id="fromPerson"
              value={fromPersonId}
              onChange={(e) => {
                setFromPersonId(e.target.value);
                setToPersonId('');
                setAmount('');
              }}
              className="select-field"
              required
            >
              <option value="">Select a person</option>
              {debtors.map(person => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
          
          {fromPersonId && (
            <div className="mb-4">
              <label htmlFor="toPerson" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Who is receiving
              </label>
              <select
                id="toPerson"
                value={toPersonId}
                onChange={(e) => {
                  setToPersonId(e.target.value);
                  setAmount('');
                }}
                className="select-field"
                required
              >
                <option value="">Select a person</option>
                {creditors.map(person => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {fromPersonId && toPersonId && (
            <>
              <div className="mb-4">
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Currency
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="select-field"
                  required
                >
                  {currencies.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.code} - {curr.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                    max={maxAmount.toString()}
                    className="input-field"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setAmount(maxAmount.toString())}
                    className="ml-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-text dark:text-text-dark rounded"
                  >
                    Max
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maximum amount: {formatCurrency(maxAmount, selectedCurrency, currencies)}
                </p>
              </div>
              
              <button
                type="submit"
                className="w-full btn-primary"
                disabled={loading || submitting || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount}
              >
                {submitting ? 'Settling...' : 'Settle Up'}
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );
};

export default SettlementForm; 